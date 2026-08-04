import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedUserId = req.user._id;

        const messages = await Message.find({
            $or: [{ senderId: loggedUserId }, { receiverId: loggedUserId }]
        }).sort({ createdAt: -1 });

        const chatUserIds = [...new Set(messages.map(m => {
            if (!m.senderId) return null;
            const senderStr = m.senderId.toString();
            const receiverStr = m.receiverId ? m.receiverId.toString() : null;

            if (senderStr === loggedUserId.toString()) {
                return receiverStr;
            }
            return senderStr;
        }).filter(Boolean))];

        const users = await User.find({ _id: { $in: chatUserIds } }).select("-password");

        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        const orderedUsers = chatUserIds.map(id => userMap.get(id)).filter(Boolean);

        res.status(200).json(orderedUsers);
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const loggedUserId = req.user._id;
        const { query } = req.query;

        if (!query || !query.trim()) {
            return res.status(200).json([]);
        }

        const searchRegex = new RegExp(query.trim(), "i");
        const users = await User.find({
            _id: { $ne: loggedUserId },
            $or: [
                { fullName: searchRegex },
                { email: searchRegex }
            ]
        }).select("-password").limit(10);

        res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUsers controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const loggedUserId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: loggedUserId, receiverId: req.params.id },
                { senderId: req.params.id, receiverId: loggedUserId }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessagesByUserId controller, error.message:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, audio } = req.body;
        const loggedUserId = req.user._id;
        const receiverId = req.params.id;

        let imageUrl = "";
        if (image) {
            const uploadedImage = await cloudinary.uploader.upload(image);
            imageUrl = uploadedImage.secure_url;
        }

        let audioUrl = "";
        if (audio) {
            if (audio.startsWith("data:audio")) {
                const uploadedAudio = await cloudinary.uploader.upload(audio, { resource_type: "video" });
                audioUrl = uploadedAudio.secure_url;
            } else {
                audioUrl = audio;
            }
        }

        const newMessage = new Message({
            senderId: loggedUserId,
            receiverId: receiverId,
            text: text || "",
            image: imageUrl,
            audio: audioUrl,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller, error.message:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());

        if (emoji) {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        const receiverId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReaction", message);
        }

        res.status(200).json(message);
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete message" });
        }

        await Message.findByIdAndDelete(messageId);

        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", messageId);
        }

        res.status(200).json({ messageId, message: "Message deleted" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit message" });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", message);
        }

        res.status(200).json(message);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};