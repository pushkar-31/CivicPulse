
import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: [
        "Garbage",
        "Pothole",
        "Streetlight",
        "Water Leakage",
        "Public Property",
        "Other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["reported", "in-progress", "resolved", "rejected"],
      default: "reported",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    location: {
      address: { type: String, trim: true, default: "" },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator(value) {
            return (
              value === undefined ||
              (value.length === 2 &&
                value.every(Number.isFinite) &&
                value[0] >= -180 &&
                value[0] <= 180 &&
                value[1] >= -90 &&
                value[1] <= 90)
            );
          },
          message: "Coordinates must be [longitude, latitude].",
        },
      },
    },
    imageUrl: {
      type: String,
      default: "",
    },
    resolutionImageUrl: {
      type: String,
      default: "",
    },
    resolutionNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["reported", "in-progress", "resolved", "rejected"],
          required: true,
        },
        note: { type: String, default: "" },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

issueSchema.index({ "location.coordinates": "2dsphere" });

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
