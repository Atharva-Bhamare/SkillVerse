import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated } from "../utils/apiResponse.js";
import { registerUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  const userResponse = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
  
  return sendCreated(
    res,
    "User registered successfully.",
    userResponse
  );
});