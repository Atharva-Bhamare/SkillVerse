
import multer from "multer";
import path from "path";
import fs from "fs-extra";

import { FILE_UPLOAD } from "../config/constants.js";
import AppError from "../utils/AppError.js";

const TEMP_DIRECTORY = path.resolve(process.cwd(), "temp");

fs.ensureDirSync(TEMP_DIRECTORY);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TEMP_DIRECTORY);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, uniqueSuffix);
  },
});

const hasValidSignature = async (filePath, kind) => {
  const buffer = await fs.readFile(filePath);
  
  if (kind === "image") {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return true; // JPEG
    }

    if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      )
    ) {
      return true; // PNG
    }

    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return true; // WebP
    }

    return false;
  }

  if (kind === "document") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  return false;
};

const createUploader = ({ allowedMimeTypes, maxFileSize }) =>
  multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: 1,
    },
    fileFilter(req, file, cb) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new AppError("Unsupported file type.", 400)
        );
      }

      cb(null, true);
    },
  });

const createSecureUpload = (options, fieldName, kind) => {
  const upload = createUploader(options).single(fieldName);

  return (req, res, next) => {
    upload(req, res, async (error) => {
      if (error) {
        if (req.file?.path) {
          await fs.remove(req.file.path).catch(() => {});
        }

        if (error instanceof multer.MulterError) {
          const message =
            error.code === "LIMIT_FILE_SIZE"
              ? "File exceeds the maximum allowed size."
              : "Invalid file upload.";

          return next(new AppError(message, 400));
        }

        return next(
          error instanceof AppError
            ? error
            : new AppError("File upload failed.", 400)
        );
      }

      if (!req.file) {
        return next();
      }

      try {
        const valid = await hasValidSignature(
          req.file.path,
          kind
        );

        if (!valid) {
          await fs.remove(req.file.path);
          return next(
            new AppError(
              "File contents do not match an allowed file type.",
              400
            )
          );
        }

        next();
      } catch {
        if (req.file?.path) {
          await fs.remove(req.file.path).catch(() => {});
        }

        next(new AppError("Unable to validate uploaded file.", 400));
      }
    });
  };
};

export const uploadImage = createSecureUpload(
  {
    allowedMimeTypes: FILE_UPLOAD.IMAGE_MIME_TYPES,
    maxFileSize: FILE_UPLOAD.IMAGE_MAX_SIZE,
  },
  "avatar",
  "image"
);

export const uploadDocument = createSecureUpload(
  {
    allowedMimeTypes: FILE_UPLOAD.DOCUMENT_MIME_TYPES,
    maxFileSize: FILE_UPLOAD.DOCUMENT_MAX_SIZE,
  },
  "document",
  "document"
);

export default {
  uploadImage,
  uploadDocument,
};
