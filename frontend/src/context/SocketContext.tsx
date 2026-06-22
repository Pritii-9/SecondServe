import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { Listing } from "../types/index";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";

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
  const { token, user } = useAuth();
  const { addNotification, showToast } = useNotification();
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

      if (user) {
        const donorIdStr = typeof listing.donorId === "string" ? listing.donorId : listing.donorId?._id;
        const receiverIdStr = typeof listing.claimedBy === "string" ? listing.claimedBy : listing.claimedBy?._id;
        
        const isDonor = donorIdStr === user.id;
        const isReceiver = receiverIdStr === user.id;

        if (isDonor && listing.status === "claimed" && listing.rescueStatus === "pending") {
          addNotification(
            "Food Claimed!",
            `A receiver has claimed your listing: ${listing.description}. Please coordinate pickup.`,
            "action"
          );
          showToast("One of your listings was just claimed!", "success");
        } else if (isReceiver && listing.rescueStatus === "completed") {
          addNotification(
            "Pickup Verified!",
            `Your rescue for ${listing.description} was verified. Thank you!`,
            "action"
          );
          showToast("Pickup verified successfully!", "success");
        }
      }
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
