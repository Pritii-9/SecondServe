import cron from "node-cron";
import { ListingModel } from "../models/Listing.js";
import { sendExpirationEmail } from "./mailService.js";
import { Server as SocketIOServer } from "socket.io";

export function initCronJobs(io: SocketIOServer) {
  // Run every 1 minute for demonstration and testing purposes.
  // In a real enterprise app, this would typically run every 15-30 minutes.
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      
      const expiredListings = await ListingModel.find({
        status: "available",
        expiryTime: { $lt: now }
      }).populate("donorId", "name email");

      if (expiredListings.length === 0) return;

      console.log(`[Cron] Found ${expiredListings.length} expired listing(s). Processing...`);

      for (const listing of expiredListings) {
        listing.status = "expired";
        await listing.save();

        if (listing.donorId && typeof listing.donorId === "object" && 'email' in listing.donorId) {
          sendExpirationEmail(
            (listing.donorId as any).email,
            (listing.donorId as any).name,
            listing.description
          );
        }

        // Notify connected clients so the listing instantly disappears from the map
        io.emit("listing_updated", listing);
      }
    } catch (error) {
      console.error("[Cron] Error processing expired listings:", error);
    }
  });
}
