import mongoose, { Document, Model } from "mongoose";

export type ListingStatus = "available" | "claimed";

export interface ListingDocument extends Document {
  donorId: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  expiryTime: Date;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  status: ListingStatus;
  claimedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  sourceType: "restaurant" | "shop" | "community";
  placeName?: string;
  category: string;
  dietaryTags: string[];
  safetyAdvice: string;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new mongoose.Schema<ListingDocument>(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    expiryTime: { type: Date, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: { type: String, required: true, enum: ["available", "claimed"], default: "available" },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    claimedAt: { type: Date },
    sourceType: { type: String, required: true, enum: ["restaurant", "shop", "community"], default: "community" },
    placeName: { type: String, trim: true },
    category: { type: String, required: true, default: "unknown" },
    dietaryTags: { type: [String], required: true, default: [] },
    safetyAdvice: { type: String, required: true, default: "No safety advice available." },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

listingSchema.index({ location: "2dsphere" });

export const ListingModel: Model<ListingDocument> = mongoose.models.Listing || mongoose.model<ListingDocument>("Listing", listingSchema);
