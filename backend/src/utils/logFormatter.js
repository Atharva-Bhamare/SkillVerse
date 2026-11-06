
import winston from "winston";

const {
  combine,
  timestamp,
  printf,
  colorize,
  errors,
  splat,
} = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} | ${level.toUpperCase()} | ${stack || message}`;
});

export const consoleFormat = combine(
  errors({ stack: true }),
  splat(),
  colorize(),
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  logFormat
);

export const fileFormat = combine(
  errors({ stack: true }),
  splat(),
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  logFormat
);
