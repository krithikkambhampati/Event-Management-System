import { Organizer } from "../models/organizer.model.js";
import { Participant } from "../models/participant.model.js";

// Get all organizers (public)
export const handleGetAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      organizers
    });
  } catch (error) {
    console.error("handleGetAllOrganizers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizers"
    });
  }
};

// Follow an organizer
export const handleFollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    // Check if organizer exists
    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found"
      });
    }

    // Check if already following
    const participant = await Participant.findById(participantId);
    if (participant.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({
        success: false,
        message: "Already following this organizer"
      });
    }

    // Add to followedOrganizers
    participant.followedOrganizers.push(organizerId);
    await participant.save();

    return res.status(200).json({
      success: true,
      message: "Successfully followed organizer"
    });
  } catch (error) {
    console.error("handleFollowOrganizer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to follow organizer"
    });
  }
};

// Unfollow an organizer
export const handleUnfollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    const participant = await Participant.findById(participantId);
    if (!participant.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({
        success: false,
        message: "Not following this organizer"
      });
    }

    // Remove from followedOrganizers
    participant.followedOrganizers = participant.followedOrganizers.filter(
      id => id.toString() !== organizerId
    );
    await participant.save();

    return res.status(200).json({
      success: true,
      message: "Successfully unfollowed organizer"
    });
  } catch (error) {
    console.error("handleUnfollowOrganizer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unfollow organizer"
    });
  }
};

// Get followed organizers for a participant
export const handleGetFollowedOrganizers = async (req, res) => {
  try {
    const participantId = req.user.id;

    const participant = await Participant.findById(participantId)
      .populate('followedOrganizers', '-password');

    return res.status(200).json({
      success: true,
      followedOrganizers: participant.followedOrganizers || []
    });
  } catch (error) {
    console.error("handleGetFollowedOrganizers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch followed organizers"
    });
  }
};
