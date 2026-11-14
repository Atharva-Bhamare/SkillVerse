
import crypto from "crypto";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import OfficerApplication from "../models/officerApplication.model.js";

import AppError from "../utils/AppError.js";
import { ROLES } from "../config/constants.js";
import config from "../config/env.js";

import { sendEmail } from "./email.service.js";

// Verification links expire after 24 hours.
const VERIFICATION_EXPIRY_HOURS = 24;

// Generate a cryptographically secure verification token.
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Store only the SHA-256 hash of the verification token.
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Escape user-provided text before inserting it into HTML emails.
const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
};

// Generate the frontend verification URL.
const createVerificationUrl = (token) => {
  const url = new URL("/verify-email.html", config.clientUrl);
  url.searchParams.set("token", token);

  return url.toString();
};

// Send the email verification message.
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = createVerificationUrl(token);
  const safeName = escapeHtml(user.fullName);

  await sendEmail({
    to: user.email,
    subject: "Verify your SkillVerse Placement Officer application",

    text: `
Hello ${user.fullName},

Thank you for applying to become a Placement Officer on SkillVerse.

Please verify your email address using the link below:

${verificationUrl}

This link expires in 24 hours.

Your account will remain inactive until an administrator reviews and approves your application.

If you did not submit this application, please ignore this email.

Regards,
SkillVerse Team
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #4f46e5;">Welcome to SkillVerse!</h2>

        <p>Hello ${safeName},</p>

        <p>
          Thank you for applying to become a Placement Officer on SkillVerse.
        </p>

        <p>Please verify your email address by clicking below:</p>

        <p style="margin: 28px 0;">
          <a
            href="${verificationUrl}"
            style="background-color: #4f46e5; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 6px; display: inline-block;"
          >
            Verify Email Address
          </a>
        </p>

        <p>This verification link expires in <strong>24 hours</strong>.</p>

        <p>
          Your account will remain inactive until an administrator
          reviews and approves your application.
        </p>

        <p>
          If you did not submit this application, please ignore this email.
        </p>

        <p>Regards,<br /><strong>SkillVerse Team</strong></p>
      </div>
    `,
  });
};

// Register a new Placement Officer applicant.
const submitApplication = async (applicationData) => {
  const {
    fullName,
    email,
    password,
    organizationName,
    designation,
    contactNumber,
    reason,
  } = applicationData;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email address already exists.",
      409
    );
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenHash = hashToken(verificationToken);

  const verificationExpiresAt = new Date(
    Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const session = await mongoose.startSession();

  let createdUser;
  let createdApplication;

  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            fullName,
            email: normalizedEmail,
            password,
            role: ROLES.PLACEMENT_OFFICER,
            isActive: false,
            emailVerified: false,
            emailVerifiedAt: null,
          },
        ],
        { session }
      );

      const [application] = await OfficerApplication.create(
        [
          {
            user: user._id,
            organizationName,
            designation,
            contactNumber,
            reason,
            status: "pending",
            verificationTokenHash,
            verificationExpiresAt,
          },
        ],
        { session }
      );

      createdUser = user;
      createdApplication = application;
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "An account with this email address already exists.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  // Send email only after the database transaction commits.
  let emailSent = true;

  try {
    await sendVerificationEmail(createdUser, verificationToken);
  } catch {
    // The application remains saved.
    // The applicant can request another verification email.
    emailSent = false;
  }

  return {
    applicationId: createdApplication._id,
    email: createdUser.email,
    status: createdApplication.status,
    emailSent,
  };
};

// Verify an applicant's email address.
const verifyApplicationEmail = async (token) => {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("Invalid verification link.", 400);
  }

  const verificationTokenHash = hashToken(token);

  const application = await OfficerApplication.findOne({
    verificationTokenHash,
  }).select("+verificationTokenHash +verificationExpiresAt");

  if (!application) {
    throw new AppError(
      "Invalid or already used verification link.",
      400
    );
  }

  if (
    !application.verificationExpiresAt ||
    application.verificationExpiresAt <= new Date()
  ) {
    application.verificationTokenHash = null;
    application.verificationExpiresAt = null;

    await application.save();

    throw new AppError(
      "Verification link has expired. Please request a new one.",
      400
    );
  }

  if (application.status !== "pending") {
    throw new AppError(
      "This application is no longer awaiting verification.",
      400
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(application.user).session(session);

      if (!user) {
        throw new AppError("Applicant account not found.", 404);
      }

      if (user.role !== ROLES.PLACEMENT_OFFICER) {
        throw new AppError("Invalid applicant account.", 400);
      }

      if (user.emailVerified) {
        throw new AppError("Email address is already verified.", 400);
      }

      user.emailVerified = true;
      user.emailVerifiedAt = new Date();

      await user.save({ session });

      application.emailVerifiedAt = new Date();
      application.verificationTokenHash = null;
      application.verificationExpiresAt = null;

      await application.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return {
    message: "Email verified successfully. Your application is awaiting administrator approval.",
    status: application.status,
    emailVerified: true,
  };
};

// Resend the email verification link.
const resendVerificationEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: ROLES.PLACEMENT_OFFICER,
  });

  // Use the same response for unknown or ineligible accounts.
  const genericResponse = {
    message:
      "If an eligible application exists, a verification email will be sent.",
  };

  if (!user || user.emailVerified) {
    return genericResponse;
  }

  const application = await OfficerApplication.findOne({
    user: user._id,
    status: "pending",
  });

  if (!application) {
    return genericResponse;
  }

  const verificationToken = generateVerificationToken();

  application.verificationTokenHash = hashToken(verificationToken);
  application.verificationExpiresAt = new Date(
    Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  await application.save();

  let emailSent = true;

  try {
    await sendVerificationEmail(user, verificationToken);
  } catch {
    emailSent = false;
  }

  return {
    ...genericResponse,
    emailSent,
  };
};

const ensureValidApplicationId = (applicationId) => {
    if (!mongoose.isValidObjectId(applicationId)) {
      throw new AppError("A valid application ID is required.", 400);
    }
  };
  
  // List applications with pagination, filtering and search.
  const listApplications = async (filters = {}) => {
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
  
    const filter = {};
  
    if (filters.status) {
      filter.status = filters.status;
    }
  
    if (filters.search?.trim()) {
      const search = filters.search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
  
      const matchingUsers = await User.find({
        role: ROLES.PLACEMENT_OFFICER,
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
  
      filter.$or = [
        {
          organizationName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          designation: {
            $regex: search,
            $options: "i",
          },
        },
        {
          user: { $in: matchingUsers.map((user) => user._id) },
        },
      ];
    }
  
    const [applications, total] = await Promise.all([
      OfficerApplication.find(filter)
        .populate("user", "fullName email role isActive emailVerified emailVerifiedAt")
        .populate("reviewedBy", "fullName email")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
  
      OfficerApplication.countDocuments(filter),
    ]);
  
    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  };
  
  // Retrieve a single application.
  const getApplicationById = async (applicationId) => {
    ensureValidApplicationId(applicationId);
  
    const application = await OfficerApplication.findById(applicationId)
      .populate(
        "user",
        "fullName email role isActive emailVerified emailVerifiedAt createdAt"
      )
      .populate("reviewedBy", "fullName email")
      .lean();
  
    if (!application) {
      throw new AppError("Placement Officer application not found.", 404);
    }
  
    return application;
  };
  
  // Send a review decision email.
  const sendApplicationDecisionEmail = async (
    user,
    decision,
    rejectionReason = ""
  ) => {
    const safeName = escapeHtml(user.fullName);
    const safeReason = escapeHtml(rejectionReason);
  
    const approved = decision === "approved";
  
    await sendEmail({
      to: user.email,
      subject: approved
        ? "Your SkillVerse Placement Officer application is approved"
        : "Update on your SkillVerse Placement Officer application",
  
      text: approved
        ? `Hello ${user.fullName},
  
  Your Placement Officer application has been approved.
  
  You can now log in to SkillVerse using your registered credentials.
  
  Regards,
  SkillVerse Team`
        : `Hello ${user.fullName},
  
  Your Placement Officer application has been rejected.
  
  Reason: ${rejectionReason}
  
  If you need clarification, please contact the SkillVerse support team.
  
  Regards,
  SkillVerse Team`,
  
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1f2937; line-height: 1.6;">
          <h2 style="color: ${approved ? "#16a34a" : "#dc2626"};">
            ${approved ? "Application Approved" : "Application Update"}
          </h2>
  
          <p>Hello ${safeName},</p>
  
          ${
            approved
              ? `
                <p>
                  Congratulations! Your Placement Officer application
                  has been approved.
                </p>
                <p>You can now log in to SkillVerse using your registered credentials.</p>
              `
              : `
                <p>We regret to inform you that your Placement Officer application has been rejected.</p>
                <p><strong>Reason:</strong> ${safeReason}</p>
                <p>If you need clarification, please contact the SkillVerse support team.</p>
              `
          }
  
          <p>Regards,<br /><strong>SkillVerse Team</strong></p>
        </div>
      `,
    });
  };
  
  // Approve or reject a Placement Officer application.
  const reviewApplication = async (
    applicationId,
    adminId,
    decision,
    rejectionReason = ""
  ) => {
    ensureValidApplicationId(applicationId);
  
    if (!mongoose.isValidObjectId(adminId)) {
      throw new AppError("A valid administrator ID is required.", 400);
    }
  
    if (!["approved", "rejected"].includes(decision)) {
      throw new AppError("Invalid application decision.", 400);
    }
  
    if (decision === "rejected" && !rejectionReason.trim()) {
      throw new AppError("A rejection reason is required.", 400);
    }
  
    const session = await mongoose.startSession();
  
    let applicant;
  
    try {
      await session.withTransaction(async () => {
        const application = await OfficerApplication.findById(
          applicationId
        ).session(session);
  
        if (!application) {
          throw new AppError(
            "Placement Officer application not found.",
            404
          );
        }
  
        if (application.status !== "pending") {
          throw new AppError(
            `This application has already been ${application.status}.`,
            409
          );
        }
  
        const user = await User.findById(application.user).session(session);
  
        if (!user || user.role !== ROLES.PLACEMENT_OFFICER) {
          throw new AppError("Applicant account not found.", 404);
        }
  
        if (decision === "approved" && !user.emailVerified) {
          throw new AppError(
            "The applicant must verify their email before approval.",
            403
          );
        }
  
        if (decision === "approved") {
          user.isActive = true;
        } else {
          user.isActive = false;
          user.refreshToken = null;
        }
  
        await user.save({ session });
  
        application.status = decision;
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.rejectionReason =
          decision === "rejected" ? rejectionReason.trim() : null;
  
        await application.save({ session });
  
        applicant = {
          fullName: user.fullName,
          email: user.email,
        };
      });
    } finally {
      await session.endSession();
    }
  
    // The database decision is committed before sending the email.
    let emailSent = true;
  
    try {
      await sendApplicationDecisionEmail(
        applicant,
        decision,
        rejectionReason
      );
    } catch {
      emailSent = false;
    }
  
    return {
      applicationId,
      status: decision,
      emailSent,
    };
  };
  
  export default {
    submitApplication,
    verifyApplicationEmail,
    resendVerificationEmail,
    listApplications,
    getApplicationById,
    reviewApplication,
  };
