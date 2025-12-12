"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  userId: null,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io({
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"], // Fallback to polling for better compatibility
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      socketInstance.emit("join-game");
    });

    socketInstance.on("connected", (data: { userId: string }) => {
      console.log("Received user ID:", data.userId);
      setUserId(data.userId);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      // Request current game state after reconnection
      socketInstance.emit("request-state");
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("Failed to reconnect after all attempts");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, userId }}>
      {children}
    </SocketContext.Provider>
  );
}
