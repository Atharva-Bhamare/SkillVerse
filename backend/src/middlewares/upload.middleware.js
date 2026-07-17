import multer from "multer";
import path from "path";
import fs from "fs-extra";

import { FILE_UPLOAD } from "../config/constants.js";

const TEMP_DIRECTORY = "temp";

// Ensure temp directory exists
fs.ensureDirSync(TEMP_DIRECTORY);

// Configure storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TEMP_DIRECTORY);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const extension = path.extname(file.originalname);

    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Generic uploader factory
const createUploader = ({ allowedMimeTypes, maxFileSize }) => {
  return multer({
    storage,

    limits: {
      fileSize: maxFileSize,
    },

    fileFilter(req, file, cb) {
      if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
      }

      return cb(
        new Error("Unsupported file type."),
        false
      );
    },
  });
};

// Image uploader
export const uploadImage = createUploader({
  allowedMimeTypes: FILE_UPLOAD.IMAGE_MIME_TYPES,
  maxFileSize: FILE_UPLOAD.IMAGE_MAX_SIZE,
});

// PDF / Document uploader
export const uploadDocument = createUploader({
  allowedMimeTypes: FILE_UPLOAD.DOCUMENT_MIME_TYPES,
  maxFileSize: FILE_UPLOAD.DOCUMENT_MAX_SIZE,
});

export default {
  uploadImage,
  uploadDocument,
};