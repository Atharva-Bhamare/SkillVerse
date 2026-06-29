import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

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