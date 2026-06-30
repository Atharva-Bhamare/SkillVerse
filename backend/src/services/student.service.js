import Student from "../models/student.model.js";
import AppError from "../utils/AppError.js";
import { calculateStudentProfileCompletion } from "../utils/profileCompletion.js";

export const createStudentProfile = async (userId, profileData) => {
  const existingProfile = await Student.findOne({
    user: userId,
  });

  if (existingProfile) {
    throw new AppError(
      "Student profile already exists.",
      409
    );
  }

  const profile = await Student.create({
    ...profileData,
    user: userId,
  });

  return profile;
};

export const getStudentProfile = async (userId) => {
  const profile = await Student.findOne({
    user: userId,
  }).populate(
    "user",
    "fullName email role"
  );

  if (!profile) {
    throw new AppError(
      "Student profile not found.",
      404
    );
  }

  return profile;
};

const findStudentOrThrow = async (userId) => {
  const student = await Student.findOne({
    user: userId,
  }).populate("user", "fullName email role");

  if (!student) {
    throw new AppError(
      "Student profile not found.",
      404
    );
  }

  return student;
};

export const updateStudentProfile = async (
  userId,
  updateData
) => {
  const student = await findStudentOrThrow(userId);

  const allowedFields = [
    "headline",
    "bio",
    "college",
    "degree",
    "specialization",
    "graduationYear",
    "cgpa",
    "skills",
    "socialLinks",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      student[field] = updateData[field];
    }
  });

  student.profileCompletion =
    calculateStudentProfileCompletion(student);

  await student.save();

  await student.populate(
    "user",
    "fullName email role"
  );
  
  return student;
};