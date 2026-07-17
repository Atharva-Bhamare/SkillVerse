import fs from "fs-extra";

import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

export const uploadToCloudinary = async (
  filePath,
  folder
) => {
  try {
    const result = await cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: "auto",
      }
    );

    await fs.remove(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    await fs.remove(filePath);

    throw new AppError(
      "Failed to upload file.",
      500
    );
  }
};

export const deleteFromCloudinary = async (
  publicId
) => {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
};