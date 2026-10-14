
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required."],
      trim: true,
      minlength: [3, "Job title must be at least 3 characters long."],
      maxlength: [150, "Job title cannot exceed 150 characters."],
      index: true,
    },

    description: {
      type: String,
      required: [true, "Job description is required."],
      trim: true,
      minlength: [20, "Job description must be at least 20 characters long."],
      maxlength: [10000, "Job description cannot exceed 10000 characters."],
    },

    responsibilities: {
      type: [String],
      default: [],
      validate: {
        validator(values) {
          return values.every(
            (value) =>
              typeof value === "string" &&
              value.trim().length > 0 &&
              value.length <= 500
          );
        },
        message: "Each responsibility must contain 1 to 500 characters.",
      },
    },

    requirements: {
      type: [String],
      default: [],
      validate: {
        validator(values) {
          return values.every(
            (value) =>
              typeof value === "string" &&
              value.trim().length > 0 &&
              value.length <= 500
          );
        },
        message: "Each requirement must contain 1 to 500 characters.",
      },
    },

    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required."],
      index: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Job creator is required."],
      index: true,
    },

    employmentType: {
      type: String,
      enum: [
        "full-time",
        "part-time",
        "contract",
        "internship",
        "temporary",
      ],
      required: [true, "Employment type is required."],
    },

    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      required: [true, "Work mode is required."],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [150, "Job location cannot exceed 150 characters."],
      default: "",
    },

    salary: {
      min: {
        type: Number,
        min: [0, "Minimum salary cannot be negative."],
        default: null,
      },

      max: {
        type: Number,
        min: [0, "Maximum salary cannot be negative."],
        default: null,
      },

      currency: {
        type: String,
        uppercase: true,
        trim: true,
        default: "INR",
        maxlength: 3,
      },

      isDisclosed: {
        type: Boolean,
        default: true,
      },
    },

    experience: {
      minYears: {
        type: Number,
        min: [0, "Minimum experience cannot be negative."],
        default: 0,
      },

      maxYears: {
        type: Number,
        min: [0, "Maximum experience cannot be negative."],
        default: null,
      },
    },

    openings: {
      type: Number,
      required: [true, "Number of openings is required."],
      min: [1, "There must be at least one opening."],
      max: [10000, "Openings cannot exceed 10000."],
      default: 1,
    },

    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required."],
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "open", "closed", "cancelled"],
      default: "draft",
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

jobSchema.pre("validate", function () {
    const salary = this.salary;
  
    if (
      salary &&
      salary.min != null &&
      salary.max != null &&
      salary.max < salary.min
    ) {
      this.invalidate(
        "salary.max",
        "Maximum salary must be greater than or equal to minimum salary."
      );
    }
  });

  jobSchema.pre("validate", function () {
    const experience = this.experience;
  
    if (
      experience &&
      experience.minYears != null &&
      experience.maxYears != null &&
      experience.maxYears < experience.minYears
    ) {
      this.invalidate(
        "experience.maxYears",
        "Maximum experience must be greater than or equal to minimum experience."
      );
    }
  });

jobSchema.index({ status: 1, isActive: 1, createdAt: -1 });
jobSchema.index({ company: 1, status: 1, isActive: 1 });
jobSchema.index({ skills: 1, status: 1 });
jobSchema.index({ applicationDeadline: 1, status: 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
