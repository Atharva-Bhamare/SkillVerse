import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    headline: {
      type: String,
      required: [true, "Headline is required."],
      trim: true,
      maxlength: [100, "Headline cannot exceed 100 characters."],
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters."],
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    college: {
      type: String,
      required: [true, "College is required."],
      trim: true,
      maxlength: [150, "College name cannot exceed 150 characters."],
      index: true,
    },

    degree: {
      type: String,
      required: [true, "Degree is required."],
      trim: true,
      maxlength: [100, "Degree cannot exceed 100 characters."],
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required."],
      trim: true,
      maxlength: [100, "Specialization cannot exceed 100 characters."],
    },

    graduationYear: {
      type: Number,
      required: [true, "Graduation year is required."],
      min: [2020, "Graduation year is invalid."],
      max: [2045, "Graduation year is invalid."],
      index: true,
    },

    cgpa: {
      type: Number,
      min: [0, "CGPA cannot be less than 0."],
      max: [10, "CGPA cannot exceed 10."],
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    socialLinks: {
      github: {
        type: String,
        default: "",
      },

      linkedin: {
        type: String,
        default: "",
      },

      portfolio: {
        type: String,
        default: "",
      },
    },

    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;