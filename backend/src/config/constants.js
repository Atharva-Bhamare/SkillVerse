
/* =====================================================
   User Roles
===================================================== */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  PLACEMENT_OFFICER: "placement_officer",
  STUDENT: "student",
});

/* =====================================================
   File Upload Configuration
===================================================== */

export const FILE_UPLOAD = Object.freeze({
  IMAGE_MAX_SIZE: 5 * 1024 * 1024,
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024,

  IMAGE_MIME_TYPES: Object.freeze([
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ]),

  DOCUMENT_MIME_TYPES: Object.freeze([
    "application/pdf",
  ]),
});

/* =====================================================
   Student Module
===================================================== */

export const STUDENT = Object.freeze({
  AVATAR_FOLDER: "students/avatars",

  ALLOWED_UPDATE_FIELDS: Object.freeze([
    "headline",
    "bio",
    "college",
    "degree",
    "specialization",
    "graduationYear",
    "cgpa",
    "socialLinks",
  ]),
});

/* =====================================================
   Logging
===================================================== */

export const LOG_LEVELS = Object.freeze({
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
});
