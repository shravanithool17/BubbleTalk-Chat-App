import express from "express";
import {
  getUsersForSidebar,
  getMessagesByUserId,
  sendMessage,
  searchUsers,
  reactToMessage,
  deleteMessage,
  editMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getMessagesByUserId);

router.post("/send/:id", protectRoute, sendMessage);
router.put("/react/:id", protectRoute, reactToMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;