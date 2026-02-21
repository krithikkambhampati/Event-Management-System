import { Event } from "../models/event.model.js";
import mongoose from "mongoose";
import { sendDiscordWebhook } from "../utils/sendDiscordWebhook.js";

export const handleCreateEvent = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const {
      eventName,
      description,
      eventType,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      customFields,
      merchandiseVariants,
      purchaseLimitPerUser
    } = req.body;

    if (!eventName || !description || !eventType || !registrationDeadline || !startDate || !endDate) {
      return res.status(400).json({
        message: "Missing required fields: eventName, description, eventType, registrationDeadline, startDate, endDate"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ message: "Invalid organizer ID format" });
    }

    if (!["NORMAL", "MERCH"].includes(eventType)) {
      return res.status(400).json({ message: "Event type must be NORMAL or MERCH" });
    }

    if (eligibility && !["IIIT", "NON_IIIT", "BOTH"].includes(eligibility)) {
      return res.status(400).json({ message: "Eligibility must be IIIT, NON_IIIT, or BOTH" });
    }

    const regDeadline = new Date(registrationDeadline);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    if (regDeadline >= start) {
      return res.status(400).json({ message: "Registration deadline must be before start date" });
    }

    const event = await Event.create({
      eventName: eventName.trim(),
      description: description.trim(),
      eventType,
      eligibility: eligibility || "BOTH",
      registrationDeadline: regDeadline,
      startDate: start,
      endDate: end,
      registrationLimit: registrationLimit || null,
      registrationFee: registrationFee || 0,
      organizer: organizerId,
      tags: tags || [],
      customFields: eventType === "NORMAL" ? (customFields || []) : [],
      status: "DRAFT",
      merchandiseVariants: eventType === "MERCH" ? (merchandiseVariants || []) : [],
      purchaseLimitPerUser: eventType === "MERCH" ? (purchaseLimitPerUser || 1) : 1
    });

    res.status(201).json({
      message: "Event created successfully as DRAFT",
      event
    });

  } catch (error) {
    console.error("handleCreateEvent error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetOrganizerEvents = async (req, res) => {
  try {
    const { organizerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ message: "Invalid organizer ID format" });
    }

    const events = await Event.find({ organizer: organizerId })
      .populate("organizer", "organizerName organizerEmail")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Events fetched successfully",
      events,
      count: events.length
    });

  } catch (error) {
    console.error("handleGetOrganizerEvents error:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const handleGetSingleEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(eventId)
      .populate("organizer", "organizerName category contactEmail");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { Registration } = await import("../models/registration.model.js");
    const registeredCount = await Registration.countDocuments({
      event: eventId,
      participationStatus: { $ne: "Cancelled" }
    });

    const eventData = event.toObject();
    eventData.registeredCount = registeredCount;

    res.status(200).json({
      message: "Event fetched successfully",
      event: eventData
    });

  } catch (error) {
    console.error("handleGetSingleEvent error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "PUBLISHED" })
      .populate("organizer", "organizerName organizerEmail category")
      .sort({ createdAt: -1 });

    const { Registration } = await import("../models/registration.model.js");
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await Registration.countDocuments({
          event: event._id,
          participationStatus: { $ne: "Cancelled" }
        });
        const recentRegistrations = await Registration.countDocuments({
          event: event._id,
          participationStatus: { $ne: "Cancelled" },
          registeredAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        const eventData = event.toObject();
        eventData.registeredCount = registeredCount;
        eventData.recentRegistrations = recentRegistrations;
        return eventData;
      })
    );

    res.status(200).json({
      message: "Published events fetched successfully",
      events: eventsWithCounts,
      count: eventsWithCounts.length
    });

  } catch (error) {
    console.error("handleGetPublishedEvents error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleUpdateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "DRAFT") {
      event.eventName = updateData.eventName || event.eventName;
      event.description = updateData.description || event.description;
      event.eventType = updateData.eventType || event.eventType;
      event.eligibility = updateData.eligibility || event.eligibility;
      event.registrationDeadline = updateData.registrationDeadline || event.registrationDeadline;
      event.startDate = updateData.startDate || event.startDate;
      event.endDate = updateData.endDate || event.endDate;
      event.registrationLimit = updateData.registrationLimit !== undefined ? updateData.registrationLimit : event.registrationLimit;
      event.registrationFee = updateData.registrationFee !== undefined ? updateData.registrationFee : event.registrationFee;
      event.tags = updateData.tags || event.tags;

      if (updateData.customFields !== undefined) {
        const { Registration } = await import("../models/registration.model.js");
        const regCount = await Registration.countDocuments({ event: event._id, participationStatus: { $ne: "Cancelled" } });
        if (regCount > 0) {
          return res.status(400).json({ message: "Custom fields cannot be modified after registrations have been received.", formLocked: true });
        }
        event.customFields = updateData.customFields;
      }

      if (updateData.merchandiseVariants !== undefined) event.merchandiseVariants = updateData.merchandiseVariants;
      if (updateData.purchaseLimitPerUser !== undefined) event.purchaseLimitPerUser = updateData.purchaseLimitPerUser;
    }
    else if (event.status === "PUBLISHED") {
      if (updateData.description) event.description = updateData.description;
      if (updateData.registrationDeadline) event.registrationDeadline = updateData.registrationDeadline;
      if (updateData.registrationLimit !== undefined) event.registrationLimit = updateData.registrationLimit;
    }
    else if (["ONGOING", "COMPLETED", "CLOSED"].includes(event.status)) {
      if (!updateData.status) {
        return res.status(400).json({
          message: `Cannot edit ${event.status} events. Only status changes allowed.`
        });
      }
      event.status = updateData.status;
    }

    if (updateData.startDate || updateData.endDate || updateData.registrationDeadline) {
      const regDeadline = new Date(event.registrationDeadline);
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      if (start >= end) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
      if (regDeadline >= start) {
        return res.status(400).json({ message: "Registration deadline must be before start date" });
      }
    }

    await event.save();
    res.status(200).json({
      message: "Event updated successfully",
      event
    });

  } catch (error) {
    console.error("handleUpdateEvent error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handlePublishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "DRAFT") {
      return res.status(400).json({
        message: `Cannot publish ${event.status} event. Only DRAFT events can be published.`
      });
    }

    event.status = "PUBLISHED";
    await event.save();

    try {
      const { Organizer } = await import("../models/organizer.model.js");
      const organizer = await Organizer.findById(event.organizer).select("organizerName discordWebhook");
      if (organizer?.discordWebhook) {
        sendDiscordWebhook(organizer.discordWebhook, event, organizer.organizerName);
      }
    } catch (webhookErr) {
      console.warn("Discord webhook lookup failed:", webhookErr.message);
    }

    res.status(200).json({
      message: "Event published successfully",
      event
    });

  } catch (error) {
    console.error("handlePublishEvent error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
