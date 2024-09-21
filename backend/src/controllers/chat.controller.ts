import express from 'express';
import ChatModel from '../models/chat';
import MessageModel from '../models/message';

export class ChatController {
    public async getChatForUsers(req: express.Request, res: express.Response): Promise<void> {
        const { participant1, participant2 } = req.query;

        if (!participant1 || !participant2) {
            res.status(400).send({ message: 'Both participant1 and participant2 are required' });
            return;
        }

        try {
            const chat = await ChatModel.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });

            res.status(200).send(chat || null);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching chat', error });
        }
    }

    public async getChatsForUser(req: express.Request, res: express.Response): Promise<void> {
        const { username } = req.query;

        if (!username) {
            res.status(400).send({ message: 'Username is required' });
            return;
        }

        try {
            const chats = await ChatModel.find({
                $or: [
                    { participant1: username },
                    { participant2: username }
                ]
            });

            // Create a map to store message counts and chat status for each user
            const messagesMap: { 
                [key: string]: { 
                    totalMessages: number, 
                    unreadMessages: number, 
                    isAccepted: boolean 
                } 
            } = {};
    
            // Iterate over each chat to count total and unread messages and track chat status
            for (const chat of chats) {
                const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
    
                if (otherParticipant) {
                    // Count total messages between both participants (both sent and received)
                    const totalMessagesCount = await MessageModel.countDocuments({
                        $or: [
                            { sender: username, receiver: otherParticipant },
                            { sender: otherParticipant, receiver: username }
                        ]
                    });
    
                    // Count unread messages sent by the other participant (messages the current user has not read)
                    const unreadMessagesCount = await MessageModel.countDocuments({
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
                const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
            
                return {
                    chat: chat,
                    totalMessages: otherParticipant ? messagesMap[otherParticipant]?.totalMessages || 0 : 0,
                    unreadMessages: otherParticipant ? messagesMap[otherParticipant]?.unreadMessages || 0 : 0,
                    isAccepted: otherParticipant ? messagesMap[otherParticipant]?.isAccepted || false : false
                };
            });
            
            // Return the users with message counts and chat status
            res.status(200).json(chatsWithMessageCounts);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching chats', error });
        }
    }

    public static async rejectChat(participant1: any, participant2: any) {
        if (!participant1 || !participant2) {
             throw new Error('Both participant1 and participant2 are required');
        }

        try {
            const chat = await ChatModel.findOneAndDelete({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });

            if (!chat) {
                 throw new Error('Chat not found');
            }

            await MessageModel.deleteMany({
                $or: [
                    { sender: participant1, receiver: participant2 },
                    { sender: participant2, receiver: participant1 }
                ]
            });

            return true;
        } catch (error) {
            console.error('Error rejecting chat:', error);
            throw new Error('Server error rejecting chat');
        }
    }

    public static async acceptChat(participant1: any, participant2: any) {
        if (!participant1 || !participant2) {
            throw new Error('Both participant1 and participant2 are required');
        }

        try {
            const chat = await ChatModel.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });

            if (!chat) {
                throw new Error('Chat not found');
            }

            chat.isAccepted = true;
            await chat.save();

            return true;
        } catch (error) {
            console.error('Error accepting chat:', error);
            throw new Error('Server error accepting chat');
        }
    }
}