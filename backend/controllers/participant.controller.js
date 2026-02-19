import { Participant } from "../models/participant.model.js";
import { VALID_INTERESTS } from "../constants/interests.js";

export const handleSignupParticipant = async (req, res) => {
  try {
    const { email, participantType, interests = [] } = req.body;

    const existingUser = await Participant.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate interests if provided
    if (interests.length > 0) {
      const invalidInterests = interests.filter(interest => !VALID_INTERESTS.includes(interest));
      if (invalidInterests.length > 0) {
        return res.status(400).json({
          message: `Invalid interests: ${invalidInterests.join(", ")}`
        });
      }
    }

    // email verification
    if (participantType === "IIIT") {
      const validDomains = [
        "@students.iiit.ac.in",
        "@research.iiit.ac.in"
      ];

      const isValid = validDomains.some(domain =>
        email.endsWith(domain)
      );

      if (!isValid) {
        return res.status(400).json({
          message: "Invalid IIIT email domain"
        });
      }
    }


    if (participantType === "NON_IIIT") {
      const iiitDomains = [
        "@students.iiit.ac.in",
        "@research.iiit.ac.in"
      ];

      const isIIITDomain = iiitDomains.some(domain =>
        email.endsWith(domain)
      );

      if (isIIITDomain) {
        return res.status(400).json({
          message: "IIIT domain must select IIIT participant type"
        });
      }
    }
    const participant = await Participant.create({
      ...req.body,
      interests: interests.length > 0 ? interests : []
    });

    res.status(201).json({
      message: "User created successfully",
      userId: participant._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleUpdateParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { fName, lName, collegeName, contactNumber, interests = [] } = req.body;
    const loggedInUserId = req.user.id;

    if (id !== loggedInUserId) {
      return res.status(403).json({ message: "Can only update your own profile" });
    }

    const participant = await Participant.findById(id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (interests.length > 0) {
      const validInterests = interests.filter(interest => VALID_INTERESTS.includes(interest));
      participant.interests = validInterests;
    } else {
      participant.interests = interests;
    }

    await participant.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: participant._id,
        fName: participant.fName,
        lName: participant.lName,
        email: participant.email,
        collegeName: participant.collegeName,
        contactNumber: participant.contactNumber,
        participantType: participant.participantType,
        interests: participant.interests,
        role: "PARTICIPANT"
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleChangePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const loggedInUserId = req.user.id;

    if (id !== loggedInUserId) {
      return res.status(403).json({ message: "Can only change your own password" });
    }

    const participant = await Participant.findById(id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const isPasswordValid = await participant.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    participant.password = newPassword;
    await participant.save();

    res.status(200).json({
      message: "Password changed successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
