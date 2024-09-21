import express from 'express';
import { ChatController } from '../controllers/chat.controller';

const chatRouter = express.Router();

chatRouter.route("/getChatForUsers").get(
    (req, res) => new ChatController().getChatForUsers(req, res)
);

chatRouter.route("/getChatsForUser").get(
    (req, res) => new ChatController().getChatsForUser(req, res)
);

export default chatRouter;
