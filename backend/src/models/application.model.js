
import mongoose from "mongoose";

const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required."],
      index: true,
    },

    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job is required."],
      index: true,
    },

    resume: {
      type: String,
      trim: true,
      default: null,
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: [5000, "Cover letter cannot exceed 5000 characters."],
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "reviewing",
        "shortlisted",
        "rejected",
        "accepted",
        "withdrawn",
      ],
      default: "pending",
      index: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },

    statusUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters."],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// A student can apply to a particular job only once.
applicationSchema.index(
  { student: 1, job: 1 },
  { unique: true }
);

// Efficiently retrieve applications for a job by status and date.
applicationSchema.index({
  job: 1,
  status: 1,
  appliedAt: -1,
});

// Efficiently retrieve a student's applications.
applicationSchema.index({
  student: 1,
  appliedAt: -1,
});

applicationSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.statusUpdatedAt = new Date();
  }
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;
