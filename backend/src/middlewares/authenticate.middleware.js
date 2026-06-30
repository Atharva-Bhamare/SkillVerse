import User from "../models/user.model.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // No token provided
  if (!token) {
    throw new AppError(
      "Access denied. Please log in to continue.",
      401
    );
  }

  let decoded;

try {
  decoded = verifyAccessToken(token);
} catch (error) {
  if (error.name === "TokenExpiredError") {
    throw new AppError(
      "Your session has expired. Please log in again.",
      401
    );
  }

  if (error.name === "JsonWebTokenError") {
    throw new AppError(
      "Invalid authentication token.",
      401
    );
  }

  throw error;
}

// Find user
const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  // Attach authenticated user
  req.user = user;

  next();
});

export default protect;