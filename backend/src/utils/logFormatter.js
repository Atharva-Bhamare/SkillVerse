import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} | ${level.toUpperCase()} | ${message}`;
});

export const consoleFormat = combine(
  colorize(),
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  logFormat
);

export const fileFormat = combine(
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  logFormat
);