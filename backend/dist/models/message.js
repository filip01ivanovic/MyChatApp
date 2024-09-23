"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    sender: String,
    receiver: String,
    messageType: {
        type: String,
        enum: ['text', 'voice']
    },
    textMessage: String,
    voiceMessageDuration: String,
    voiceMessageUrl: String,
    sentAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false
});
exports.default = mongoose_1.default.model('MessageModel', messageSchema, 'messages');
