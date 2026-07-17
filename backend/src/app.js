import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import studentRoutes from "./routes/student.routes.js";

// Import future routes
// import authRoutes from "./routes/auth.routes.js";
// import companyRoutes from "./routes/company.routes.js";
// import jobRoutes from "./routes/job.routes.js";
// import applicationRoutes from "./routes/application.routes.js";

import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

/* =====================================================
   Security Middleware
===================================================== */

app.use(helmet());

/* =====================================================
   CORS
===================================================== */

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

/* =====================================================
   Logging
===================================================== */

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/* =====================================================
   Body Parsers
===================================================== */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/* =====================================================
   Health Check
===================================================== */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillVerse API is running.",
  });
});

/* =====================================================
   API Routes
===================================================== */

// app.use("/api/auth", authRoutes);

app.use("/api/student", studentRoutes);

// app.use("/api/company", companyRoutes);

// app.use("/api/jobs", jobRoutes);

// app.use("/api/applications", applicationRoutes);

/* =====================================================
   404 Handler
===================================================== */

app.use(notFound);

/* =====================================================
   Global Error Handler
===================================================== */

app.use(errorHandler);

export default app;