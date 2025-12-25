import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      const { rid, tableId } = this.socket.io.opts.query;
      if (rid && tableId) {
        const room = `restaurant:${rid}:tables:${tableId}`;
        this.socket.emit("join_room", room);
        console.log(`Joining room: ${room}`);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    this.socket.on("reconnect", () => {
      console.log("♻️ Socket reconnected:", this.socket.id);
      const { rid, tableId } = this.socket.io.opts.query;
      if (rid && tableId) {
        const room = `restaurant:${rid}:tables:${tableId}`;
        this.socket.emit("join_room", room);
        console.log(`Re-joining room: ${room}`);
      }
    });
  }

  connect(rid: string, tableId: string) {
    if (this.socket.connected) return;

    this.socket.io.opts.query = { rid, tableId };
    this.socket.connect();
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket.off(event, callback);
  }
}

const socketService = new SocketService();

export default socketService;
