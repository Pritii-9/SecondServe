import dotenv from "dotenv";
import mongoose from "mongoose";
import { Router, type Request, type Response, type NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { ListingModel } from "../models/Listing.js";
import { analyzeListing } from "../services/groqService.js";
import { requireAuth } from "../middleware/auth.js";

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
        status: "available",
        sourceType: sourceType ?? "community",
        ...(placeName?.trim() ? { placeName: placeName.trim() } : {}),
        category: analysis.category,
        dietaryTags: analysis.dietaryTags,
        safetyAdvice: analysis.safetyAdvice,
      };

      const listing = await ListingModel.create(listingData as any);

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

      const listing = await ListingModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(idParam), status: "available" } as any,
        { status: "claimed", claimedBy: receiverId, claimedAt: new Date() },
        { new: true },
      ).lean();

      if (!listing) {
        return res.status(404).json({ message: "Listing not found or already claimed." });
      }

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

      const location = {
        type: "Point" as const,
        coordinates: [Number(lng), Number(lat)] as [number, number],
      };

      const filters: Record<string, unknown> = { status: "available" };
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

      return res.json({ listings });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
