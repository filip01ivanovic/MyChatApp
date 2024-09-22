import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

import userRouter from './routers/user.router';
import chatRouter from './routers/chat.router';
import messageRouter from './routers/message.router';
import { MessageController } from './controllers/message.controller';
import { ChatController } from './controllers/chat.controller';

// Initialize Express app
const app = express();

require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// Mongo connection
mongoose.connect(process.env.DB_URL || '');
const conn = mongoose.connection;
conn.once('open', () => {
    console.log("DB connected");
});

// Express routes
const router = express.Router();
router.use('/users', userRouter);
router.use('/chats', chatRouter);
router.use('/messages', messageRouter);
router.use('/files', express.static('files'));
app.use("/", router);

// HTTP server to integrate with Socket.io
const httpServer = http.createServer(app);

// Initialize Socket.io server and attach to HTTP server
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow cross-origin requests (adjust according to your needs)
        methods: ["GET", "POST"]
    }
});

let userSocketMap: { [username: string]: string } = {};

io.on('connect', (socket) => {
    console.log('User connected (backend). Socket ID: ', socket.id);

    socket.on('userLogin', (username: string) => {
        userSocketMap[username] = socket.id;
        console.log(`User ${username} connected with socket ID: ${socket.id}`);

        console.log('User socket map:', userSocketMap);
    });

    socket.on('initialMessage', async (messageData) => {
        console.log('Initial message received:', messageData);

        const { sender, receiver, messageType, textMessage, voiceMessageUrl } = messageData;
        
        try {
            const response = await MessageController.sendInitialMessage(sender, receiver, messageType, textMessage, voiceMessageUrl);
            console.log('Message sent successfully:', response);

            const senderSocketId = userSocketMap[sender];
            if (senderSocketId) {
                io.to(senderSocketId).emit('initialMessageSuccess', response);
                console.log(`Initial message sent to ${receiver} at socket ID: ${senderSocketId}`);
            }
            const receiverSocketId = userSocketMap[receiver];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('initialMessageSuccess', response);
                console.log(`Initial message sent to ${receiver} at socket ID: ${receiverSocketId}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('rejectChat', async (chatData) => {
        console.log('Reject chat received:', chatData);

        const { participant1, participant2 } = chatData;

        try {
            const response = await ChatController.rejectChat(participant1, participant2);
            console.log('Chat rejected successfully:', response);

            const participant1SocketId = userSocketMap[participant1];
            if (participant1SocketId) {
                io.to(participant1SocketId).emit('rejectChatSuccess', response);
                console.log(`Chat rejection sent to ${participant1} at socket ID: ${participant1SocketId}`);
            }
            const participant2SocketId = userSocketMap[participant2];
            if (participant2SocketId) {
                io.to(participant2SocketId).emit('rejectChatSuccess', response);
                console.log(`Chat rejection sent to ${participant2} at socket ID: ${participant2SocketId}`);
            }
        } catch (error) {
            console.error('Error rejecting chat:', error);
        }
    });

    socket.on('acceptChat', async (chatData) => {
        console.log('Accept chat received:', chatData);

        const { participant1, participant2 } = chatData;

        try {
            const response = await ChatController.acceptChat(participant1, participant2);
            console.log('Chat accepted successfully:', response);

            const participant1SocketId = userSocketMap[participant1];
            if (participant1SocketId) {
                io.to(participant1SocketId).emit('acceptChatSuccess', response);
                console.log(`Chat acceptance sent to ${participant1} at socket ID: ${participant1SocketId}`);
            }
            const participant2SocketId = userSocketMap[participant2];
            if (participant2SocketId) {
                io.to(participant2SocketId).emit('acceptChatSuccess', response);
                console.log(`Chat acceptance sent to ${participant2} at socket ID: ${participant2SocketId}`);
            }
        } catch (error) {
            console.error('Error accepting chat:', error);
        }
    });

    socket.on('newMessage', async (messageData) => {
        console.log('New message received:', messageData);

        // const { sender, receiver, messageType, textMessage, voiceMessageUrl } = messageData;
        const { sender, receiver, messageType, textMessage, voiceMessageSound, voiceMessageDuration, voiceMessageData } = messageData;

        // console.log('Voice message sound:', voiceMessageSound);
        // console.log('Voice message duration:', voiceMessageDuration);
        // console.log('Voice message data:', voiceMessageData);

        try {
            const response = await MessageController.addNewMessage(sender, receiver, messageType, textMessage, voiceMessageSound, voiceMessageDuration, voiceMessageData);
            console.log('Message sent successfully:', response);

            const senderSocketId = userSocketMap[sender];
            if (senderSocketId) {
                io.to(senderSocketId).emit('newMessageSuccess', response);
                console.log(`Message sent to ${receiver} at socket ID: ${senderSocketId}`);
            }
            const receiverSocketId = userSocketMap[receiver];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessageSuccess', response);
                console.log(`Message sent to ${receiver} at socket ID: ${receiverSocketId}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('userLogout', (username: string) => {
        if (userSocketMap[username] === socket.id) {
            delete userSocketMap[username];
            console.log(`User ${username} disconnected. Socket ID: ${socket.id} removed`);
        } else {
            console.log(`User ${username} attempted to logout, but socket ID does not match.`);
        }
    });
});

// Start HTTP server with Socket.io listening on port 4000
httpServer.listen(process.env.PORT, () => {
    console.log('Server with WebSockets running on port 4000');
});