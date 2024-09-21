"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const userRouter = express_1.default.Router();
userRouter.route("/register").post((req, res) => new user_controller_1.UserController().register(req, res));
userRouter.route("/login").post((req, res) => new user_controller_1.UserController().login(req, res));
userRouter.route("/updateUsername").post((req, res) => new user_controller_1.UserController().updateUsername(req, res));
userRouter.route("/updateEmail").post((req, res) => new user_controller_1.UserController().updateEmail(req, res));
userRouter.route("/changePassword").post((req, res) => new user_controller_1.UserController().changePassword(req, res));
userRouter.route("/getAllUsersWithUnreadMessages").post((req, res) => new user_controller_1.UserController().getAllUsersWithUnreadMessages(req, res));
userRouter.route("/getUserByUsername").get((req, res) => new user_controller_1.UserController().getUserByUsername(req, res));
exports.default = userRouter;
