
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

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

if (
  !process.env.MONGO_URI.startsWith("mongodb://") &&
  !process.env.MONGO_URI.startsWith("mongodb+srv://")
) {
  throw new Error(
    "MONGO_URI must start with mongodb:// or mongodb+srv://"
  );
}

try {
  new URL(process.env.CLIENT_URL);
} catch {
  throw new Error("CLIENT_URL must be a valid URL.");
}

const validEnvironments = [
  "development",
  "production",
  "test",
];

if (!validEnvironments.includes(process.env.NODE_ENV)) {
  throw new Error(
    "NODE_ENV must be development, production or test."
  );
}

const config = Object.freeze({
  port,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  clientUrl: process.env.CLIENT_URL,
  nodeEnv: process.env.NODE_ENV,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
});

export default config;
