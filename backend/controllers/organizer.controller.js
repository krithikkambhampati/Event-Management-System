import { Organizer } from "../models/organizer.model.js";
import { Participant } from "../models/participant.model.js";
import { VALID_INTERESTS } from "../constants/interests.js";

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

export const handleGetOrganizerById = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await Organizer.findById(id).select('-password');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found"
      });
    }

    return res.status(200).json({
      success: true,
      organizer
    });
  } catch (error) {
    console.error("handleGetOrganizerById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizer"
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
      message: "Successfully followed organizer",
      user: {
        _id: participant._id,
        fName: participant.fName,
        lName: participant.lName,
        email: participant.email,
        collegeName: participant.collegeName,
        contactNumber: participant.contactNumber,
        participantType: participant.participantType,
        interests: participant.interests,
        followedOrganizers: participant.followedOrganizers,
        role: "PARTICIPANT"
      }
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
      message: "Successfully unfollowed organizer",
      user: {
        _id: participant._id,
        fName: participant.fName,
        lName: participant.lName,
        email: participant.email,
        collegeName: participant.collegeName,
        contactNumber: participant.contactNumber,
        participantType: participant.participantType,
        interests: participant.interests,
        followedOrganizers: participant.followedOrganizers,
        role: "PARTICIPANT"
      }
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

// Update organizer profile
export const handleUpdateOrganizerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    // Verify organizer is updating their own profile
    if (id !== organizerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Cannot update another organizer's profile"
      });
    }

    const { organizerName, category, description, contactEmail, contactNumber } = req.body;

    // Validate required fields
    if (!organizerName || !category || !contactEmail || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate category
    if (!VALID_INTERESTS.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizer category. Please select a valid category."
      });
    }

    const organizer = await Organizer.findByIdAndUpdate(
      id,
      {
        organizerName,
        category,
        description,
        contactEmail,
        contactNumber
      },
      { returnDocument: 'after' }
    ).select('-password');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      organizer: {
        _id: organizer._id,
        email: organizer.email,
        role: "ORGANIZER",
        organizerName: organizer.organizerName,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
        contactNumber: organizer.contactNumber
      }
    });
  } catch (error) {
    console.error("handleUpdateOrganizerProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update organizer profile"
    });
  }
};
