import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SkillVerse API",
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;