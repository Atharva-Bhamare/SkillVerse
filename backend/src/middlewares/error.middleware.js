import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  /* =====================================================
     Mongoose Validation Error
  ===================================================== */

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};

    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    error = new AppError(
      "Validation failed.",
      400,
      errors
    );
  }

  /* =====================================================
     Invalid MongoDB ObjectId
  ===================================================== */

  else if (err instanceof mongoose.Error.CastError) {
    error = new AppError(
      `Invalid ${err.path}.`,
      400
    );
  }

  /* =====================================================
     Duplicate Key Error
  ===================================================== */

  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    error = new AppError(
      "A resource with the provided value already exists.",
      409,
      {
        [field]: `${field} already exists.`,
      }
    );
  }

  /* =====================================================
     JWT Errors
  ===================================================== */

  else if (err instanceof jwt.TokenExpiredError) {
    error = new AppError(
      "Authentication token has expired.",
      401
    );
  }

  else if (err instanceof jwt.JsonWebTokenError) {
    error = new AppError(
      "Invalid authentication token.",
      401
    );
  }

  /* =====================================================
     Unknown Errors
  ===================================================== */

  else if (!(err instanceof AppError)) {
    error = new AppError(
      "Internal Server Error",
      500
    );
  }

  /* =====================================================
     Response
  ===================================================== */

  const response = {
    success: false,
    message: error.message,
  };

  if (Object.keys(error.errors).length > 0) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  return res.status(error.statusCode).json(response);
};

export default errorHandler;