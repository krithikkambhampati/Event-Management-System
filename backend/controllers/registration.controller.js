import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import { Participant } from "../models/participant.model.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
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
      participationStatus: { $nin: ["Cancelled"] }
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You are already registered for this event"
      });
    }

    if (event.eventType === "NORMAL" && event.customFields && event.customFields.length > 0) {
      const data = registrationData || {};

      for (const field of event.customFields) {
        if (field.required && !data[field.fieldLabel]) {
          return res.status(400).json({
            message: `${field.fieldLabel} is required`
          });
        }

        if (data[field.fieldLabel] && field.fieldType === "DROPDOWN" && field.options.length > 0) {
          if (!field.options.includes(data[field.fieldLabel])) {
            return res.status(400).json({
              message: `${field.fieldLabel} has invalid value`
            });
          }
        }
      }
    }

    if (event.eventType === "MERCH") {
      const selectedVariant = registrationData?.selectedVariant;
      if (!selectedVariant) {
        return res.status(400).json({ message: "Please select a merchandise variant" });
      }

      const variant = event.merchandiseVariants.find(v => v.name === selectedVariant);
      if (!variant) {
        return res.status(400).json({ message: "Invalid variant selected" });
      }
      if (variant.stock <= 0) {
        return res.status(400).json({ message: `Variant "${selectedVariant}" is out of stock` });
      }

      // Check purchase limit per user
      if (event.purchaseLimitPerUser) {
        const userPurchases = await Registration.countDocuments({
          participant: participantId,
          event: eventId,
          participationStatus: { $nin: ["Cancelled"] }
        });
        if (userPurchases >= event.purchaseLimitPerUser) {
          return res.status(400).json({
            message: `Purchase limit reached (max ${event.purchaseLimitPerUser} per person)`
          });
        }
      }

      // Payment proof is required for MERCH events
      const paymentProof = registrationData?.paymentProof;
      if (!paymentProof) {
        return res.status(400).json({ message: "Payment proof is required for merchandise purchases" });
      }

      // DO NOT decrement stock here — only on approval
      const ticketId = generateTicketId(event.eventName, eventId);

      const registration = await Registration.create({
        participant: participantId,
        event: eventId,
        ticketId,
        registrationData: registrationData || {},
        participationStatus: "Pending",
        paymentProof: paymentProof,
        paymentStatus: "Pending"
      });

      await registration.populate([
        { path: "event", select: "eventName eventType startDate endDate" },
        { path: "participant", select: "fName lName email" }
      ]);

      // NO email sent for pending orders — email is sent only on approval

      return res.status(201).json({
        message: "Order placed! Awaiting organizer approval.",
        registration,
        ticketId: registration.ticketId,
        isPending: true
      });
    }

    // NORMAL event flow 
    const ticketId = generateTicketId(event.eventName, eventId);

    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
      registrationData: registrationData || {},
      participationStatus: "Registered",
      paymentStatus: "Not Required"
    });

    await registration.populate([
      { path: "event", select: "eventName eventType startDate endDate" },
      { path: "participant", select: "fName lName email" }
    ]);

    // Send ticket email to participant (non-blocking)
    const participant = await Participant.findById(participantId).select("fName lName email");
    if (participant) {
      sendTicketEmail({
        to: participant.email,
        participantName: `${participant.fName} ${participant.lName}`,
        eventName: event.eventName,
        ticketId: registration.ticketId,
        eventDate: event.startDate,
        eventType: event.eventType
      });
    }

    res.status(201).json({
      message: "Successfully registered for event",
      registration,
      ticketId: registration.ticketId
    });

  } catch (error) {
    console.error("handleRegisterParticipant error:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Organizer approves a pending merch payment
export const handleApprovePayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const organizerId = req.user.id;

    const registration = await Registration.findById(registrationId).populate("event").populate("participant", "fName lName email");
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify organizer owns the event
    if (registration.event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "Forbidden: Not your event" });
    }

    if (registration.paymentStatus !== "Pending") {
      return res.status(400).json({ message: `Cannot approve — payment is already ${registration.paymentStatus}` });
    }

    // Decrement stock atomically
    const selectedVariant = registration.registrationData?.selectedVariant;
    if (selectedVariant) {
      const updateResult = await Event.updateOne(
        { _id: registration.event._id, "merchandiseVariants.name": selectedVariant, "merchandiseVariants.stock": { $gt: 0 } },
        { $inc: { "merchandiseVariants.$.stock": -1 } }
      );
      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ message: `Variant "${selectedVariant}" is now out of stock. Cannot approve.` });
      }
    }

    // Update registration
    registration.participationStatus = "Registered";
    registration.paymentStatus = "Approved";
    await registration.save();

    // Send confirmation email with QR (now that payment is approved)
    if (registration.participant) {
      sendTicketEmail({
        to: registration.participant.email,
        participantName: `${registration.participant.fName} ${registration.participant.lName}`,
        eventName: registration.event.eventName,
        ticketId: registration.ticketId,
        eventDate: registration.event.startDate,
        eventType: registration.event.eventType,
        selectedVariant: selectedVariant || null
      });
    }

    res.status(200).json({
      message: "Payment approved. Ticket and email sent to participant.",
      registration
    });

  } catch (error) {
    console.error("handleApprovePayment error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Organizer rejects a pending merch payment
export const handleRejectPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const organizerId = req.user.id;
    const { reason } = req.body;

    const registration = await Registration.findById(registrationId).populate("event");
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "Forbidden: Not your event" });
    }

    if (registration.paymentStatus !== "Pending") {
      return res.status(400).json({ message: `Cannot reject — payment is already ${registration.paymentStatus}` });
    }

    // No stock change needed — stock was never decremented
    registration.participationStatus = "Cancelled";
    registration.paymentStatus = "Rejected";
    registration.rejectionReason = reason || "Payment rejected by organizer";
    await registration.save();

    res.status(200).json({
      message: "Payment rejected.",
      registration
    });

  } catch (error) {
    console.error("handleRejectPayment error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetParticipantRegistrations = async (req, res) => {
  try {
    const participantId = req.user.id;

    const registrations = await Registration.find({
      participant: participantId
    })
      .populate({
        path: "event",
        select: "eventName eventType startDate endDate registrationFee status organizer",
        populate: { path: "organizer", select: "organizerName" }
      })
      .populate("participant", "fName lName email")
      .sort({ registeredAt: -1 });

    res.status(200).json({
      message: "Registrations fetched successfully",
      registrations,
      count: registrations.length
    });

  } catch (error) {
    console.error("handleGetParticipantRegistrations error:", error.message);
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
      .populate("participant", "fName lName email contactNumber")
      .sort({ registeredAt: -1 });

    const stats = {
      total: registrations.length,
      registered: registrations.filter(r => r.participationStatus === "Registered").length,
      pending: registrations.filter(r => r.participationStatus === "Pending").length,
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
    console.error("handleGetEventRegistrations error:", error.message);
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
    if (registration.paymentStatus === "Pending") {
      registration.paymentStatus = "Rejected";
      registration.rejectionReason = "Cancelled by participant";
    }
    await registration.save();

    if (registration.paymentStatus === "Approved" && registration.registrationData?.selectedVariant) {
      const event = await Event.findById(registration.event);
      if (event && event.eventType === "MERCH") {
        await Event.updateOne(
          { _id: registration.event, "merchandiseVariants.name": registration.registrationData.selectedVariant },
          { $inc: { "merchandiseVariants.$.stock": 1 } }
        );
      }
    }

    res.status(200).json({
      message: "Registration cancelled successfully",
      registration
    });

  } catch (error) {
    console.error("handleCancelRegistration error:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
