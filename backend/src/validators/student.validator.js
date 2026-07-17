import {
  stringRequired,
  stringOptional,
  integerRequired,
  integerOptional,
  floatRequired,
  floatOptional,
  arrayRequired,
  arrayOptional,
  arrayStringItems,
  urlOptional,
} from "./common.validator.js";

/* =====================================================
   Student Profile Validators
===================================================== */

export const createStudentProfileValidator = [
  stringRequired("headline", "Headline"),

  stringRequired("bio", "Bio"),

  stringRequired("college", "College"),

  stringRequired("degree", "Degree"),

  stringRequired(
    "specialization",
    "Specialization"
  ),

  integerRequired(
    "graduationYear",
    "Graduation Year"
  ),

  floatRequired("cgpa", "CGPA"),

  arrayRequired("skills", "Skills"),

  arrayStringItems("skills", "Skill"),

  urlOptional(
    "socialLinks.github",
    "GitHub"
  ),

  urlOptional(
    "socialLinks.linkedin",
    "LinkedIn"
  ),

  urlOptional(
    "socialLinks.portfolio",
    "Portfolio"
  ),
];

export const updateStudentProfileValidator = [
  stringOptional("headline", "Headline"),

  stringOptional("bio", "Bio"),

  stringOptional("college", "College"),

  stringOptional("degree", "Degree"),

  stringOptional(
    "specialization",
    "Specialization"
  ),

  integerOptional(
    "graduationYear",
    "Graduation Year"
  ),

  floatOptional("cgpa", "CGPA"),

  arrayOptional("skills", "Skills"),

  arrayStringItems("skills", "Skill"),

  urlOptional(
    "socialLinks.github",
    "GitHub"
  ),

  urlOptional(
    "socialLinks.linkedin",
    "LinkedIn"
  ),

  urlOptional(
    "socialLinks.portfolio",
    "Portfolio"
  ),
];