
import jwt from "jsonwebtoken";
import config from "../config/env.js";

const validateUser = (user) => {
  if (!user?._id) {
    throw new Error("A valid user is required to generate tokens.");
  }
};

export const generateAccessToken = (user) => {
  validateUser(user);

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      tokenType: "access",
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, config.jwtSecret);

  if (decoded.tokenType !== "access" || !decoded.id) {
    throw new jwt.JsonWebTokenError("Invalid access token.");
  }

  return decoded;
};

export const generateRefreshToken = (user) => {
  validateUser(user);

  return jwt.sign(
    {
      id: user._id.toString(),
      tokenType: "refresh",
    },
    config.jwtRefreshSecret,
    {
      expiresIn: "30d",
    }
  );
};

export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, config.jwtRefreshSecret);

  if (decoded.tokenType !== "refresh" || !decoded.id) {
    throw new jwt.JsonWebTokenError("Invalid refresh token.");
  }

  return decoded;
};
