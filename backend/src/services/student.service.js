import Student from "../models/student.model.js";

import { STUDENT } from "../config/constants.js";

import AppError from "../utils/AppError.js";
import { calculateStudentProfileCompletion } from "../utils/profileCompletion.js";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "./upload.service.js";

/* =====================================================
   Private Helpers
===================================================== */

const findStudentOrThrow = async (
  userId,
  populate = false
) => {
  let query = Student.findOne({ user: userId });

  if (populate) {
    query = query.populate(
      "user",
      "name email role"
    );
  }

  const student = await query;

  if (!student) {
    throw new AppError(
      "Student profile not found.",
      404
    );
  }

  return student;
};

const ensureProfileDoesNotExist = async (userId) => {
  const exists = await Student.exists({ user: userId });

  if (exists) {
    throw new AppError(
      "Student profile already exists.",
      409
    );
  }
};

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  const uniqueSkills = new Map();

  for (const skill of skills) {
    if (typeof skill !== "string") continue;

    const cleaned = skill.trim();

    if (!cleaned) continue;

    // preserve original casing
    uniqueSkills.set(cleaned.toLowerCase(), cleaned);
  }

  return [...uniqueSkills.values()].sort();
};

const updateStudentFields = (
  student,
  profileData
) => {
  for (const field of STUDENT.ALLOWED_UPDATE_FIELDS) {
    if (field in profileData) {
      student[field] = profileData[field];
    }
  }

  if ("skills" in profileData) {
    student.skills = normalizeSkills(
      profileData.skills
    );
  }
};

const refreshProfileStatus = (student) => {
  student.profileCompletion =
    calculateStudentProfileCompletion(student);

  student.isProfileComplete =
    student.profileCompletion === 100;
};

const saveStudent = async (student) => {
  refreshProfileStatus(student);

  await student.save();

  return student;
};

/* =====================================================
   Public Services
===================================================== */

export const createStudentProfile = async (
  userId,
  profileData
) => {
  await ensureProfileDoesNotExist(userId);

  const student = new Student({
    user: userId,
    ...profileData,
    skills: normalizeSkills(profileData.skills),
  });

  return await saveStudent(student);
};

export const getStudentProfile = async (
  userId
) => {
  return await findStudentOrThrow(userId);
};

export const updateStudentProfile = async (
  userId,
  profileData
) => {
  const student =
    await findStudentOrThrow(userId);

  updateStudentFields(student, profileData);

  return await saveStudent(student);
};

export const updateStudentAvatar = async (
  userId,
  file
) => {
  if (!file) {
    throw new AppError(
      "Avatar image is required.",
      400
    );
  }

  const student =
    await findStudentOrThrow(userId);

  const previousPublicId =
    student.avatar?.publicId;

  const uploadedAvatar =
    await uploadToCloudinary(
      file.path,
      STUDENT.AVATAR_FOLDER
    );

  try {
    student.avatar = {
      url: uploadedAvatar.url,
      publicId: uploadedAvatar.publicId,
    };

    await saveStudent(student);
  } catch (error) {
    try {
      await deleteFromCloudinary(
        uploadedAvatar.publicId
      );
    } catch {
      // Ignore rollback failure.
      // Logger (Winston) can be added here later.
    }

    throw error;
  }

  if (previousPublicId) {
    try {
      await deleteFromCloudinary(
        previousPublicId
      );
    } catch {
      // Old avatar cleanup failure should not
      // fail the request.
      // Logger (Winston) can be added here later.
    }
  }

  return student;
};