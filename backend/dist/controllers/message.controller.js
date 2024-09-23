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
exports.MessageController = void 0;
const chat_1 = __importDefault(require("../models/chat"));
const message_1 = __importDefault(require("../models/message"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require('dotenv').config();
class MessageController {
    constructor() {
        this.getMessagesForChat = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { participant1, participant2 } = req.query;
            if (!participant1 || !participant2) {
                return res.status(400).json({ message: 'Both participant1 and participant2 are required' });
            }
            try {
                const chat = yield chat_1.default.findOne({
                    $or: [
                        { participant1, participant2 },
                        { participant1: participant2, participant2: participant1 }
                    ]
                });
                if (!chat) {
                    return res.status(404).json({ message: 'Chat not found' });
                }
                const messages = yield message_1.default.find({
                    $or: [
                        { sender: participant1, receiver: participant2 },
                        { sender: participant2, receiver: participant1 }
                    ]
                }).sort({ sentAt: 1 });
                res.status(200).json(messages);
            }
            catch (error) {
                console.error('Error fetching messages:', error);
                res.status(500).json({ message: 'Server error fetching messages' });
            }
        });
        this.setMessagesToRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { participant1, participant2 } = req.body;
            if (!participant1 || !participant2) {
                return res.status(400).json({ message: 'Both participant1 and participant2 are required' });
            }
            try {
                const chat = yield chat_1.default.findOne({
                    $or: [
                        { participant1, participant2 },
                        { participant1: participant2, participant2: participant1 }
                    ]
                });
                if (!chat) {
                    return res.status(404).json({ message: 'Chat not found' });
                }
                yield message_1.default.updateMany({ sender: participant2, receiver: participant1, isRead: false }, { isRead: true });
                res.status(200).json({ message: 'Messages set to read' });
            }
            catch (error) {
                console.error('Error setting messages to read:', error);
                res.status(500).json({ message: 'Server error setting messages to read' });
            }
        });
        this.setOneMessageToRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { _id } = req.body;
            if (!_id) {
                return res.status(400).json({ message: 'Message ID is required' });
            }
            try {
                const message = yield message_1.default.findById(_id);
                if (!message) {
                    return res.status(404).json({ message: 'Message not found' });
                }
                message.isRead = true;
                yield message.save();
                res.status(200).json({ message: 'Message set to read' });
            }
            catch (error) {
                console.error('Error setting message to read:', error);
                res.status(500).json({ message: 'Server error setting message to read' });
            }
        });
    }
    static sendInitialMessage(sender, receiver, messageType, textMessage, voiceMessageDuration, voiceMessageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sender || !receiver || !messageType || (!textMessage && !voiceMessageUrl)) {
                throw new Error('Sender ID, receiver ID, message type and message are required');
            }
            try {
                let chat = yield chat_1.default.findOne({
                    $or: [
                        { participant1: sender, participant2: receiver },
                        { participant1: receiver, participant2: sender }
                    ]
                });
                const sentAt = new Date();
                if (!chat) {
                    chat = new chat_1.default({
                        participant1: sender,
                        participant2: receiver,
                        lastMessage: {
                            messageType,
                            text: messageType === 'voice' ? 'Voice message' : (textMessage || ''),
                            sentAt
                        },
                        isAccepted: false
                    });
                    yield chat.save();
                }
                const newMessage = new message_1.default({
                    sender,
                    receiver,
                    messageType,
                    textMessage,
                    voiceMessageDuration,
                    voiceMessageUrl,
                    sentAt
                });
                yield newMessage.save();
                return newMessage;
            }
            catch (error) {
                console.error('Error sending initial message:', error);
                throw new Error('Server error sending initial message');
            }
        });
    }
    static addNewMessage(sender, receiver, messageType, textMessage, voiceMessageDuration, voiceMessageData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sender || !receiver || !messageType || (!textMessage && !voiceMessageData)) {
                throw new Error('Sender ID, receiver ID, message type and message are required');
            }
            try {
                let chat = yield chat_1.default.findOne({
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
                yield chat.save();
                let voiceMessageUrl = '';
                if (voiceMessageData) {
                    const voiceMessageFileName = `${sender}_${receiver}_${sentAt.getTime()}.wav`;
                    const voiceMessageFilePath = path_1.default.join(__dirname, `../../files/voice_messages/${voiceMessageFileName}`);
                    const base64Data = voiceMessageData.split(',')[1];
                    fs_1.default.writeFileSync(voiceMessageFilePath, base64Data, 'base64');
                    voiceMessageUrl = `http://${process.env.IP}:${process.env.PORT}/files/voice_messages/${voiceMessageFileName}`;
                }
                const newMessage = new message_1.default({
                    sender,
                    receiver,
                    messageType,
                    textMessage,
                    voiceMessageDuration,
                    voiceMessageUrl,
                    sentAt
                });
                yield newMessage.save();
                return newMessage;
            }
            catch (error) {
                console.error('Error sending message:', error);
                throw new Error('Server error sending message');
            }
        });
    }
}
exports.MessageController = MessageController;
