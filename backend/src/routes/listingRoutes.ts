import dotenv from "dotenv";
import mongoose from "mongoose";
import { Router, type Request, type Response, type NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { ListingModel } from "../models/Listing.js";
import { analyzeListing } from "../services/groqService.js";
import { sendClaimNotificationEmail, sendPickupVerifiedEmail } from "../services/mailService.js";
import { requireAuth } from "../middleware/auth.js";
import { getCache, setCache, invalidateCachePattern } from "../services/redisService.js";

dotenv.config();

export function listingRouter(io: SocketIOServer) {
  const router = Router();

  router.post("/", requireAuth(["donor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const donorId = req.authUser?.id;
      if (!donorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { description, quantity, expiryTime, location, sourceType, placeName } = req.body as {
        description: string;
        quantity: number;
        expiryTime: string;
        location: { type: "Point"; coordinates: [number, number] };
        sourceType?: "restaurant" | "shop" | "community";
        placeName?: string;
      };

      if (!description || !quantity || !expiryTime || !location) {
        return res.status(400).json({ message: "Missing listing fields." });
      }

      const analysis = await analyzeListing(description);
      const listingData = {
        donorId,
        description,
        quantity,
        expiryTime: new Date(expiryTime),
        location,
        status: "active",
        sourceType: sourceType ?? "community",
        ...(placeName?.trim() ? { placeName: placeName.trim() } : {}),
        category: analysis.category,
        dietaryTags: analysis.dietaryTags,
        safetyAdvice: analysis.safetyAdvice,
      };

      const listing = await ListingModel.create(listingData as any);

      // Invalidate the nearby cache so the new listing appears for everyone
      await invalidateCachePattern("nearby:*");

      io.emit("new_listing", listing);
      return res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/claim", requireAuth(["receiver"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!idParam) {
        return res.status(400).json({ message: "Listing id is required." });
      }

      const receiverId = req.authUser?.id;
      if (!receiverId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

      // Find the listing first to utilize Mongoose's built-in Optimistic Concurrency Control (__v)
      const listing = await ListingModel.findOne({ _id: new mongoose.Types.ObjectId(idParam), status: "active" });

      if (!listing) {
        return res.status(404).json({ message: "Listing not found or already claimed." });
      }

      listing.status = "claimed";
      listing.claimedBy = new mongoose.Types.ObjectId(receiverId);
      listing.claimedAt = new Date();
      listing.rescueStatus = "pending";
      listing.pickupPin = pickupPin;

      // When .save() is called, Mongoose checks the __v (versionKey). 
      // If another request saved this listing between findOne and save, a VersionError is thrown.
      await listing.save();
      await listing.populate("donorId", "name email");

      if (listing.donorId && typeof listing.donorId === "object" && 'email' in listing.donorId) {
         sendClaimNotificationEmail(
           (listing.donorId as any).email as string, 
           (listing.donorId as any).name as string, 
           req.authUser!.name || "A Receiver", 
           listing.description, 
           listing.quantity
         );
      }

      // Invalidate cache because status changed
      await invalidateCachePattern("nearby:*");

      io.emit("listing_updated", listing);
      return res.json(listing);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/rescue", requireAuth(["receiver"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!idParam) {
        return res.status(400).json({ message: "Listing id is required." });
      }

      const receiverId = req.authUser?.id;
      if (!receiverId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { status } = req.body as { status: string };
      if (!["pending", "en_route", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid rescue status." });
      }

      const listing = await ListingModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(idParam), claimedBy: receiverId } as any,
        { rescueStatus: status },
        { returnDocument: "after" },
      ).lean();

      if (!listing) {
        return res.status(404).json({ message: "Listing not found or you don't have permission." });
      }

      // Invalidate cache because status changed
      await invalidateCachePattern("nearby:*");

      io.emit("listing_updated", listing);
      return res.json(listing);
    } catch (error) {
      next(error);
    }
  });

  // State Machine Edge Case: Report Issue (e.g., car broke down, food spoiled)
  router.post("/:id/report-issue", requireAuth(["receiver"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const receiverId = req.authUser?.id;
      
      const { reason, action } = req.body as { reason: string; action: "cancel_claim" | "mark_spoiled" };
      if (!reason || !action) return res.status(400).json({ message: "Reason and action are required." });

      const listing = await ListingModel.findOne({ _id: new mongoose.Types.ObjectId(idParam), claimedBy: new mongoose.Types.ObjectId(receiverId) } as any);
      
      if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized." });
      
      if (action === "cancel_claim") {
        // Return to active pool
        listing.status = "active";
        listing.claimedBy = undefined as any;
        listing.claimedAt = undefined as any;
        listing.rescueStatus = undefined as any;
        listing.pickupPin = undefined as any;
      } else if (action === "mark_spoiled") {
        listing.status = "cancelled";
        listing.rescueStatus = "issue_reported";
        listing.issueReason = reason;
      }

      await listing.save();
      await invalidateCachePattern("nearby:*");
      io.emit("listing_updated", listing);
      
      return res.json(listing);
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) {
        return res.status(409).json({ message: "Concurrency conflict. Please try again." });
      }
      next(error);
    }
  });

  router.get("/my-listings", requireAuth(["donor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const donorId = req.authUser?.id;
      if (!donorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const listings = await ListingModel.find({ donorId }).populate("claimedBy", "name email").sort({ createdAt: -1 }).lean();
      return res.json({ listings });
    } catch (error) {
      next(error);
    }
  });

  router.get("/my-claims", requireAuth(["receiver"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiverId = req.authUser?.id;
      if (!receiverId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const listings = await ListingModel.find({ claimedBy: receiverId }).populate("donorId", "name email").sort({ claimedAt: -1 }).lean();
      return res.json({ listings });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/verify-pickup", requireAuth(["donor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!idParam) {
        return res.status(400).json({ message: "Listing id is required." });
      }

      const donorId = req.authUser?.id;
      if (!donorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { pin } = req.body as { pin: string };
      if (!pin) {
        return res.status(400).json({ message: "Pickup PIN is required." });
      }

      const listing = await ListingModel.findOne({ _id: new mongoose.Types.ObjectId(idParam), donorId } as any);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found or you don't have permission." });
      }

      if (listing.status !== "claimed") {
        return res.status(400).json({ message: "Listing is not claimed yet." });
      }

      if (listing.pickupPin !== pin) {
        return res.status(400).json({ message: "Invalid Pickup PIN." });
      }

      listing.rescueStatus = "completed";
      await listing.save();
      await listing.populate("claimedBy", "name email");

      if (listing.claimedBy && typeof listing.claimedBy === "object" && 'email' in listing.claimedBy) {
         sendPickupVerifiedEmail(
           (listing.claimedBy as any).email, 
           (listing.claimedBy as any).name, 
           req.authUser!.name || "The Donor", 
           listing.description
         );
      }

      // Invalidate cache because status changed
      await invalidateCachePattern("nearby:*");

      io.emit("listing_updated", listing);
      return res.json(listing);
    } catch (error) {
      next(error);
    }
  });

  router.get("/nearby", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, radiusKm = 10, query, sourceType } = req.query as {
        lat?: string;
        lng?: string;
        radiusKm?: string;
        query?: string;
        sourceType?: string;
      };
      if (!lat || !lng) {
        return res.status(400).json({ message: "lat and lng query parameters are required." });
      }

      const cacheKey = `nearby:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}:${radiusKm}:${query || "all"}:${sourceType || "all"}`;
      
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        console.log(`[Redis] Cache HIT for ${cacheKey}`);
        return res.json(cachedData);
      }
      console.log(`[Redis] Cache MISS for ${cacheKey}. Querying MongoDB...`);

      const location = {
        type: "Point" as const,
        coordinates: [Number(lng), Number(lat)] as [number, number],
      };

      const filters: Record<string, unknown> = { status: "active" };
      if (sourceType === "restaurant" || sourceType === "shop") {
        filters.sourceType = sourceType;
      }
      if (query) {
        filters.$or = [
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { placeName: { $regex: query, $options: "i" } },
        ];
      }

      const distanceMeters = Number(radiusKm) * 1000;
      const listings = await ListingModel.aggregate([
        {
          $geoNear: {
            near: location,
            distanceField: "distanceMeters",
            spherical: true,
            maxDistance: distanceMeters,
            query: filters,
          },
        },
        {
          $addFields: {
            distanceKm: { $divide: ["$distanceMeters", 1000] },
          },
        },
        {
          $project: {
            distanceMeters: 0,
          },
        },
      ]);

      await ListingModel.populate(listings, { path: "donorId", select: "name email" });

      const responseData = { listings };
      await setCache(cacheKey, responseData, 300); // Cache for 5 minutes

      return res.json(responseData);
    } catch (error) {
      next(error);
    }
  });

  router.get("/stats", requireAuth(["donor", "receiver"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.authUser?.id;
      const role = req.authUser?.role;

      if (!userId || !role) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const matchQuery = role === "donor" 
        ? { donorId: new mongoose.Types.ObjectId(userId), rescueStatus: "completed" } 
        : { claimedBy: new mongoose.Types.ObjectId(userId), rescueStatus: "completed" };

      const result = await ListingModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalMeals: { $sum: "$quantity" } } }
      ]);

      const totalMeals = result.length > 0 ? result[0].totalMeals : 0;
      const co2SavedKg = totalMeals * 2.5;

      return res.json({ totalMeals, co2SavedKg });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
