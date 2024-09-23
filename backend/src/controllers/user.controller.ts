import express from 'express'
import UserModel from '../models/user'
import ChatModel from '../models/chat'
import MessageModel from '../models/message'
import * as bcrypt from 'bcrypt'

export class UserController {
    register = async (req: express.Request, res: express.Response) => {
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
            const existingUser = await UserModel.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
    
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
    
            // Create a new user
            const newUser = new UserModel({
                username,
                password: hashedPassword,
                email,
                profilePhoto: 'default_profile_photo.jpg'
            });
    
            // Save the user to the database
            await newUser.save();
    
            res.status(201).json({ message: 'Registration successful' });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during registration' });
        }
    };    

    login = async (req: express.Request, res: express.Response) => {
        const { username, password } = req.body;
    
        try {
            // Check if the user exists
            const user = await UserModel.findOne({ username });
            if (!user || !user.password) {
                return res.status(400).json({ message: 'Invalid username or password' });
            }
    
            // Compare the entered password with the hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid username or password' });
            }
    
            return res.status(200).json({
                message: 'Login successful',
                user: { username: user.username, email: user.email, profilePhoto: user.profilePhoto },
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during login' });
        }
    };

    updateUsername = async (req: express.Request, res: express.Response) => {
        const { username, newUsername } = req.body;
    
        // Validation checks for the new username
        if (!newUsername || newUsername.length < 4 || newUsername.length > 20) {
            return res.status(400).json({ message: 'New username must be between 4 and 20 characters' });
        }
    
        try {
            const user = await UserModel.findOne({ username });
            if (!user) {
                return res.status(400).json({ message: 'User not found 2' });
            }
    
            // Check if the new username is taken
            const existingUser = await UserModel.findOne({ username: newUsername });
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
    
            user.username = newUsername;
            await user.save();
    
            res.status(200).json({ message: 'Username updated successfully' });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during username update' });
        }
    };
    
    updateEmail = async (req: express.Request, res: express.Response) => {
        const { username, newEmail } = req.body;
    
        // Validation check for the new email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!newEmail || !emailRegex.test(newEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
    
        try {
            // Check if the user exists
            const user = await UserModel.findOne({ username });
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }
    
            user.email = newEmail;
            await user.save();
    
            res.status(200).json({ message: 'Email updated successfully' });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during email update' });
        }
    };
    
    changePassword = async (req: express.Request, res: express.Response) => {
        const { username, oldPassword, newPassword, repeatNewPassword } = req.body;
    
        // Validation checks for the new password
        if (!newPassword || newPassword.length < 4 || newPassword.length > 20) {
            return res.status(400).json({ message: 'New password must be between 4 and 20 characters' });
        }
    
        if (newPassword !== repeatNewPassword) {
            return res.status(400).json({ message: 'New password and repeated password do not match' });
        }
    
        try {
            // Check if the user exists
            const user = await UserModel.findOne({ username });
            if (!user || !user.password) {
                return res.status(400).json({ message: 'User not found or invalid credentials' });
            }
    
            // Verify the old password
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Old password is incorrect' });
            }
    
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            await user.save();
    
            res.status(200).json({ message: 'Password updated successfully' });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during password change' });
        }
    };

    getAllUsersWithUnreadMessages = async (req: express.Request, res: express.Response) => {
        const { username } = req.body;
    
        try {
            const users = await UserModel.find({ username: { $ne: username } }, 'username email profilePhoto');
            const chats = await ChatModel.find({ $or: [{ participant1: username }, { participant2: username }] });
    
            const messagesMap: { 
                [key: string]: { 
                    totalMessages: number, 
                    unreadMessages: number, 
                    chatExists: boolean, 
                    isAccepted: boolean 
                } 
            } = {};
    
            for (const chat of chats) {
                const otherParticipant = chat.participant1 === username ? chat.participant2 : chat.participant1;
    
                if (otherParticipant) {
                    const totalMessagesCount = await MessageModel.countDocuments({
                        $or: [
                            { sender: username, receiver: otherParticipant },
                            { sender: otherParticipant, receiver: username }
                        ]
                    });
    
                    const unreadMessagesCount = await MessageModel.countDocuments({
                        sender: otherParticipant,
                        receiver: username,
                        isRead: false
                    });
    
                    if (!messagesMap[otherParticipant]) {
                        messagesMap[otherParticipant] = {
                            totalMessages: 0,
                            unreadMessages: 0,
                            chatExists: true,
                            isAccepted: chat.isAccepted || false
                        };
                    }
    
                    messagesMap[otherParticipant].totalMessages += totalMessagesCount;
                    messagesMap[otherParticipant].unreadMessages += unreadMessagesCount;
                }
            }
    
            const usersWithMessageCounts = users.map(user => ({
                username: user.username || '',
                email: user.email || '',
                profilePhoto: user.profilePhoto || '',
                totalMessages: messagesMap[user.username || '']?.totalMessages || 0,
                unreadMessages: messagesMap[user.username || '']?.unreadMessages || 0,
                chatExists: messagesMap[user.username || ''] ? true : false,
                isAccepted: messagesMap[user.username || '']?.isAccepted || false
            }));
    
            return res.status(200).json(usersWithMessageCounts);
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ message: 'Server error while fetching users' });
        }
    };    

    getUserByUsername = async (req: express.Request, res: express.Response) => {
        const { username } = req.query;

        try {
            const user = await UserModel.findOne({ username }, 'username email profilePhoto');
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching user', error });
        }
    }; 
}