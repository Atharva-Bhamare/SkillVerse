import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

const findUserByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });

  if (includePassword) {
    query.select("+password +refreshToken");
  }

  return query;
};

const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );

  const register = async () => {
    // Next step
  };
  
  const login = async () => {
    // Next step
  };
  
  const refresh = async () => {
    // Next step
  };
  
  const logout = async () => {
    // Next step
  };
  
  const changePassword = async () => {
    // Next step
  };
  
  export default {
    register,
    login,
    refresh,
    logout,
    changePassword,
  };