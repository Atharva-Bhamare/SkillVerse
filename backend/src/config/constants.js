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

  IMAGE_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ],

  DOCUMENT_MIME_TYPES: [
    "application/pdf",
  ],
});

/* =====================================================
   Student Module
===================================================== */

export const STUDENT = Object.freeze({
  AVATAR_FOLDER: "students/avatars",

  ALLOWED_UPDATE_FIELDS: [
    "headline",
    "bio",
    "college",
    "degree",
    "specialization",
    "graduationYear",
    "cgpa",
    "socialLinks",
  ],
});