import express from "express";
import { 
  handleGetAllOrganizers, 
  handleFollowOrganizer, 
  handleUnfollowOrganizer,
  handleGetFollowedOrganizers
} from "../controllers/organizer.controller.js";
import { verifyToken, requireParticipant } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route - get all organizers
router.get("/", handleGetAllOrganizers);

// Participant-only routes - follow/unfollow
router.post("/:organizerId/follow", verifyToken, requireParticipant, handleFollowOrganizer);
router.post("/:organizerId/unfollow", verifyToken, requireParticipant, handleUnfollowOrganizer);
router.get("/followed/my-organizers", verifyToken, requireParticipant, handleGetFollowedOrganizers);

export default router;
