import { buildUserResponse } from "../utils/userResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated } from "../utils/apiResponse.js";
import { registerUser } from "../services/auth.service.js";
import { loginUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  return sendCreated(
    res,
    "User registered successfully.",
    buildUserResponse(user)
  );
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  return sendSuccess(
    res,
    200,
    "Login successful.",
    {
      user: buildUserResponse(user),
      accessToken: token,
    }
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    200,
    "Current user retrieved successfully.",
    buildUserResponse(req.user)
  );
});