import bcryptjs from "bcryptjs";
import { Organizer } from "../models/organizer.model.js";
import { Event } from "../models/event.model.js";
import { Participant } from "../models/participant.model.js";
import { Registration } from "../models/registration.model.js";
import crypto from "crypto";
import mongoose from "mongoose";

const buildBaseLoginHandle = (organizerName) => {
  const normalized = String(organizerName || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return normalized || "organizer";
};

const generateUniqueOrganizerEmail = async (organizerName) => {
  const baseHandle = buildBaseLoginHandle(organizerName);
  let counter = 0;

  while (true) {
    const email = `${baseHandle}${counter === 0 ? "" : counter}@ems.org`;
    const existing = await Organizer.findOne({ email }).select("_id");

    if (!existing) return email;
    counter += 1;
  }
};

export const createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber
    } = req.body || {};

    if (
      !organizerName ||
      !category ||
      !description ||
      !contactEmail ||
      !contactNumber
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const generatedPassword = crypto.randomBytes(6).toString("hex");

    let email = await generateUniqueOrganizerEmail(organizerName);
    let organizer;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        organizer = await Organizer.create({
          organizerName,
          category,
          description,
          contactEmail,
          contactNumber,
          email,
          isActive: true,
          password: generatedPassword
        });
        break;
      } catch (createError) {
        const isDuplicateKey = createError?.code === 11000;
        const duplicateField = Object.keys(createError?.keyPattern || {})[0] || "";

        if (!isDuplicateKey) throw createError;

        if (duplicateField === "email") {
          email = await generateUniqueOrganizerEmail(organizerName);
          continue;
        }

        return res.status(409).json({
          message: `${duplicateField} already exists. Please use a different value.`
        });
      }
    }

    if (!organizer) {
      return res.status(500).json({ message: "Could not create organizer. Please retry." });
    }

    res.status(201).json({
      message: "Organizer created successfully",
      credentials: {
        email,
        password: generatedPassword
      }
    });

  } catch (error) {
    console.error("createOrganizer error:", error.message);

    res.status(500).json({ message: "Internal server error" });
  }
};

export const listOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find({})
      .select("organizerName category contactEmail email contactNumber isActive createdAt passwordResetStatus")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ organizers });
  } catch (error) {
    console.error("listOrganizers error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrganizerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const organizer = await Organizer.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: 'after' }
    ).select("_id organizerName isActive");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    return res.status(200).json({
      message: isActive ? "Organizer enabled" : "Organizer disabled",
      organizer
    });
  } catch (error) {
    console.error("updateOrganizerStatus error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    const organizer = await Organizer.findById(id);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const organizerEvents = await Event.find({ organizer: id }).select("_id");
    const eventIds = organizerEvents.map(event => event._id);

    if (eventIds.length > 0) {
      await Registration.deleteMany({ event: { $in: eventIds } });
    }

    await Event.deleteMany({ organizer: id });

    await Participant.updateMany(
      { followedOrganizers: id },
      { $pull: { followedOrganizers: id } }
    );

    // Delete the organizer
    await Organizer.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Organizer and all associated data (events, registrations) deleted successfully",
      deletedEventsCount: eventIds.length
    });
  } catch (error) {
    console.error("deleteOrganizer error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetOrganizerPassword = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    const organizer = await Organizer.findById(id);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const generatedPassword = crypto.randomBytes(6).toString("hex");
    organizer.password = generatedPassword;
    await organizer.save();

    return res.status(200).json({
      message: "Organizer password reset successfully",
      credentials: {
        email: organizer.email,
        password: generatedPassword
      }
    });
  } catch (error) {
    console.error("resetOrganizerPassword error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await Organizer.find({
      passwordResetStatus: "PENDING"
    }).select("_id organizerName email passwordResetRequestedAt");

    res.status(200).json({ requests });
  } catch (error) {
    console.error("getPasswordResetRequests error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const approvePasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const organizer = await Organizer.findById(id);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (organizer.passwordResetStatus !== "PENDING") {
      return res.status(400).json({ message: "Not a pending request" });
    }

    const newPassword = crypto.randomBytes(6).toString("hex");

    organizer.password = newPassword;
    organizer.passwordResetStatus = "APPROVED";
    await organizer.save();

    res.status(200).json({
      message: "Password reset approved",
      newPassword,
      organizerEmail: organizer.email
    });
  } catch (error) {
    console.error("approvePasswordResetRequest error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectPasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const organizer = await Organizer.findById(id);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (organizer.passwordResetStatus !== "PENDING") {
      return res.status(400).json({ message: "Not a pending request" });
    }

    organizer.passwordResetStatus = "NONE";
    await organizer.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("rejectPasswordResetRequest error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
