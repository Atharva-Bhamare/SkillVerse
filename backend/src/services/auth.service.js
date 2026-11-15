
import crypto from "crypto";

import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import config from "../config/env.js";
import { sendEmail } from "./email.service.js";

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
  const { fullName, email, password } = userData;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("Email is already registered.", 409);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: "student",
  });

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
      new: true,
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

export default {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};
