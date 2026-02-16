import express from "express";
import {
  handleCreateEvent,
  handleGetOrganizerEvents,
  handleGetSingleEvent,
  handleUpdateEvent,
  handlePublishEvent
} from "../controllers/event.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

const requireOrganizer = (req, res, next) => {
  if (!req.user || req.user.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Forbidden: Only organizers can access this" });
  }
  next();
};


router.post(
  "/organizer/:organizerId/create",
  verifyToken,
  requireOrganizer,
  handleCreateEvent
);

router.get(
  "/organizer/:organizerId",
  verifyToken,
  requireOrganizer,
  handleGetOrganizerEvents
);

router.patch(
  "/:eventId",
  verifyToken,
  requireOrganizer,
  handleUpdateEvent
);

router.post(
  "/:eventId/publish",
  verifyToken,
  requireOrganizer,
  handlePublishEvent
);

router.get(
  "/:eventId",
  handleGetSingleEvent
);

export default router;
