// services/socket.service.js
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const logger = require("../common/libs/logger");
const config = require("../config");

// Ensure local redis emitter (dev/in-memory) is loaded
require("../db/redis");
const redisEmitter = global.swaadSetuEmitter;

/**
 * Initialize Socket.IO and wire up Redis pub/sub bridge.
 * @param {http.Server} server
 * @returns {Server}
 */
function initializeSocket(server) {
  const isProd = process.env.NODE_ENV === "production";

  // 🚫 NEVER use "*" with credentials
  const corsOrigins = isProd
    ? config.CORS_ALLOWED_ORIGINS
    : ["http://localhost:3000", "http://localhost:5173"];

  logger.info("[SocketService] Initializing Socket.IO", {
    isProd,
    corsOrigins,
  });

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // --------------------------------------------------
  // ✅ PROD ONLY: Socket.IO Redis Adapter
  // --------------------------------------------------
  if (isProd && process.env.REDIS_URL) {
    (async () => {
      try {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        pubClient.on("error", (err) =>
          logger.error("[SocketService] Redis pub error", err)
        );
        subClient.on("error", (err) =>
          logger.error("[SocketService] Redis sub error", err)
        );

        await pubClient.connect();
        await subClient.connect();

        io.adapter(createAdapter(pubClient, subClient));
        logger.info("✅ [SocketService] Redis adapter attached (PROD)");
      } catch (err) {
        logger.error("❌ [SocketService] Redis adapter failed", err);
        logger.warn("[SocketService] Continuing without Redis adapter");
      }
    })();
  }

  // --------------------------------------------------
  // 🔌 SOCKET CONNECTION HANDLER
  // --------------------------------------------------
  io.on("connection", (socket) => {
    // ✅ SUPPORT BOTH React (auth) AND legacy (query)
    const rid = socket.handshake.auth?.rid || socket.handshake.query?.rid;

    const tableId =
      socket.handshake.auth?.tableId || socket.handshake.query?.tableId;

    logger.info("[SocketService] Client connected", {
      socketId: socket.id,
      rid,
      tableId,
      ip: socket.handshake.address,
    });

    if (!rid) {
      logger.warn("[SocketService] Missing RID, disconnecting", {
        socketId: socket.id,
      });
      socket.disconnect(true);
      return;
    }

    // Restaurant-wide room
    socket.join(`restaurant:${rid}`);

    // Staff room
    socket.join(`restaurant:${rid}:staff`);

    // Table room (optional)
    if (tableId) {
      socket.join(`restaurant:${rid}:tables:${tableId}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info("[SocketService] Client disconnected", {
        socketId: socket.id,
        reason,
        rid,
        tableId,
      });
    });

    socket.on("error", (err) => {
      logger.error("[SocketService] Socket error", {
        socketId: socket.id,
        err,
      });
    });
  });

  // --------------------------------------------------
  // 🟢 DEV / LOCAL Redis-Emitter Bridge (unchanged)
  // --------------------------------------------------
  if (redisEmitter && typeof redisEmitter.on === "function") {
    redisEmitter.onAny
      ? redisEmitter.onAny((channel, message) => {
          io.to(channel).emit(message.event, message.data);
        })
      : redisEmitter.on("event", (channel, message) => {
          io.to(channel).emit(message.event, message.data);
        });

    logger.info("📡 [SocketService] Local Redis emitter bridge active");
  }

  return io;
}

module.exports = { initializeSocket };
