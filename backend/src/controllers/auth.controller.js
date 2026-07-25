import authService from "../services/auth.service.js";

import { buildUserResponse } from "../transformers/auth.transformer.js";

import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return sendCreated(res, "User registered successfully.", {
    user: buildUserResponse(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, 200, "Login successful.", {
    user: buildUserResponse(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    200,
    "Current user retrieved successfully.",
    buildUserResponse(req.user)
  );
});