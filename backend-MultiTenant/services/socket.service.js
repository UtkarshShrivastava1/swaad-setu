// services/socket.service.js
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const logger = require("../common/libs/logger");
const config = require("../config"); // Import config to access CORS origins

require("../db/redis"); // This ensures global.swaadSetuEmitter is set up
const redisEmitter = global.swaadSetuEmitter;

/**
 * Initialize Socket.IO and wire up Redis pub/sub bridge.
 * @param {http.Server} server - Node HTTP server instance
 * @returns {Server} io - Socket.IO server
 */
function initializeSocket(server) {
  logger.info("[SocketService] Initializing Socket.IO server.");
  const isProd = process.env.NODE_ENV === "production";
  const corsOrigins = isProd
    ? config.CORS_ALLOWED_ORIGINS // Assuming CORS_ALLOWED_ORIGINS is configured in config/index.js
    : "*";

  logger.info(`[SocketService] CORS Origin configured: ${JSON.stringify(corsOrigins)}`);

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true, // Important for cookies/auth headers
    },
    // Optional: add pingInterval and pingTimeout for more robust connection health checks
    pingInterval: 10000, // 10 seconds
    pingTimeout: 5000,   // 5 seconds
  });

  // 🔴 PROD ONLY: Socket.IO Redis Adapter
  if (isProd && process.env.REDIS_URL) {
    logger.info("[SocketService] Production environment with REDIS_URL found. Attempting to set up Redis adapter.");
    (async () => {
      try {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        pubClient.on("error", (err) => logger.error(`[SocketService] Redis Publisher Error: ${err.message}`));
        subClient.on("error", (err) => logger.error(`[SocketService] Redis Subscriber Error: ${err.message}`));

        await pubClient.connect();
        await subClient.connect();
        logger.info("[SocketService] Redis pub/sub clients connected successfully.");

        io.adapter(createAdapter(pubClient, subClient));
        logger.info("✅ [SocketService] Socket.IO Redis adapter attached (PROD)");
      } catch (err) {
        logger.error(`❌ [SocketService] Redis adapter failed to attach: ${err.message}`, err);
        logger.warn("[SocketService] Continuing without Redis adapter. This will limit scalability.");
      }
    })();
  } else if (isProd && !process.env.REDIS_URL) {
    logger.warn("[SocketService] Production environment detected, but REDIS_URL is NOT set. Socket.IO will NOT be scalable across multiple instances.");
  } else {
    logger.info("[SocketService] Development environment. Using in-memory adapter (no Redis adapter).");
  }


  io.on("connection", (socket) => {
    const { rid, tableId } = socket.handshake.query;

    logger.info(`[SocketService] Incoming connection from client: ${socket.id}`, { rid, tableId, ip: socket.handshake.address });

    if (!rid) {
      logger.warn(`[SocketService] Client ${socket.id} disconnected due to missing RID.`);
      socket.disconnect(true);
      return;
    }

    // Join a general room for the restaurant for broadcast events
    const restaurantRoom = `restaurant:${rid}`;
    socket.join(restaurantRoom);
    logger.info(`[SocketService] Client ${socket.id} joined room: ${restaurantRoom}`);

    // Join staff room for restaurant
    const staffRoom = `restaurant:${rid}:staff`;
    socket.join(staffRoom);
    logger.info(`[SocketService] Client ${socket.id} joined room: ${staffRoom}`);


    // Join table-specific room if provided
    if (tableId) {
      const tableRoom = `restaurant:${rid}:tables:${tableId}`;
      socket.join(tableRoom);
      logger.info(`[SocketService] Client ${socket.id} joined room: ${tableRoom}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info(`[SocketService] Client disconnected: ${socket.id}`, { reason, rid, tableId });
    });

    socket.on("error", (error) => {
      logger.error(`[SocketService] Socket error for client ${socket.id}: ${error.message}`, error);
    });
  });

  // 🟢 KEEP YOUR EXISTING REDIS EMITTER (LOCAL / DEV SAFE) - This bridges events from the local Redis stub to Socket.IO
  if (redisEmitter && typeof redisEmitter.on === "function") {
    logger.info("[SocketService] Local redisEmitter (in-memory stub) found. Setting up bridge to Socket.IO.");
    redisEmitter.onAny
      ? redisEmitter.onAny((channel, message) => {
          // in case emitter supports onAny (like ioredis)
          logger.info(`[SocketService] Bridging event from Redis emitter [onAny] to Socket.IO. Channel: ${channel}, Event: ${message.event}`);
          io.to(channel).emit(message.event, message.data);
        })
      : redisEmitter.on("event", (channel, message) => {
          // fallback stub
          logger.info(`[SocketService] Bridging event from Redis emitter [on] to Socket.IO. Channel: ${channel}, Event: ${message.event}`);
          io.to(channel).emit(message.event, message.data);
        });

    logger.info("📡 [SocketService] Redis emitter → Socket.IO bridge active.");
  } else {
    logger.warn("⚠️ [SocketService] Local redisEmitter (in-memory stub) NOT found or not an EventEmitter. Redis bridging will not occur in dev.");
  }

  return io;
}

module.exports = { initializeSocket };

