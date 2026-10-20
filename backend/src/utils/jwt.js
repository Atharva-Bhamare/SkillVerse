
import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateAccessToken = (user) => {
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

  if (decoded.tokenType !== "access") {
    throw new jwt.JsonWebTokenError("Invalid access token type.");
  }

  return decoded;
};

export const generateRefreshToken = (user) => {
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

  if (decoded.tokenType !== "refresh") {
    throw new jwt.JsonWebTokenError("Invalid refresh token type.");
  }

  return decoded;
};
