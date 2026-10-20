
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new AppError("Authentication required.", 401);
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError("Authentication required.", 401);
  }

  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  req.user = user;

  next();
});
