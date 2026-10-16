
import fs from "fs-extra";

import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";
import logger from "../config/logger.js";

export const uploadToCloudinary = async (filePath, folder) => {
  try {
    if (!(await fs.pathExists(filePath))) {
      throw new AppError("Uploaded file not found.", 400);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Cloudinary upload failed: ${error.message}`);

    throw new AppError("Failed to upload file.", 500);
  } finally {
    try {
      await fs.remove(filePath);
    } catch (error) {
      logger.error(`Temporary file cleanup failed: ${error.message}`);
    }
  }
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
};
