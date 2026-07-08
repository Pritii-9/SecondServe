import mongoose, { Document, Model } from "mongoose";

export interface WorkspaceDocument extends Document {
  name: string;
  type: "restaurant" | "ngo" | "community";
  ownerId: mongoose.Types.ObjectId;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new mongoose.Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["restaurant", "ngo", "community"] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceSchema.index({ location: "2dsphere" });

export const WorkspaceModel: Model<WorkspaceDocument> = mongoose.models.Workspace || mongoose.model<WorkspaceDocument>("Workspace", workspaceSchema);
