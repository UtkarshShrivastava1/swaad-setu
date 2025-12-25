// services/socket.service.js
const { Server } = require("socket.io");
const logger = require("../common/libs/logger");

// Ensure the global emitter is created by loading the redis module first.
require("../db/redis");

// Directly access the global emitter to guarantee a singleton instance,
// bypassing any potential module caching issues.
const redisEmitter = global.swaadSetuEmitter;

/**
 * Initialize Socket.IO and wire up Redis pub/sub bridge.
 * @param {http.Server} server - Node HTTP server instance
 * @returns {Server} io - Socket.IO server
 */
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const rid = socket.handshake.query.rid;
    const tableId = socket.handshake.query.tableId;

    if (!rid) {
      socket.disconnect(true);
      return;
    }

    logger.info("Client connected", { socketId: socket.id, rid, tableId });

    // Join a general room for the restaurant for broadcast events
    socket.join(`restaurant:${rid}`);

    // Join staff room for restaurant
    socket.join(`restaurant:${rid}:staff`);

    // Join table-specific room if provided
    if (tableId) {
      socket.join(`restaurant:${rid}:tables:${tableId}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info("Client disconnected", { socketId: socket.id, reason });
      socket.leave(`restaurant:${rid}`);
      socket.leave(`restaurant:${rid}:staff`);
      if (tableId) {
        socket.leave(`restaurant:${rid}:tables:${tableId}`);
      }
    });
  });

  // Wire up Redis → Socket.IO bridge if emitter exists
  if (redisEmitter && typeof redisEmitter.on === "function") {
    redisEmitter.onAny
      ? redisEmitter.onAny((channel, message) => {
          // in case emitter supports onAny (like ioredis)
          logger.info("Bridging event from Redis [onAny] to Socket.IO", { channel, event: message.event });
          io.to(channel).emit(message.event, message.data);
        })
      : redisEmitter.on("event", (channel, message) => {
          // fallback stub
          logger.info("Bridging event from Redis [on] to Socket.IO", { channel, event: message.event });
          io.to(channel).emit(message.event, message.data);
        });

    logger.info("📡 Socket service: Redis bridge connected");
  } else {
    logger.warn("⚠️  Socket service running without Redis bridge (dev-only)");
  }

  return io;
}

module.exports = { initializeSocket };

