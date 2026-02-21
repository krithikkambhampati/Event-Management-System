import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    handleGetMessages,
    handlePostMessage,
    handleDeleteMessage,
    handleTogglePin,
    handleReactToMessage
} from "../controllers/discussion.controller.js";

const router = express.Router();

// Get all messages for an event (any authenticated user)
router.get("/:eventId/messages", verifyToken, handleGetMessages);

// Post a message (registered participants + event organizer)
router.post("/:eventId/messages", verifyToken, handlePostMessage);

// Delete a message (organizer moderation or own message)
router.delete("/messages/:messageId", verifyToken, handleDeleteMessage);

// Pin/unpin a message (organizer only)
router.patch("/messages/:messageId/pin", verifyToken, handleTogglePin);

// React to a message
router.post("/messages/:messageId/react", verifyToken, handleReactToMessage);

export default router;
