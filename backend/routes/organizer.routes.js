import express from "express";
import { 
  handleGetAllOrganizers,
  handleGetOrganizerById,
  handleFollowOrganizer, 
  handleUnfollowOrganizer,
  handleGetFollowedOrganizers,
  handleUpdateOrganizerProfile,
  handleRequestPasswordReset
} from "../controllers/organizer.controller.js";
import { verifyToken, requireParticipant, requireOrganizer } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", handleGetAllOrganizers);

// Participant-only routes - follow/unfollow (must come before /:id to avoid matching :id pattern)
router.post("/:organizerId/follow", verifyToken, requireParticipant, handleFollowOrganizer);
router.post("/:organizerId/unfollow", verifyToken, requireParticipant, handleUnfollowOrganizer);
router.get("/followed/my-organizers", verifyToken, requireParticipant, handleGetFollowedOrganizers);

// Organizer-only routes - update profile
router.put("/:id", verifyToken, requireOrganizer, handleUpdateOrganizerProfile);

// Organizer password reset request
router.post("/:id/request-password-reset", verifyToken, requireOrganizer, handleRequestPasswordReset);

// Get single organizer by ID (must come last so specific routes match first)
router.get("/:id", handleGetOrganizerById);

export default router;
