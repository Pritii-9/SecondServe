import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { Listing } from "../types/index";
import { useAuth } from "./AuthContext";

interface SocketContextState {
  socket: Socket | null;
  latestListing: Listing | null;
}

const SocketContext = createContext<SocketContextState | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

export function SocketProvider({ children }: SocketProviderProps) {
  const { token } = useAuth();
  const [latestListing, setLatestListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!token) {
      socket.disconnect();
      return;
    }

    socket.auth = { token };
    socket.connect();

    socket.on("new_listing", (listing: Listing) => {
      setLatestListing(listing);
    });

    socket.on("listing_updated", (listing: Listing) => {
      setLatestListing(listing);
    });

    return () => {
      socket.off("new_listing");
      socket.off("listing_updated");
      socket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket, latestListing }), [latestListing]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
