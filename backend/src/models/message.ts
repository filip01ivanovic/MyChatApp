import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        sender: String,
        receiver: String,
        messageType: {
            type: String,
            enum: ['text', 'voice']
        },
        textMessage: String,
        voiceMessageUrl: String,
        sentAt: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false
    }
);

export default mongoose.model('MessageModel', messageSchema, 'messages');
