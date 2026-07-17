import asyncHandler from "../utils/asyncHandler.js";

import * as studentService from "../services/student.service.js";

import { buildStudentResponse } from "../transformers/student.transformer.js";

/* =====================================================
   Student Profile
===================================================== */

export const createStudentProfile = asyncHandler(
  async (req, res) => {
    const student =
      await studentService.createStudentProfile(
        req.user.id,
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Student profile created successfully.",
      data: buildStudentResponse(student),
    });
  }
);

export const getStudentProfile = asyncHandler(
  async (req, res) => {
    const student =
      await studentService.getStudentProfile(
        req.user.id
      );

    res.status(200).json({
      success: true,
      data: buildStudentResponse(student),
    });
  }
);

export const updateStudentProfile = asyncHandler(
  async (req, res) => {
    const student =
      await studentService.updateStudentProfile(
        req.user.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Student profile updated successfully.",
      data: buildStudentResponse(student),
    });
  }
);

export const updateStudentAvatar = asyncHandler(
  async (req, res) => {
    const student =
      await studentService.updateStudentAvatar(
        req.user.id,
        req.file
      );

    res.status(200).json({
      success: true,
      message:
        "Avatar updated successfully.",
      data: buildStudentResponse(student),
    });
  }
);