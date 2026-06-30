import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;