"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chatSchema = new mongoose_1.default.Schema({
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
}, {
    versionKey: false
});
exports.default = mongoose_1.default.model('ChatModel', chatSchema, 'chats');
