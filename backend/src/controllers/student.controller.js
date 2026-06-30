import asyncHandler from "../utils/asyncHandler.js";
import { buildStudentResponse } from "../utils/studentResponse.js";
import {
  sendCreated,
  sendSuccess,
} from "../utils/apiResponse.js";

import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../services/student.service.js";

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await createStudentProfile(
    req.user._id,
    req.body
  );

  return sendCreated(
    res,
    "Student profile created successfully.",
    buildStudentResponse(profile)
  );
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getStudentProfile(req.user._id);

  return sendSuccess(
    res,
    200,
    "Student profile retrieved successfully.",
    buildStudentResponse(profile)
  );
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const student = await updateStudentProfile(
    req.user._id,
    req.body
  );

  return sendSuccess(
    res,
    200,
    "Student profile updated successfully.",
    buildStudentResponse(student)
  );
});