import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";

export const registerUser = async (userData) => {
  const { email } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      409
    );
  }

  // Create user
  const user = await User.create(userData);

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password.", 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateAccessToken(user);

  return {
    user,
    token,
  };
};