import "dotenv/config";
import config from "./config/env.js";

import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import logger from "./config/logger.js";

/* =====================================================
   Configuration
===================================================== */

const PORT = config.port;

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

      server.close(async (error) => {
        if (error) {
          logger.error(`HTTP server shutdown error: ${error.message}`);
          process.exitCode = 1;
        }

        try {
          await disconnectDB();
        } catch {
          process.exitCode = 1;
        }

        if (error) {
          logger.error("HTTP server did not close cleanly.");
        } else {
          logger.info("HTTP server closed.");
        }

        process.exit();
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