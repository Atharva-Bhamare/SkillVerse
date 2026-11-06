
import config from "./config/env.js";

import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import logger from "./config/logger.js";

/* =====================================================
   Configuration
===================================================== */

const PORT = config.port;

let server;
let isShuttingDown = false;

/* =====================================================
   Graceful Shutdown
===================================================== */

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} received. Shutting down server...`);

  const closeDatabase = async () => {
    try {
      await disconnectDB();
      logger.info("Database disconnected successfully.");
    } catch (error) {
      logger.error(`Database shutdown error: ${error.message}`);
      process.exitCode = 1;
    }
  };

  if (!server || !server.listening) {
    closeDatabase().finally(() => {
      logger.info("Application shutdown complete.");
    });

    return;
  }

  server.close(async (error) => {
    if (error) {
      logger.error(`HTTP server shutdown error: ${error.message}`);
      process.exitCode = 1;
    } else {
      logger.info("HTTP server closed.");
    }

    await closeDatabase();

    logger.info("Application shutdown complete.");
  });

  // Force shutdown if connections do not close in time.
  const forceShutdown = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing shutdown.");

    server.closeAllConnections?.();
    process.exit(1);
  }, 15000);

  forceShutdown.unref();
};

/* =====================================================
   Bootstrap Server
===================================================== */

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT);

    server.on("listening", () => {
      logger.info(`SkillVerse server running on port ${PORT}.`);
    });

    server.on("error", async (error) => {
      logger.error(`HTTP Server Error: ${error.message}`);

      process.exitCode = 1;

      if (!isShuttingDown) {
        isShuttingDown = true;
        await disconnectDB().catch((dbError) => {
          logger.error(
            `Database cleanup error: ${dbError.message}`
          );
        });
      }
    });

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Promise Rejection:", reason);

      shutdown("unhandledRejection");
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);

      process.exit(1);
    });
  } catch (error) {
    logger.error(`Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
