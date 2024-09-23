"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_controller_1 = require("../controllers/message.controller");
const messageRouter = express_1.default.Router();
messageRouter.route("/getMessagesForChat").get((req, res) => new message_controller_1.MessageController().getMessagesForChat(req, res));
messageRouter.route("/setMessagesToRead").post((req, res) => new message_controller_1.MessageController().setMessagesToRead(req, res));
messageRouter.route("/setOneMessageToRead").post((req, res) => new message_controller_1.MessageController().setOneMessageToRead(req, res));
exports.default = messageRouter;
