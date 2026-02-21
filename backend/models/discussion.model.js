import mongoose from "mongoose";

const discussionMessageSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "senderRole"
    },
    senderRole: {
        type: String,
        enum: ["Participant", "Organizer"],
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscussionMessage",
        default: null
    },
    reactions: {
        like: [{ type: mongoose.Schema.Types.ObjectId }],
        love: [{ type: mongoose.Schema.Types.ObjectId }],
        insightful: [{ type: mongoose.Schema.Types.ObjectId }]
    }
}, { timestamps: true });

export const DiscussionMessage = mongoose.model("DiscussionMessage", discussionMessageSchema);
