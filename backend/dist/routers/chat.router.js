"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("../controllers/chat.controller");
const chatRouter = express_1.default.Router();
chatRouter.route("/getChatForUsers").get((req, res) => new chat_controller_1.ChatController().getChatForUsers(req, res));
chatRouter.route("/getChatsForUser").get((req, res) => new chat_controller_1.ChatController().getChatsForUser(req, res));
exports.default = chatRouter;
