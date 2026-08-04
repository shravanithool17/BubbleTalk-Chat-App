import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const userSocketMap = {}; // { userId: Set of socketIds }

export function getReceiverSocketId(userId) {
  const sockets = userSocketMap[userId];
  if (sockets && sockets.size > 0) {
    return Array.from(sockets)[0];
  }
  return null;
}

export function getAllReceiverSocketIds(userId) {
  const sockets = userSocketMap[userId];
  return sockets ? Array.from(sockets) : [];
}

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
  }

  // Broadcast online user IDs
  const activeOnlineUserIds = Object.keys(userSocketMap).filter(
    (id) => userSocketMap[id].size > 0
  );
  io.emit("getOnlineUsers", activeOnlineUserIds);

  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", { senderId: userId });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }
    const currentOnlineUserIds = Object.keys(userSocketMap).filter(
      (id) => userSocketMap[id].size > 0
    );
    io.emit("getOnlineUsers", currentOnlineUserIds);
  });
});

export { io, app, server };