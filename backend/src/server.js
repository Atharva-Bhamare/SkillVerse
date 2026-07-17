import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

/* =====================================================
   Configuration
===================================================== */

const PORT = process.env.PORT || 5000;

/* =====================================================
   Bootstrap Server
===================================================== */

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    /* =====================================================
       Graceful Shutdown
    ===================================================== */

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down server...`);

      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    logger.error(`Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();