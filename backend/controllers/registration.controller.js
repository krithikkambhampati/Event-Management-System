import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import { Participant } from "../models/participant.model.js";
import mongoose from "mongoose";

const generateTicketId = (eventName, eventId) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${eventName.slice(0, 3).toUpperCase()}-${timestamp}-${random}`;
};

export const handleRegisterParticipant = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const participantId = req.user.id;
    const { registrationData } = req.body;

    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ 
        message: "Event must be PUBLISHED to register" 
      });
    }

    const now = new Date();
    if (now > event.registrationDeadline) {
      return res.status(400).json({ 
        message: "Registration deadline has passed" 
      });
    }

    if (event.registrationLimit) {
      const registrationCount = await Registration.countDocuments({
        event: eventId,
        participationStatus: { $ne: "Cancelled" }
      });

      if (registrationCount >= event.registrationLimit) {
        return res.status(400).json({ 
          message: "Event is full - registration limit reached" 
        });
      }
    }

    const existingRegistration = await Registration.findOne({
      participant: participantId,
      event: eventId,
      participationStatus: { $ne: "Cancelled" }
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        message: "You are already registered for this event" 
      });
    }

    const ticketId = generateTicketId(event.eventName, eventId);

    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
      registrationData: registrationData || {},
      participationStatus: "Registered"
    });

    await registration.populate([
      { path: "event", select: "eventName eventType startDate endDate" },
      { path: "participant", select: "firstName lastName email" }
    ]);

    res.status(201).json({
      message: "Successfully registered for event",
      registration,
      ticketId: registration.ticketId
    });

  } catch (error) {
    console.error("handleRegisterParticipant error:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const handleGetParticipantRegistrations = async (req, res) => {
  try {
    const participantId = req.user.id;

    const registrations = await Registration.find({ 
      participant: participantId
    })
      .populate("event", "eventName eventType startDate endDate registrationFee status organizer")
      .populate("participant", "firstName lastName email")
      .sort({ registeredAt: -1 });

    res.status(200).json({
      message: "Registrations fetched successfully",
      registrations,
      count: registrations.length
    });

  } catch (error) {
    console.error("handleGetParticipantRegistrations error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const handleGetEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ 
        message: "Forbidden: You can only view registrations for your own events" 
      });
    }

    const registrations = await Registration.find({ 
      event: eventId
    })
      .populate("participant", "firstName lastName email phone")
      .sort({ registeredAt: -1 });

    const stats = {
      total: registrations.length,
      registered: registrations.filter(r => r.participationStatus === "Registered").length,
      completed: registrations.filter(r => r.participationStatus === "Completed").length,
      cancelled: registrations.filter(r => r.participationStatus === "Cancelled").length,
      attended: registrations.filter(r => r.attendanceMarked === true).length
    };

    res.status(200).json({
      message: "Event registrations fetched successfully",
      registrations,
      stats
    });

  } catch (error) {
    console.error("handleGetEventRegistrations error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const handleCancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID format" });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.participant.toString() !== participantId.toString()) {
      return res.status(403).json({ 
        message: "Forbidden: Cannot cancel someone else's registration" 
      });
    }

    if (registration.participationStatus === "Cancelled") {
      return res.status(400).json({ 
        message: "Registration is already cancelled" 
      });
    }

    if (registration.participationStatus === "Completed") {
      return res.status(400).json({ 
        message: "Cannot cancel registration for event that is completed" 
      });
    }

    registration.participationStatus = "Cancelled";
    await registration.save();

    res.status(200).json({
      message: "Registration cancelled successfully",
      registration
    });

  } catch (error) {
    console.error("handleCancelRegistration error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};
