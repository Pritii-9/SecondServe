import mongoose, { Document, Model } from "mongoose";

export type UserRole = "donor" | "receiver";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["donor", "receiver"] },
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ location: "2dsphere" });

export const UserModel: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
