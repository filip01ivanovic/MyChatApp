"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const user_router_1 = __importDefault(require("./routers/user.router"));
const chat_router_1 = __importDefault(require("./routers/chat.router"));
const message_router_1 = __importDefault(require("./routers/message.router"));
const message_controller_1 = require("./controllers/message.controller");
const chat_controller_1 = require("./controllers/chat.controller");
// Initialize Express app
const app = (0, express_1.default)();
require('dotenv').config();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mongo connection
mongoose_1.default.connect(process.env.DB_URL || '');
const conn = mongoose_1.default.connection;
conn.once('open', () => {
    console.log("DB connected");
});
// Express routes
const router = express_1.default.Router();
router.use('/users', user_router_1.default);
router.use('/chats', chat_router_1.default);
router.use('/messages', message_router_1.default);
router.use('/files', express_1.default.static('files'));
app.use("/", router);
// HTTP server to integrate with Socket.io
const httpServer = http_1.default.createServer(app);
// Initialize Socket.io server and attach to HTTP server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
let userSocketMap = {};
io.on('connect', (socket) => {
    console.log('User connected (backend). Socket ID: ', socket.id);
    socket.on('userLogin', (username) => {
        userSocketMap[username] = socket.id;
        console.log(`User ${username} connected with socket ID: ${socket.id}`);
        console.log('User socket map:', userSocketMap);
    });
    socket.on('initialMessage', (messageData) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Initial message received:', messageData);
        const { sender, receiver, messageType, textMessage, voiceMessageUrl } = messageData;
        try {
            const response = yield message_controller_1.MessageController.sendInitialMessage(sender, receiver, messageType, textMessage, voiceMessageUrl);
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
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }));
    socket.on('rejectChat', (chatData) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Reject chat received:', chatData);
        const { participant1, participant2 } = chatData;
        try {
            const response = yield chat_controller_1.ChatController.rejectChat(participant1, participant2);
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
        }
        catch (error) {
            console.error('Error rejecting chat:', error);
        }
    }));
    socket.on('acceptChat', (chatData) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Accept chat received:', chatData);
        const { participant1, participant2 } = chatData;
        try {
            const response = yield chat_controller_1.ChatController.acceptChat(participant1, participant2);
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
        }
        catch (error) {
            console.error('Error accepting chat:', error);
        }
    }));
    socket.on('newMessage', (messageData) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('New message received:', messageData);
        const { sender, receiver, messageType, textMessage, voiceMessageUrl } = messageData;
        try {
            const response = yield message_controller_1.MessageController.addNewMessage(sender, receiver, messageType, textMessage, voiceMessageUrl);
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
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }));
    socket.on('userLogout', (username) => {
        if (userSocketMap[username] === socket.id) {
            delete userSocketMap[username];
            console.log(`User ${username} disconnected. Socket ID: ${socket.id} removed`);
        }
        else {
            console.log(`User ${username} attempted to logout, but socket ID does not match.`);
        }
    });
});
// Start HTTP server with Socket.io listening on port 4000
httpServer.listen(process.env.PORT, () => {
    console.log('Server with WebSockets running on port 4000');
});
