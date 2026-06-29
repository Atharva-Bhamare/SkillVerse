import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};