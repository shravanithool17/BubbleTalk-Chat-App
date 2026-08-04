import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members, groupPic } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Ensure member IDs are unique and include admin
    let uniqueMembers = Array.isArray(members) ? [...new Set(members)] : [];
    if (!uniqueMembers.includes(adminId.toString())) {
      uniqueMembers.push(adminId.toString());
    }

    let uploadedGroupPic = "";
    if (groupPic && groupPic.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(groupPic);
      uploadedGroupPic = uploadRes.secure_url;
    } else if (groupPic) {
      uploadedGroupPic = groupPic;
    }

    const newGroup = new Group({
      name: name.trim(),
      admin: adminId,
      members: uniqueMembers,
      groupPic: uploadedGroupPic,
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Broadcast new group creation to online member sockets
    uniqueMembers.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("groupCreated", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .populate("admin", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image, audio } = req.body;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let imageUrl = "";
    if (image && image.startsWith("data:image")) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    } else if (image) {
      imageUrl = image;
    }

    let audioUrl = "";
    if (audio && audio.startsWith("data:audio")) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, { resource_type: "video" });
      audioUrl = uploadedAudio.secure_url;
    } else if (audio) {
      audioUrl = audio;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text: text || "",
      image: imageUrl,
      audio: audioUrl,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName profilePic"
    );

    // Update group updatedAt timestamp
    group.updatedAt = new Date();
    await group.save();

    // Broadcast message to online group member sockets
    group.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId.toString());
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
