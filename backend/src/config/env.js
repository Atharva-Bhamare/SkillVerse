
import "dotenv/config";

const requiredEnvVariables = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
  "NODE_ENV",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingVariables = requiredEnvVariables.filter(
  (variable) => !process.env[variable]?.trim()
);

if (missingVariables.length > 0) {
  console.error("\n======================================");
  console.error(" SkillVerse Configuration Error");
  console.error("======================================");
  console.error("Missing environment variables:\n");

  missingVariables.forEach((variable) => {
    console.error(`• ${variable}`);
  });

  console.error("\nApplication startup aborted.");
  console.error("======================================\n");

  process.exit(1);
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const mongoUri = process.env.MONGO_URI.trim();

if (
  !mongoUri.startsWith("mongodb://") &&
  !mongoUri.startsWith("mongodb+srv://")
) {
  throw new Error(
    "MONGO_URI must start with mongodb:// or mongodb+srv://."
  );
}

let clientUrl;

try {
  clientUrl = new URL(process.env.CLIENT_URL.trim());

  if (!["http:", "https:"].includes(clientUrl.protocol)) {
    throw new Error();
  }
} catch {
  throw new Error("CLIENT_URL must be a valid HTTP or HTTPS URL.");
}

const validEnvironments = ["development", "production", "test"];
const nodeEnv = process.env.NODE_ENV.trim();

if (!validEnvironments.includes(nodeEnv)) {
  throw new Error(
    "NODE_ENV must be development, production or test."
  );
}

const jwtSecret = process.env.JWT_SECRET.trim();
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET.trim();

if (jwtSecret.length < 32 || jwtRefreshSecret.length < 32) {
  throw new Error("JWT secrets must contain at least 32 characters.");
}

if (jwtSecret === jwtRefreshSecret) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different.");
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN.trim();

// Accept common jsonwebtoken duration formats.
if (!/^\d+(\s?(s|m|h|d|w|y))?$/.test(jwtExpiresIn)) {
  throw new Error(
    "JWT_EXPIRES_IN must be a valid duration, e.g. 15m, 1h or 7d."
  );
}

const config = Object.freeze({
  port,
  mongoUri,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn,
  clientUrl: clientUrl.origin,
  nodeEnv,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME.trim(),
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY.trim(),
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET.trim(),
});

export default config;
