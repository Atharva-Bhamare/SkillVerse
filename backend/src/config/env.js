import "dotenv/config";

const requiredEnvVariables = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
  "NODE_ENV",

  // Cloudinary
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingVariables = [];

requiredEnvVariables.forEach((variable) => {
  if (!process.env[variable]?.trim()) {
    missingVariables.push(variable);
  }
});

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

// ----------------------------
// Format Validation
// ----------------------------

// PORT
if (isNaN(Number(process.env.PORT))) {
  throw new Error("PORT must be a valid number.");
}

// Mongo URI
if (
  !process.env.MONGO_URI.startsWith("mongodb://") &&
  !process.env.MONGO_URI.startsWith("mongodb+srv://")
) {
  throw new Error(
    "MONGO_URI must start with mongodb:// or mongodb+srv://"
  );
}

// CLIENT_URL
try {
  new URL(process.env.CLIENT_URL);
} catch {
  throw new Error("CLIENT_URL must be a valid URL.");
}

// NODE_ENV
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

// Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME.trim()) {
  throw new Error("CLOUDINARY_CLOUD_NAME cannot be empty.");
}

if (!process.env.CLOUDINARY_API_KEY.trim()) {
  throw new Error("CLOUDINARY_API_KEY cannot be empty.");
}

if (!process.env.CLOUDINARY_API_SECRET.trim()) {
  throw new Error("CLOUDINARY_API_SECRET cannot be empty.");
}

const config = Object.freeze({
  port: Number(process.env.PORT),

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN,

  clientUrl: process.env.CLIENT_URL,

  nodeEnv: process.env.NODE_ENV,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
});

export default config;