import { Event } from "../models/event.model.js";
import mongoose from "mongoose";

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
      tags
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
      status: "DRAFT", 
      customFields: [],
      merchandiseVariants: []
    });

    res.status(201).json({
      message: "Event created successfully as DRAFT",
      event
    });

  } catch (error) {
    console.error("handleCreateEvent error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetOrganizerEvents = async (req, res) => {
  try {
    const { organizerId } = req.params;

    console.log("DEBUG: organizerId from params:", organizerId);

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      console.log("DEBUG: Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid organizer ID format" });
    }

    console.log("DEBUG: Fetching events for organizer:", organizerId);

    const events = await Event.find({ organizer: organizerId })
      .populate("organizer", "organizerName organizerEmail")
      .sort({ createdAt: -1 });

    console.log("DEBUG: Found events:", events.length);

    res.status(200).json({
      message: "Events fetched successfully",
      events,
      count: events.length
    });

  } catch (error) {
    console.error("DEBUG: handleGetOrganizerEvents error:", error);
    console.error("DEBUG: Error stack:", error.stack);
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

    res.status(200).json({
      message: "Event fetched successfully",
      event
    });

  } catch (error) {
    console.error("handleGetSingleEvent error:", error);
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
    console.error("handleUpdateEvent error:", error);
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

    res.status(200).json({
      message: "Event published successfully",
      event
    });

  } catch (error) {
    console.error("handlePublishEvent error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
