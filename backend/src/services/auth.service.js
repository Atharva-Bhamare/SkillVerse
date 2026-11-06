
import crypto from "crypto";

import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

// Generate SHA-256 hash of a refresh token.
const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
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

export default {
  register,
  login,
  refresh,
  logout,
  changePassword,
};
