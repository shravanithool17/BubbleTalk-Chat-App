import express from "express";
import { getUsersForSidebar, getMessagesByUserId, sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js"; // adjust path/filename to match yours

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessagesByUserId);

router.post("/send/:id", protectRoute, sendMessage);

export default router;