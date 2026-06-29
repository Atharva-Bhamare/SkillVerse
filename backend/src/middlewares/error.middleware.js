import config from "../config/env.js";
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Log every error
  logger.error(`${statusCode} - ${message}`);

  // Hide internal details in production
  if (config.nodeEnv === "production" && !err.isOperational) {
    statusCode = 500;
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    status: err.status || "error",
    message,
    ...(config.nodeEnv === "development" && {
      stack: err.stack,
    }),
  });
};

export default errorHandler;