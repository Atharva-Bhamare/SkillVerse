import winston from "winston";

import config from "./env.js";
import { LOG_LEVELS } from "./constants.js";
import {
  consoleFormat,
  fileFormat,
} from "../utils/logFormatter.js";

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
      filename: "logs/combined.log",
      format: fileFormat,
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: LOG_LEVELS.ERROR,
      format: fileFormat,
    }),
  ],

  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
    }),
  ],
});

export default logger;