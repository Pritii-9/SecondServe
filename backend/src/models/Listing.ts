import mongoose, { Document, Model } from "mongoose";

export type ListingStatus = "draft" | "active" | "claimed" | "expired" | "cancelled";
export type RescueStatus = "pending" | "en_route" | "arrived" | "completed" | "issue_reported";

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
  rescueStatus?: RescueStatus;
  issueReason?: string;
  sourceType: "restaurant" | "shop" | "community";
  workspaceId?: mongoose.Types.ObjectId;
  placeName?: string;
  category: string;
  dietaryTags: string[];
  safetyAdvice: string;
  pickupPin?: string;
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
    status: { type: String, required: true, enum: ["draft", "active", "claimed", "expired", "cancelled"], default: "draft" },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    claimedAt: { type: Date },
    rescueStatus: { type: String, enum: ["pending", "en_route", "arrived", "completed", "issue_reported"] },
    issueReason: { type: String },
    sourceType: { type: String, required: true, enum: ["restaurant", "shop", "community"], default: "community" },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    placeName: { type: String, trim: true },
    category: { type: String, required: true, default: "unknown" },
    dietaryTags: { type: [String], required: true, default: [] },
    safetyAdvice: { type: String, required: true, default: "No safety advice available." },
    pickupPin: { type: String },
  },
  {
    timestamps: true,
    versionKey: "__v", // Enabled for Optimistic Concurrency Control
  },
);

listingSchema.index({ location: "2dsphere" });

export const ListingModel: Model<ListingDocument> = mongoose.models.Listing || mongoose.model<ListingDocument>("Listing", listingSchema);
