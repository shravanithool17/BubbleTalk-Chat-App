
import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";

dotenv.config();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bubble-talk-chat-app-six.vercel.app",
    ],
    credentials: true,
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Health-check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BubbleTalk backend is running!",
  });
});

// Start server and connect to MongoDB
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`BubbleTalk server is running on port ${PORT}`);

  try {
    await connectDB();
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
});
