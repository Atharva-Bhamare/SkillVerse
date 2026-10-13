import jwt from "jsonwebtoken";
import config from "../config/env.js";

/* =====================================================
   Access Token
===================================================== */

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
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

/* =====================================================
   Refresh Token
===================================================== */

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    config.jwtSecret,
    {
      expiresIn: "30d",
    }
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};