import express from 'express';
import { MessageController } from '../controllers/message.controller';

const messageRouter = express.Router();

messageRouter.route("/getMessagesForChat").get(
    (req, res) => new MessageController().getMessagesForChat(req, res)
);

messageRouter.route("/setMessagesToRead").post(
    (req, res) => new MessageController().setMessagesToRead(req, res)
);

export default messageRouter;
