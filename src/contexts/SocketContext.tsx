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

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
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
