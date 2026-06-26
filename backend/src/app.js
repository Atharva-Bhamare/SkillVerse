import express from "express";
import cors from "cors";

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

export default app;