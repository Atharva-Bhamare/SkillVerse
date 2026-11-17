
import mongoose from "mongoose";

const registrationOtpSchema = new mongoose.Schema(
  {
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

    otpHash: {
      type: String,
      default: null,
      select: false,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastSentAt: {
      type: Date,
      required: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    registrationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RegistrationOtp = mongoose.model(
  "RegistrationOtp",
  registrationOtpSchema
);

export default RegistrationOtp;
