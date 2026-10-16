
import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
