// services/socket.service.js
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const logger = require("../common/libs/logger");

require("../db/redis");
const redisEmitter = global.swaadSetuEmitter;

function initializeSocket(server) {
  const isProd = process.env.NODE_ENV === "production";

  const io = new Server(server, {
    cors: isProd
      ? {
          origin: ["https://www.swaadsetu.com", "https://user.swaadsetu.com"],
          credentials: true,
        }
      : {
          origin: "*",
          methods: ["GET", "POST"],
        },
  });

  // 🔴 PROD ONLY: Socket.IO Redis Adapter
  if (isProd && process.env.REDIS_URL) {
    (async () => {
      try {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        await pubClient.connect();
        await subClient.connect();

        io.adapter(createAdapter(pubClient, subClient));
        logger.info("✅ Socket.IO Redis adapter attached (PROD)");
      } catch (err) {
        logger.error("❌ Redis adapter failed, continuing without it", err);
      }
    })();
  }

  io.on("connection", (socket) => {
    const { rid, tableId } = socket.handshake.query;

    if (!rid) {
      socket.disconnect(true);
      return;
    }

    logger.info("Client connected", { socketId: socket.id, rid, tableId });

    socket.join(`restaurant:${rid}`);
    socket.join(`restaurant:${rid}:staff`);

    if (tableId) {
      socket.join(`restaurant:${rid}:tables:${tableId}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info("Client disconnected", { socketId: socket.id, reason });
    });
  });

  // 🟢 KEEP YOUR EXISTING REDIS EMITTER (LOCAL / DEV SAFE)
  if (redisEmitter && typeof redisEmitter.on === "function") {
    redisEmitter.onAny
      ? redisEmitter.onAny((channel, message) => {
          io.to(channel).emit(message.event, message.data);
        })
      : redisEmitter.on("event", (channel, message) => {
          io.to(channel).emit(message.event, message.data);
        });

    logger.info("📡 Redis → Socket bridge active");
  }

  return io;
}

module.exports = { initializeSocket };
