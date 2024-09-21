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
exports.ChatController = void 0;
const chat_1 = __importDefault(require("../models/chat"));
const message_1 = __importDefault(require("../models/message"));
class ChatController {
    getChatForUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { participant1, participant2 } = req.query;
            if (!participant1 || !participant2) {
                res.status(400).send({ message: 'Both participant1 and participant2 are required' });
                return;
            }
            try {
                const chat = yield chat_1.default.findOne({
                    $or: [
                        { participant1, participant2 },
                        { participant1: participant2, participant2: participant1 }
                    ]
                });
                res.status(200).send(chat || null);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching chat', error });
            }
        });
    }
    getChatsForUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.query;
            if (!username) {
                res.status(400).send({ message: 'Username is required' });
                return;
            }
            try {
                const chats = yield chat_1.default.find({
                    $or: [
                        { participant1: username },
                        { participant2: username }
                    ]
                });
                // Create a map to store message counts and chat status for each user
                const messagesMap = {};
                // Iterate over each chat to count total and unread messages and track chat status
                for (const chat of chats) {
                    const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
                    if (otherParticipant) {
                        // Count total messages between both participants (both sent and received)
                        const totalMessagesCount = yield message_1.default.countDocuments({
                            $or: [
                                { sender: username, receiver: otherParticipant },
                                { sender: otherParticipant, receiver: username }
                            ]
                        });
                        // Count unread messages sent by the other participant (messages the current user has not read)
                        const unreadMessagesCount = yield message_1.default.countDocuments({
                            sender: otherParticipant,
                            receiver: username,
                            isRead: false
                        });
                        // Initialize map entry if not present
                        if (!messagesMap[otherParticipant]) {
                            messagesMap[otherParticipant] = {
                                totalMessages: 0,
                                unreadMessages: 0,
                                isAccepted: chat.isAccepted || false
                            };
                        }
                        // Update the map with the counts
                        messagesMap[otherParticipant].totalMessages += totalMessagesCount;
                        messagesMap[otherParticipant].unreadMessages += unreadMessagesCount;
                    }
                }
                // Map over the users and append the total, unread messages count, chat existence, and acceptance status
                const chatsWithMessageCounts = chats.map(chat => {
                    var _a, _b, _c;
                    const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
                    return {
                        chat: chat,
                        totalMessages: otherParticipant ? ((_a = messagesMap[otherParticipant]) === null || _a === void 0 ? void 0 : _a.totalMessages) || 0 : 0,
                        unreadMessages: otherParticipant ? ((_b = messagesMap[otherParticipant]) === null || _b === void 0 ? void 0 : _b.unreadMessages) || 0 : 0,
                        isAccepted: otherParticipant ? ((_c = messagesMap[otherParticipant]) === null || _c === void 0 ? void 0 : _c.isAccepted) || false : false
                    };
                });
                // Return the users with message counts and chat status
                res.status(200).json(chatsWithMessageCounts);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching chats', error });
            }
        });
    }
    static rejectChat(participant1, participant2) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!participant1 || !participant2) {
                throw new Error('Both participant1 and participant2 are required');
            }
            try {
                const chat = yield chat_1.default.findOneAndDelete({
                    $or: [
                        { participant1, participant2 },
                        { participant1: participant2, participant2: participant1 }
                    ]
                });
                if (!chat) {
                    throw new Error('Chat not found');
                }
                yield message_1.default.deleteMany({
                    $or: [
                        { sender: participant1, receiver: participant2 },
                        { sender: participant2, receiver: participant1 }
                    ]
                });
                return true;
            }
            catch (error) {
                console.error('Error rejecting chat:', error);
                throw new Error('Server error rejecting chat');
            }
        });
    }
    static acceptChat(participant1, participant2) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!participant1 || !participant2) {
                throw new Error('Both participant1 and participant2 are required');
            }
            try {
                const chat = yield chat_1.default.findOne({
                    $or: [
                        { participant1, participant2 },
                        { participant1: participant2, participant2: participant1 }
                    ]
                });
                if (!chat) {
                    throw new Error('Chat not found');
                }
                chat.isAccepted = true;
                yield chat.save();
                return true;
            }
            catch (error) {
                console.error('Error accepting chat:', error);
                throw new Error('Server error accepting chat');
            }
        });
    }
}
exports.ChatController = ChatController;
