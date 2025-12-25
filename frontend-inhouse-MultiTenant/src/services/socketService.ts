import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket;

  constructor() {
    console.log(`[SocketService Inhouse] Initializing with SERVER_URL: ${SERVER_URL}`);
    this.socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      // Optional: Add a timeout to see if connection attempts are hanging
      timeout: 10000, // 10 seconds
    });

    this.socket.on("connect", () => {
      console.log("✅ [SocketService Inhouse] CONNECTED:", this.socket.id);
      const { rid } = this.socket.io.opts.query;
      console.log(`[SocketService Inhouse] Connected query params - RID: ${rid}`);
      if (rid) {
        const room = `restaurant:${rid}:staff`;
        this.socket.emit("join_room", room);
        console.log(`[SocketService Inhouse] Emitted 'join_room': ${room}`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ [SocketService Inhouse] DISCONNECTED:", reason);
      const { rid } = this.socket.io.opts.query;
      console.log(`[SocketService Inhouse] Disconnected query params - RID: ${rid}`);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`♻️ [SocketService Inhouse] RECONNECTED on attempt: ${attemptNumber}`);
      const { rid } = this.socket.io.opts.query;
      console.log(`[SocketService Inhouse] Reconnected query params - RID: ${rid}`);
      if (rid) {
        const room = `restaurant:${rid}:staff`;
        this.socket.emit("join_room", room);
        console.log(`[SocketService Inhouse] Re-emitted 'join_room': ${room}`);
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error(`❌ [SocketService Inhouse] CONNECTION ERROR: ${err.message}`, err);
      if (err.message === "xhr poll error") {
        console.error("[SocketService Inhouse] Common causes for XHR poll error: CORS, network issues, or server not reachable.");
      }
      console.error(`[SocketService Inhouse] Attempting to connect to: ${SERVER_URL}`);
      const { rid } = this.socket.io.opts.query;
      console.error(`[SocketService Inhouse] Query params - RID: ${rid}`);
    });

    this.socket.on("reconnect_error", (err) => {
      console.error(`❌ [SocketService Inhouse] RECONNECT ERROR: ${err.message}`, err);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ [SocketService Inhouse] RECONNECT FAILED: Max attempts reached or persistent error.");
    });
  }

  connect(rid: string, token: string) {
    if (this.socket.connected) {
      console.log(`[SocketService Inhouse] Socket already connected. RID: ${rid}`);
      return;
    }
    console.log(`[SocketService Inhouse] Attempting to connect with RID: ${rid}`);
    this.socket.io.opts.query = { rid };
    this.socket.io.opts.auth = { token };
    this.socket.connect();
  }

  disconnect() {
    if (this.socket.connected) {
      console.log("[SocketService Inhouse] Disconnecting socket.");
      this.socket.disconnect();
    } else {
      console.log("[SocketService Inhouse] Socket not connected, no need to disconnect.");
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    console.log(`[SocketService Inhouse] Registering listener for event: ${event}`);
    this.socket.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    console.log(`[SocketService Inhouse] De-registering listener for event: ${event}`);
    this.socket.off(event, callback);
  }
}

const socketService = new SocketService();

export default socketService;

