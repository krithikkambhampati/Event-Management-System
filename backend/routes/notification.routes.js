import express from "express";
import { verifyToken, requireParticipant } from "../middleware/auth.middleware.js";
import {
  getUnreadNotifications,
  markNotificationsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/unread", verifyToken, requireParticipant, getUnreadNotifications);
router.post("/mark-read", verifyToken, requireParticipant, markNotificationsRead);

export default router;
