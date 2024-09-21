"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_1 = __importDefault(require("../models/user"));
const chat_1 = __importDefault(require("../models/chat"));
const message_1 = __importDefault(require("../models/message"));
const bcrypt = __importStar(require("bcrypt"));
class UserController {
    constructor() {
        this.register = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username, password, repeatPassword, email } = req.body;
            // Validation checks
            if (!username || username.length < 4 || username.length > 20) {
                return res.status(400).json({ message: 'Username must be between 4 and 20 characters' });
            }
            if (!password || password.length < 4 || password.length > 20) {
                return res.status(400).json({ message: 'Password must be between 4 and 20 characters' });
            }
            if (password !== repeatPassword) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            try {
                // Check if the user already exists
                const existingUser = yield user_1.default.findOne({ username });
                if (existingUser) {
                    return res.status(400).json({ message: 'Username is already taken' });
                }
                // Hash the password
                const hashedPassword = yield bcrypt.hash(password, 10);
                // Create a new user
                const newUser = new user_1.default({
                    username,
                    password: hashedPassword,
                    email,
                    profilePhoto: 'default_profile_photo.jpg'
                });
                // Save the user to the database
                yield newUser.save();
                res.status(201).json({ message: 'Registration successful' });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error during registration' });
            }
        });
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            try {
                // Check if the user exists
                const user = yield user_1.default.findOne({ username });
                if (!user || !user.password) {
                    return res.status(400).json({ message: 'Invalid username or password' });
                }
                // Compare the entered password with the hashed password
                const isMatch = yield bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Invalid username or password' });
                }
                return res.status(200).json({
                    message: 'Login successful',
                    user: { username: user.username, email: user.email, profilePhoto: user.profilePhoto },
                });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error during login' });
            }
        });
        this.updateUsername = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username, newUsername } = req.body;
            // Validation checks for new username
            if (!newUsername || newUsername.length < 4 || newUsername.length > 20) {
                return res.status(400).json({ message: 'New username must be between 4 and 20 characters' });
            }
            try {
                const user = yield user_1.default.findOne({ username });
                if (!user) {
                    return res.status(400).json({ message: 'User not found 2' });
                }
                // Check if the new username is already taken
                const existingUser = yield user_1.default.findOne({ username: newUsername });
                if (existingUser) {
                    return res.status(400).json({ message: 'Username is already taken' });
                }
                user.username = newUsername;
                yield user.save();
                res.status(200).json({ message: 'Username updated successfully' });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error during username update' });
            }
        });
        this.updateEmail = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username, newEmail } = req.body;
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!newEmail || !emailRegex.test(newEmail)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            try {
                // Check if the user exists
                const user = yield user_1.default.findOne({ username });
                if (!user) {
                    return res.status(400).json({ message: 'User not found' });
                }
                user.email = newEmail;
                yield user.save();
                res.status(200).json({ message: 'Email updated successfully' });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error during email update' });
            }
        });
        this.changePassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username, oldPassword, newPassword, repeatNewPassword } = req.body;
            // Validation checks
            if (!newPassword || newPassword.length < 4 || newPassword.length > 20) {
                return res.status(400).json({ message: 'New password must be between 4 and 20 characters' });
            }
            if (newPassword !== repeatNewPassword) {
                return res.status(400).json({ message: 'New password and repeated password do not match' });
            }
            try {
                // Check if the user exists
                const user = yield user_1.default.findOne({ username });
                if (!user || !user.password) {
                    return res.status(400).json({ message: 'User not found or invalid credentials' });
                }
                // Verify the old password
                const isMatch = yield bcrypt.compare(oldPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Old password is incorrect' });
                }
                const hashedNewPassword = yield bcrypt.hash(newPassword, 10);
                user.password = hashedNewPassword;
                yield user.save();
                res.status(200).json({ message: 'Password updated successfully' });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error during password change' });
            }
        });
        this.getAllUsersWithUnreadMessages = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username } = req.body;
            try {
                // Fetch all users except the current user
                const users = yield user_1.default.find({ username: { $ne: username } }, 'username email profilePhoto'); // Exclude the current user
                // Fetch all chats involving the current user
                const chats = yield chat_1.default.find({ $or: [{ participant1: username }, { participant2: username }] });
                // Create a map to store message counts and chat status for each user
                const messagesMap = {};
                // Iterate over each chat to count total and unread messages and track chat status
                for (const chat of chats) {
                    const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
                    if (otherParticipant) {
                        // Count total messages between both participants (both sent and received)
                        const totalMessagesCount = yield message_1.default.countDocuments({
                            $or: [
                                { sender: username, receiver: otherParticipant },
                                { sender: otherParticipant, receiver: username }
                            ]
                        });
                        // Count unread messages sent by the other participant (messages the current user has not read)
                        const unreadMessagesCount = yield message_1.default.countDocuments({
                            sender: otherParticipant,
                            receiver: username,
                            isRead: false
                        });
                        // Initialize map entry if not present
                        if (!messagesMap[otherParticipant]) {
                            messagesMap[otherParticipant] = {
                                totalMessages: 0,
                                unreadMessages: 0,
                                chatExists: true,
                                isAccepted: chat.isAccepted || false
                            };
                        }
                        // Update the map with the counts
                        messagesMap[otherParticipant].totalMessages += totalMessagesCount;
                        messagesMap[otherParticipant].unreadMessages += unreadMessagesCount;
                    }
                }
                // Map over the users and append the total, unread messages count, chat existence, and acceptance status
                const usersWithMessageCounts = users.map(user => {
                    var _a, _b, _c;
                    return ({
                        username: user.username || '',
                        email: user.email || '',
                        profilePhoto: user.profilePhoto || '',
                        totalMessages: ((_a = messagesMap[user.username || '']) === null || _a === void 0 ? void 0 : _a.totalMessages) || 0,
                        unreadMessages: ((_b = messagesMap[user.username || '']) === null || _b === void 0 ? void 0 : _b.unreadMessages) || 0,
                        chatExists: messagesMap[user.username || ''] ? true : false,
                        isAccepted: ((_c = messagesMap[user.username || '']) === null || _c === void 0 ? void 0 : _c.isAccepted) || false
                    });
                });
                // Return the users with message counts and chat status
                return res.status(200).json(usersWithMessageCounts);
            }
            catch (error) {
                console.error('Error fetching users:', error);
                return res.status(500).json({ message: 'Server error while fetching users' });
            }
        });
        this.getUserByUsername = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { username } = req.query;
            try {
                // Find the user by username, only select specific fields: username, email, and profilePhoto
                const user = yield user_1.default.findOne({ username }, 'username email profilePhoto');
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                // If user is found, send back the user data
                return res.status(200).json(user);
            }
            catch (error) {
                // If there's an error during the database query, return a 500 response
                return res.status(500).json({ message: 'Error fetching user', error });
            }
        });
    }
}
exports.UserController = UserController;
