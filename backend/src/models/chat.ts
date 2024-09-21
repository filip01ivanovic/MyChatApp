import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        participant1: String,
        participant2: String,
        lastMessage: {
            messageType: {
                type: String,
                enum: ['text', 'voice']
            },
            text: String,
            sentAt: Date
        },
        isAccepted: {
            type: Boolean,
            default: false
        },
    },
    {
        versionKey: false
    }
);

export default mongoose.model('ChatModel', chatSchema, 'chats');
