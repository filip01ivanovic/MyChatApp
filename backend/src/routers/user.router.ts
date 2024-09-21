import express from 'express';
import { UserController } from '../controllers/user.controller';

const userRouter = express.Router();

userRouter.route("/register").post(
    (req, res) => new UserController().register(req, res)
);

userRouter.route("/login").post(
    (req, res) => new UserController().login(req, res)
);

userRouter.route("/updateUsername").post(
    (req, res) => new UserController().updateUsername(req, res)
);

userRouter.route("/updateEmail").post(
    (req, res) => new UserController().updateEmail(req, res)
);

userRouter.route("/changePassword").post(
    (req, res) => new UserController().changePassword(req, res)
);

userRouter.route("/getAllUsersWithUnreadMessages").post(
    (req, res) => new UserController().getAllUsersWithUnreadMessages(req, res)
);

userRouter.route("/getUserByUsername").get(
    (req, res) => new UserController().getUserByUsername(req, res)
);

export default userRouter;
