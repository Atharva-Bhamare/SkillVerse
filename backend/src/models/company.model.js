import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters long."],
      maxlength: [100, "Company name cannot exceed 100 characters."],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Company description cannot exceed 2000 characters.",
      ],
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      maxlength: [100, "Industry cannot exceed 100 characters."],
      default: "",
    },

    website: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;

          try {
            const url = new URL(value);
            return ["http:", "https:"].includes(url.protocol);
          } catch {
            return false;
          }
        },
        message: "Please provide a valid HTTP or HTTPS company website.",
      },
    },

    location: {
      type: String,
      trim: true,
      maxlength: [150, "Location cannot exceed 150 characters."],
      default: "",
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;

          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please provide a valid company contact email.",
      },
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Contact phone cannot exceed 20 characters."],
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Company creator is required."],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

companySchema.index({ name: 1, isActive: 1 });

const Company = mongoose.model("Company", companySchema);

export default Company;