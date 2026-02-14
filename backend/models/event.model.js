import mongoose from "mongoose";

const customFieldSchema = new mongoose.Schema({
  fieldLabel: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ["TEXT", "NUMBER", "EMAIL", "DROPDOWN", "CHECKBOX", "FILE"],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String] // for drop down or checkbx
}, { _id: false });

const merchandiseVariantSchema = new mongoose.Schema({
  name: String,        
  stock: Number
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    eventType: {
      type: String,
      enum: ["NORMAL", "MERCH"],
      required: true
    },

    eligibility: {
      type: String,
      enum: ["IIIT", "NON_IIIT", "BOTH"],
      default: "BOTH"
    },

    registrationDeadline: {
      type: Date,
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    registrationLimit: {
      type: Number,
      default: null
    },

    registrationFee: {
      type: Number,
      default: 0
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true
    },

    tags: [{
      type: String
    }],

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CLOSED"],
      default: "DRAFT"
    },

    customFields: [customFieldSchema],   // for normal events

    merchandiseVariants: [merchandiseVariantSchema], // for merch evnets 

    purchaseLimitPerUser: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
