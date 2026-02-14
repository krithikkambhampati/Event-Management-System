import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema(
  {
    organizerName: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    contactEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true,
    },


  },{ timestamps: true });

export const Organizer = mongoose.model("Organizer", organizerSchema);
