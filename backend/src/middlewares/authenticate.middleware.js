import jwt from "jsonwebtoken";

import User from "../models/user.model.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authorization.split(" ")[1];

  const { userId } = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  req.user = user;

  next();
});