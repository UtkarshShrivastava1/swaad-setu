import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket;

  constructor() {
    console.log(
      `[SocketService User] Initializing with SERVER_URL: ${SERVER_URL}`
    );
    this.socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      // Optional: Add a timeout to see if connection attempts are hanging
      timeout: 10000, // 10 seconds
    });

    this.socket.on("connect", () => {
      console.log("✅ [SocketService User] CONNECTED:", this.socket.id);
      const { rid, tableId } = this.socket.io.opts.query;
      console.log(
        `[SocketService User] Connected query params - RID: ${rid}, TableID: ${tableId}`
      );
      if (rid && tableId) {
        const room = `restaurant:${rid}:tables:${tableId}`;
        this.socket.emit("join_room", room);
        console.log(`[SocketService User] Emitted 'join_room': ${room}`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ [SocketService User] DISCONNECTED:", reason);
      const { rid, tableId } = this.socket.io.opts.query;
      console.log(
        `[SocketService User] Disconnected query params - RID: ${rid}, TableID: ${tableId}`
      );
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(
        `♻️ [SocketService User] RECONNECTED on attempt: ${attemptNumber}`
      );
      const { rid, tableId } = this.socket.io.opts.query;
      console.log(
        `[SocketService User] Reconnected query params - RID: ${rid}, TableID: ${tableId}`
      );
      if (rid && tableId) {
        const room = `restaurant:${rid}:tables:${tableId}`;
        this.socket.emit("join_room", room);
        console.log(`[SocketService User] Re-emitted 'join_room': ${room}`);
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error(
        `❌ [SocketService User] CONNECTION ERROR: ${err.message}`,
        err
      );
      if (err.message === "xhr poll error") {
        console.error(
          "[SocketService User] Common causes for XHR poll error: CORS, network issues, or server not reachable."
        );
      }
      console.error(
        `[SocketService User] Attempting to connect to: ${SERVER_URL}`
      );
      const { rid, tableId } = this.socket.io.opts.query;
      console.error(
        `[SocketService User] Query params - RID: ${rid}, TableID: ${tableId}`
      );
    });

    this.socket.on("reconnect_error", (err) => {
      console.error(
        `❌ [SocketService User] RECONNECT ERROR: ${err.message}`,
        err
      );
    });

    this.socket.on("reconnect_failed", () => {
      console.error(
        "❌ [SocketService User] RECONNECT FAILED: Max attempts reached or persistent error."
      );
    });
  }

  connect(rid: string, tableId: string) {
    if (this.socket.connected) {
      console.log(
        `[SocketService User] Socket already connected. RID: ${rid}, TableID: ${tableId}`
      );
      return;
    }
    console.log(
      `[SocketService User] Attempting to connect with RID: ${rid}, TableID: ${tableId}`
    );
    this.socket.io.opts.query = { rid, tableId };
    this.socket.connect();
  }

  disconnect() {
    if (this.socket.connected) {
      console.log("[SocketService User] Disconnecting socket.");
      this.socket.disconnect();
    } else {
      console.log(
        "[SocketService User] Socket not connected, no need to disconnect."
      );
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    console.log(
      `[SocketService User] Registering listener for event: ${event}`
    );
    this.socket.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    console.log(
      `[SocketService User] De-registering listener for event: ${event}`
    );
    this.socket.off(event, callback);
  }
}

const socketService = new SocketService();

export default socketService;
