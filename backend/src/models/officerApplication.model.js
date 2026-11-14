
import mongoose from "mongoose";

const officerApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant user is required."],
      unique: true,
    },

    organizationName: {
      type: String,
      required: [true, "Organization name is required."],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    designation: {
      type: String,
      required: [true, "Designation is required."],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required."],
      trim: true,
      match: [
        /^\+?[0-9\s()-]{7,20}$/,
        "Please provide a valid contact number.",
      ],
    },

    reason: {
      type: String,
      required: [true, "Application reason is required."],
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    verificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient admin application listing.
officerApplicationSchema.index({ status: 1, createdAt: -1 });

const OfficerApplication = mongoose.model(
  "OfficerApplication",
  officerApplicationSchema
);

export default OfficerApplication;
