import cron from "node-cron";
import { ListingModel } from "../models/Listing.js";
import { sendExpirationEmail } from "./mailService.js";
import { Server as SocketIOServer } from "socket.io";

export function initCronJobs(io: SocketIOServer) {
  console.log("[Cron] Background task management initialized.");

  // 1. Expire listings that have passed their expiryTime
  // Runs every 1 minute for demonstration and testing purposes.
  cron.schedule("* * * * *", async () => {
    try {
      console.log("[Cron] Ticking... Checking for newly expired listings.");
      const now = new Date();
      
      const expiredListings = await ListingModel.find({
        status: "active",
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

  // 2. Data Lifecycle Cleanup: Delete listings that have been expired for more than 7 days
  // Runs at midnight every day
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[Cron] Running daily data lifecycle cleanup...");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await ListingModel.deleteMany({
        status: "expired",
        updatedAt: { $lt: sevenDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`[Cron] Data Cleanup: Deleted ${result.deletedCount} old expired listings.`);
      }
    } catch (error) {
      console.error("[Cron] Error during data lifecycle cleanup:", error);
    }
  });
}
