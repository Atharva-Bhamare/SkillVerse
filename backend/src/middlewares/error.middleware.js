
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError.js";
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};

    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }

    error = new AppError("Validation failed.", 400, errors);
  }

  // Invalid MongoDB ObjectId or cast
  else if (err instanceof mongoose.Error.CastError) {
    error = new AppError(`Invalid ${err.path}.`, 400);
  }

  // Duplicate MongoDB key
  else if (err.code === 11000) {
    const field = err.keyValue
      ? Object.keys(err.keyValue)[0]
      : null;

    error = new AppError(
      "A resource with the provided value already exists.",
      409,
      field ? { [field]: `${field} already exists.` } : {}
    );
  }

  // JWT errors
  else if (err instanceof jwt.TokenExpiredError) {
    error = new AppError("Authentication token has expired.", 401);
  }

  else if (
    err instanceof jwt.JsonWebTokenError ||
    err instanceof jwt.NotBeforeError
  ) {
    error = new AppError("Invalid authentication token.", 401);
  }

  // File upload errors
  else if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File exceeds the maximum allowed size."
        : "Invalid file upload.";

    error = new AppError(message, 400);
  }

  // Unexpected errors
  else if (!(err instanceof AppError)) {
    logger.error("Unhandled server error", {
      message: err.message,
      stack: err.stack,
      method: req.method,
      path: req.originalUrl,
    });

    error = new AppError("Internal Server Error.", 500);
  }

  const isProduction = process.env.NODE_ENV === "production";

  const response = {
    success: false,
    message:
      isProduction && error.statusCode >= 500
        ? "Internal Server Error."
        : error.message,
  };

  if (error.errors && Object.keys(error.errors).length > 0) {
    response.errors = error.errors;
  }

  if (!isProduction) {
    response.stack = err.stack;
  }

  return res.status(error.statusCode || 500).json(response);
};

export default errorHandler;
