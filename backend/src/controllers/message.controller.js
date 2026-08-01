import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async(req, res) => {
    try {
        const loggedUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedUserId}}).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const getMessagesByUserId = async (req, res) => {
    try {
        req.params.id = req.params.id;
        const loggedUserId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: loggedUserId, receiverId: req.params.id },
                { senderId: req.params.id, receiverId: loggedUserId }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);

    }catch (error) {
        console.log("Error in getMessagesByUserId controller, error.message:", error.message);
        return res.status(500).json({message: "Internal server error"});

    }
};


export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const loggedUserId = req.user._id;
        const receiverId = req.params.id;

        let imageUrl = "";
        if (image) {
            // Handle image upload logic here (e.g., save to cloud storage and get the URL)
            // For now, we'll just use a placeholder URL
            // imageUrl = await uploadImage(image);
            const uploadedImage = await cloudinary.uploader.upload(image); // Assuming you have an uploadImage function
            imageUrl = uploadedImage.secure_url;
        }

        const newMessage = new Message({
            senderId: loggedUserId,
            receiverId: receiverId,
            text: text,
            image: imageUrl
        });

        await newMessage.save();

          const receiverSocketId = getReceiverSocketId(receiverId);   // ✅ fixed
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);   // ✅ fixed
        }
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller, error.message:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};