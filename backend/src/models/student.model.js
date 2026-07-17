import mongoose from "mongoose";

import fileSchema from "../schemas/file.schema.js";

const studentSchema = new mongoose.Schema(
  {
    // ==========================
    // User Reference
    // ==========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ==========================
    // Profile
    // ==========================
    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    avatar: {
      type: fileSchema,
      default: () => ({}),
    },

    // ==========================
    // Academic Information
    // ==========================
    college: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    degree: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    specialization: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    graduationYear: {
      type: Number,
      min: 2000,
      max: 2100,
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },

    // ==========================
    // Skills
    // ==========================
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // ==========================
    // Social Links
    // ==========================
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      github: {
        type: String,
        trim: true,
        default: "",
      },

      portfolio: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ==========================
    // Profile Status
    // ==========================
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    profileVisibility: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// Indexes
// ==========================
studentSchema.index({ college: 1 });

studentSchema.index({ graduationYear: 1 });

studentSchema.index({ skills: 1 });

const Student = mongoose.model("Student", studentSchema);

export default Student;