
import crypto from "crypto";

import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import config from "../config/env.js";
import { sendEmail } from "./email.service.js";
import RegistrationOtp from "../models/registrationOtp.model.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

// Generate SHA-256 hash of a refresh token.
const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Password reset links expire after 30 minutes.
const PASSWORD_RESET_EXPIRY_MINUTES = 30;

const REGISTRATION_OTP_EXPIRY_MINUTES = 10;
const REGISTRATION_TOKEN_EXPIRY_MINUTES = 10;
const REGISTRATION_OTP_RESEND_COOLDOWN_SECONDS = 60;
const REGISTRATION_OTP_MAX_ATTEMPTS = 5;

const REGISTRATION_OTP_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const generateRegistrationOtp = () => {
  return Array.from(
    { length: 6 },
    () =>
      REGISTRATION_OTP_CHARACTERS[
        crypto.randomInt(0, REGISTRATION_OTP_CHARACTERS.length)
      ]
  ).join("");
};

const generateRegistrationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashRegistrationSecret = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const safeHashCompare = (storedHash, incomingHash) => {
  if (!storedHash || !incomingHash) return false;

  const stored = Buffer.from(storedHash, "hex");
  const incoming = Buffer.from(incomingHash, "hex");

  return (
    stored.length === incoming.length &&
    crypto.timingSafeEqual(stored, incoming)
  );
};

// Generate a cryptographically secure password reset token.
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate SHA-256 hash of a password reset token.
const hashPasswordResetToken = (token) => {
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

// Generate the frontend password reset URL.
const createPasswordResetUrl = (token) => {
  const url = new URL("/frontend/reset-password.html", config.clientUrl);
  url.searchParams.set("token", token);

  return url.toString();
};

// Safely compare two token hashes.
const compareRefreshTokens = (storedHash, incomingToken) => {
  if (!storedHash || !incomingToken) {
    return false;
  }

  const storedBuffer = Buffer.from(storedHash, "hex");
  const incomingBuffer = Buffer.from(
    hashRefreshToken(incomingToken),
    "hex"
  );

  if (storedBuffer.length !== incomingBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, incomingBuffer);
};

const findUserByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });

  if (includePassword) {
    query.select("+password +refreshToken");
  }

  return query;
};

const register = async (userData) => {
  const {
    fullName,
    email,
    password,
    registrationToken,
  } = userData;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("Email is already registered.", 409);
  }

  if (
    !registrationToken ||
    !/^[a-f0-9]{64}$/i.test(registrationToken)
  ) {
    throw new AppError(
      "Please verify your email before registering.",
      403
    );
  }

  const registrationTokenHash =
    hashRegistrationSecret(registrationToken);

  // Atomically consume the verified registration record.
  const verifiedRecord = await RegistrationOtp.findOneAndDelete({
    email: normalizedEmail,
    registrationTokenHash,
    verifiedAt: { $ne: null },
    expiresAt: { $gt: new Date() },
  });

  if (!verifiedRecord) {
    throw new AppError(
      "Email verification is invalid or expired. Please verify your email again.",
      403
    );
  }

  let user;

  try {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role: "student",
      emailVerified: true,
      emailVerifiedAt: verifiedRecord.verifiedAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("Email is already registered.", 409);
    }
  
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = hashRefreshToken(refreshToken);

  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email, true);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = hashRefreshToken(refreshToken);
  user.lastLogin = new Date();

  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 401);
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  if (!user.refreshToken) {
    throw new AppError("Please login again.", 401);
  }

  const isRefreshTokenValid = compareRefreshTokens(
    user.refreshToken,
    refreshToken
  );

  if (!isRefreshTokenValid) {
    throw new AppError("Invalid refresh token.", 401);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = hashRefreshToken(newRefreshToken);

  await user.save();

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (userId) => {
  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  user.refreshToken = null;

  await user.save();

  return true;
};

const changePassword = async (
  userId,
  { currentPassword, newPassword }
) => {
  const user = await User.findById(userId).select(
    "+password +refreshToken"
  );

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect.", 401);
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password.",
      400
    );
  }

  user.password = newPassword;
  user.refreshToken = null;

  await user.save();

  return true;
};

// Send the password reset email.
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = createPasswordResetUrl(token);
  const safeName = escapeHtml(user.fullName);

  await sendEmail({
    to: user.email,
    subject: "Reset your SkillVerse password",

    text: `
Hello ${user.fullName},

We received a request to reset your SkillVerse account password.

Use the link below to set a new password:

${resetUrl}

This link expires in 30 minutes and can only be used once.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Regards,
SkillVerse Team
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>

        <p>Hello ${safeName},</p>

        <p>
          We received a request to reset your SkillVerse account password.
        </p>

        <p>Click the button below to set a new password:</p>

        <p style="margin: 28px 0;">
          <a
            href="${resetUrl}"
            style="background-color: #4f46e5; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 6px; display: inline-block;"
          >
            Reset Password
          </a>
        </p>

        <p>
          This link expires in <strong>30 minutes</strong> and can only be used once.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
          Your password will remain unchanged.
        </p>

        <p>Regards,<br /><strong>SkillVerse Team</strong></p>
      </div>
    `,
  });
};

// Request a password reset email.
const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Use the same response for unknown or ineligible accounts.
  const genericResponse = {
    message:
      "If an eligible account exists, password reset instructions will be sent to its email address.",
  };

  const user = await User.findOne({
    email: normalizedEmail,
    isActive: true,
    emailVerified: true,
  });

  if (!user) {
    return genericResponse;
  }

  const resetToken = generatePasswordResetToken();

  user.passwordResetTokenHash = hashPasswordResetToken(resetToken);

  user.passwordResetExpiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000
  );

  await user.save();

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch {
    // Invalidate the token if email delivery fails.
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await user.save();
  }

  return genericResponse;
};

// Reset the account password using a valid reset token.
const resetPassword = async ({ token, newPassword }) => {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("Invalid or expired password reset link.", 400);
  }

  const tokenHash = hashPasswordResetToken(token);

  // Atomically consume the reset token.
  // Only one request can successfully match and consume it.
  const user = await User.findOneAndUpdate(
    {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: true,
      emailVerified: true,
    },
    {
      $set: {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).select("+refreshToken");

  if (!user) {
    throw new AppError("Invalid or expired password reset link.", 400);
  }

  user.password = newPassword;

  // Invalidate the stored refresh token.
  user.refreshToken = null;

  // The existing pre-save hook hashes the new password.
  await user.save();

  return true;
};

const sendRegistrationOtpEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Verify your SkillVerse email address",

    text: `
Hello,

Thank you for registering with SkillVerse.

Your email verification code is:

${otp}

This code expires in 10 minutes and can only be used once.

If you did not initiate this request, please ignore this email.

Regards,
SkillVerse Team
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #4f46e5;">Verify your email address</h2>

        <p>Hello,</p>

        <p>Thank you for registering with SkillVerse.</p>

        <p>Your email verification code is:</p>

        <div style="margin: 25px 0; padding: 18px; background: #f3f4f6; border-radius: 10px; text-align: center;">
          <strong style="font-size: 30px; letter-spacing: 8px; color: #4f46e5;">
            ${otp}
          </strong>
        </div>

        <p>
          This code expires in <strong>10 minutes</strong>
          and can only be used once.
        </p>

        <p>If you did not initiate this request, please ignore this email.</p>

        <p>Regards,<br /><strong>SkillVerse Team</strong></p>
      </div>
    `,
  });
};

const sendRegistrationOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Avoid revealing whether an email is already registered.
  const existingUser = await User.exists({
    email: normalizedEmail,
  });

  const genericResponse = {
    message:
      "If this email is eligible for registration, a verification code will be sent.",
  };

  if (existingUser) {
    await RegistrationOtp.deleteOne({
      email: normalizedEmail,
    });
  
    throw new AppError(
      "This email is already registered. Please login instead.",
      409
    );
  }

  const now = new Date();

  const cooldownCutoff = new Date(
    now.getTime() -
      REGISTRATION_OTP_RESEND_COOLDOWN_SECONDS * 1000
  );

  const otp = generateRegistrationOtp();
  const otpHash = hashRegistrationSecret(otp);

  const expiresAt = new Date(
    now.getTime() +
      REGISTRATION_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  const update = {
    $set: {
      otpHash,
      attempts: 0,
      lastSentAt: now,
      verifiedAt: null,
      registrationTokenHash: null,
      expiresAt,
    },
  };

  let otpRecord;

  // Atomically enforce the resend cooldown for existing records.
  otpRecord = await RegistrationOtp.findOneAndUpdate(
    {
      email: normalizedEmail,
      $or: [
        { lastSentAt: { $lte: cooldownCutoff } },
        { lastSentAt: { $exists: false } },
      ],
    },
    update,
    {
      returnDocument: "after",
    }
  );

  // Create the first record when this email has no OTP record.
  if (!otpRecord) {
    try {
      otpRecord = await RegistrationOtp.create({
        email: normalizedEmail,
        otpHash,
        attempts: 0,
        lastSentAt: now,
        verifiedAt: null,
        registrationTokenHash: null,
        expiresAt,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError(
          "Please wait 60 seconds before requesting another code.",
          429
        );
      }

      throw error;
    }
  }

  try {
    await sendRegistrationOtpEmail(normalizedEmail, otp);
  } catch (error) {
    // Invalidate this OTP if delivery fails.
    await RegistrationOtp.deleteOne({
      email: normalizedEmail,
      otpHash,
    });

    throw new AppError(
      "Unable to send the verification email. Please try again later.",
      503
    );
  }

  return genericResponse;
};

const verifyRegistrationOtp = async ({ email, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOtp = otp.toUpperCase();
  
  // Prevent an already registered email from being verified again.
  const existingUser = await User.exists({
    email: normalizedEmail,
  });

  if (existingUser) {
    await RegistrationOtp.deleteOne({
      email: normalizedEmail,
    });

    throw new AppError(
      "This email is already registered. Please login instead.",
      409
    );
  }

  const now = new Date();

  // Atomically count this verification attempt.
  const otpRecord = await RegistrationOtp.findOneAndUpdate(
    {
      email: normalizedEmail,
      expiresAt: { $gt: now },
      verifiedAt: null,
      attempts: { $lt: REGISTRATION_OTP_MAX_ATTEMPTS },
    },
    {
      $inc: { attempts: 1 },
    },
    {
      returnDocument: "after",
    }
  ).select("+otpHash");

  if (!otpRecord || !otpRecord.otpHash) {
    throw new AppError(
      "Invalid, expired or exhausted verification code. Please request a new code.",
      400
    );
  }

  const incomingHash = hashRegistrationSecret(normalizedOtp);

  if (!safeHashCompare(otpRecord.otpHash, incomingHash)) {
    throw new AppError(
      "Incorrect verification code. Please try again.",
      400
    );
  }

  const registrationToken = generateRegistrationToken();

  const registrationTokenHash =
    hashRegistrationSecret(registrationToken);

  const registrationExpiresAt = new Date(
    Date.now() +
      REGISTRATION_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  // Only one request can successfully mark this OTP as verified.
  const verifiedRecord = await RegistrationOtp.findOneAndUpdate(
    {
      _id: otpRecord._id,
      verifiedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        otpHash: null,
        verifiedAt: new Date(),
        registrationTokenHash,
        expiresAt: registrationExpiresAt,
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!verifiedRecord) {
    throw new AppError(
      "This verification code has already been used. Please try again.",
      400
    );
  }

  return {
    message: "Email verified successfully.",
    registrationToken,
  };
};

export default {
  register,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};
