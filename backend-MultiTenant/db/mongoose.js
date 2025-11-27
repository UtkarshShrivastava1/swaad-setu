// db/mongoose.js
const mongoose = require("mongoose");
const config = require("../config");
const logger = require("../common/libs/logger");

// Enable strictQuery for consistency
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // optional: tune pool size
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error("MongoDB connection error:", error.message || error);
    // Fail fast in dev; in prod you might retry instead
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from DB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("Mongoose disconnected on app termination");
  process.exit(0);
});

module.exports = {
  connectDB,
  mongoose,
};
