
import fs from "fs";
import path from "path";
import winston from "winston";

import config from "./env.js";
import { LOG_LEVELS } from "./constants.js";

import {
  consoleFormat,
  fileFormat,
} from "../utils/logFormatter.js";

// Ensure the logs directory exists.
const logsDirectory = path.resolve("logs");

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

const exceptionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level:
    config.nodeEnv === "development"
      ? LOG_LEVELS.DEBUG
      : LOG_LEVELS.INFO,

  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),

    new winston.transports.File({
      filename: path.join(logsDirectory, "combined.log"),
      format: fileFormat,
    }),

    new winston.transports.File({
      filename: path.join(logsDirectory, "error.log"),
      level: LOG_LEVELS.ERROR,
      format: fileFormat,
    }),
  ],

  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDirectory, "exceptions.log"),
      format: exceptionFormat,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDirectory, "rejections.log"),
      format: exceptionFormat,
    }),
  ],

  exitOnError: false,
});

export default logger;
