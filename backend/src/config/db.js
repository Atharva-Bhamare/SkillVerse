
import mongoose from "mongoose";
import config from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB connection closed.");
  } catch (error) {
    logger.error(`MongoDB Disconnection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
