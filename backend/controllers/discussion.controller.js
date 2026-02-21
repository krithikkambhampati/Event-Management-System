import { DiscussionMessage } from "../models/discussion.model.js";
import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";

export const handleGetMessages = async (req, res) => {
    try {
        const { eventId } = req.params;

        const messages = await DiscussionMessage.find({ event: eventId })
            .sort({ isPinned: -1, createdAt: 1 })
            .limit(200);

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Post a new message
export const handlePostMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, parentMessage } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required" });
        }

        if (content.length > 1000) {
            return res.status(400).json({ message: "Message too long (max 1000 characters)" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        let senderName = "";
        let senderRole = "";

        if (userRole === "ORGANIZER") {
            if (event.organizer.toString() !== userId) {
                return res.status(403).json({ message: "You are not the organizer of this event" });
            }
            senderName = "Organizer";
            senderRole = "Organizer";
        } else if (userRole === "PARTICIPANT") {
            const registration = await Registration.findOne({
                participant: userId,
                event: eventId,
                participationStatus: { $in: ["Registered", "Completed"] }
            });

            if (!registration) {
                return res.status(403).json({ message: "You must be registered for this event to post" });
            }

            const { Participant } = await import("../models/participant.model.js");
            const participant = await Participant.findById(userId);
            senderName = participant ? `${participant.fName} ${participant.lName}` : "Participant";
            senderRole = "Participant";
        } else {
            return res.status(403).json({ message: "Only participants and organizers can post" });
        }

        const message = await DiscussionMessage.create({
            event: eventId,
            sender: userId,
            senderRole,
            senderName,
            content: content.trim(),
            parentMessage: parentMessage || null
        });

        res.status(201).json({ message: "Message posted", data: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a message (organizer only - moderation)
export const handleDeleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const message = await DiscussionMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const event = await Event.findById(message.event);
        const isOrganizer = userRole === "ORGANIZER" && event.organizer.toString() === userId;
        const isSender = message.sender.toString() === userId;

        if (!isOrganizer && !isSender) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        await DiscussionMessage.deleteMany({ parentMessage: messageId });
        await DiscussionMessage.findByIdAndDelete(messageId);

        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Pin/unpin a message (organizer only)
export const handleTogglePin = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await DiscussionMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const event = await Event.findById(message.event);
        if (event.organizer.toString() !== userId) {
            return res.status(403).json({ message: "Only the event organizer can pin messages" });
        }

        message.isPinned = !message.isPinned;
        await message.save();

        res.status(200).json({ message: message.isPinned ? "Message pinned" : "Message unpinned", data: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// React to a message
export const handleReactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reaction } = req.body;
        const userId = req.user.id;

        if (!["like", "love", "insightful"].includes(reaction)) {
            return res.status(400).json({ message: "Invalid reaction type" });
        }

        const message = await DiscussionMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const userIdObj = userId;
        const hasReacted = message.reactions[reaction].some(id => id.toString() === userIdObj);

        if (hasReacted) {
            message.reactions[reaction] = message.reactions[reaction].filter(id => id.toString() !== userIdObj);
        } else {
            message.reactions[reaction].push(userIdObj);
        }

        await message.save();

        res.status(200).json({ message: "Reaction updated", data: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
