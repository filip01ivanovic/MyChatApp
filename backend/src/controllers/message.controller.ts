import express from 'express';
import ChatModel from '../models/chat';
import MessageModel from '../models/message';
import UserModel from '../models/user';
import fs from 'fs';
import path from 'path';

require('dotenv').config();

export class MessageController {

    public getMessagesForChat = async (req: express.Request, res: express.Response) => {
        const { participant1, participant2 } = req.query;

        if (!participant1 || !participant2) {
            return res.status(400).json({ message: 'Both participant1 and participant2 are required' });
        }

        try {
            const chat = await ChatModel.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });

            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            const messages = await MessageModel.find({ 
                $or: [
                    { sender: participant1, receiver: participant2 },
                    { sender: participant2, receiver: participant1 }
                ]
            }).sort({ sentAt: 1 });

            res.status(200).json(messages);

        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Server error fetching messages' });
        }
    };

    public static async sendInitialMessage(sender: any, receiver: any, messageType: any, textMessage: any, voiceMessageDuration: any, voiceMessageUrl: any) {
        if (!sender || !receiver || !messageType || (!textMessage && !voiceMessageUrl)) {
            throw new Error('Sender ID, receiver ID, message type and message are required');
        }

        try {
            let chat = await ChatModel.findOne({
                $or: [
                    { participant1: sender, participant2: receiver },
                    { participant1: receiver, participant2: sender }
                ]
            });

            const sentAt = new Date();

            if (!chat) {
                chat = new ChatModel({
                    participant1: sender,
                    participant2: receiver,
                    lastMessage: {
                        messageType,
                        text: messageType === 'voice' ? 'Voice message' : (textMessage || ''),
                        sentAt
                    },
                    isAccepted: false
                });

                await chat.save();
            }

            const newMessage = new MessageModel({
                sender,
                receiver,
                messageType,
                textMessage,
                voiceMessageDuration,
                voiceMessageUrl,
                sentAt
            });

            await newMessage.save();

            return newMessage;

        } catch (error) {
            console.error('Error sending initial message:', error);
            throw new Error('Server error sending initial message');
        }
    }

    public static async addNewMessage(sender: any, receiver: any, messageType: any, textMessage: any, voiceMessageDuration: any, voiceMessageData: any) {
        if (!sender || !receiver || !messageType || (!textMessage && !voiceMessageData)) {
            throw new Error('Sender ID, receiver ID, message type and message are required');
        }

        try {
            let chat = await ChatModel.findOne({
                $or: [
                    { participant1: sender, participant2: receiver },
                    { participant1: receiver, participant2: sender }
                ]
            });

            const sentAt = new Date();

            if (!chat) {
                throw new Error('Chat not found');
            }

            chat.lastMessage = {
                messageType,
                text: messageType === 'voice' ? 'Voice message' : (textMessage || ''),
                sentAt
            };

            await chat.save();

            let voiceMessageUrl = '';
            if (voiceMessageData) {
                const voiceMessageFileName = `${sender}_${receiver}_${sentAt.getTime()}.wav`;
                const voiceMessageFilePath = path.join(__dirname, `../../files/voice_messages/${voiceMessageFileName}`);
                const base64Data = voiceMessageData.split(',')[1];
                fs.writeFileSync(voiceMessageFilePath, base64Data, 'base64');
                voiceMessageUrl = `http://${process.env.IP}:${process.env.PORT}/files/voice_messages/${voiceMessageFileName}`;
            }
            
            const newMessage = new MessageModel({
                sender,
                receiver,
                messageType,
                textMessage,
                voiceMessageDuration,
                voiceMessageUrl,
                sentAt
            });

            await newMessage.save();

            return newMessage;

        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Server error sending message');
        }
    }

    public setMessagesToRead = async (req: express.Request, res: express.Response) => {
        const { participant1, participant2 } = req.body;

        if (!participant1 || !participant2) {
            return res.status(400).json({ message: 'Both participant1 and participant2 are required' });
        }

        try {
            const chat = await ChatModel.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });

            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            await MessageModel.updateMany(
                { sender: participant2, receiver: participant1, isRead: false },
                { isRead: true }
            );

            res.status(200).json({ message: 'Messages set to read' });

        } catch (error) {
            console.error('Error setting messages to read:', error);
            res.status(500).json({ message: 'Server error setting messages to read' });
        }
    };

    setOneMessageToRead = async (req: express.Request, res: express.Response) => {
        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({ message: 'Message ID is required' });
        }

        try {
            const message = await MessageModel.findById(_id);

            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }

            message.isRead = true;
            await message.save();

            res.status(200).json({ message: 'Message set to read' });

        } catch (error) {
            console.error('Error setting message to read:', error);
            res.status(500).json({ message: 'Server error setting message to read' });
        }
    }
}
