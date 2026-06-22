export type UserRole = "donor" | "receiver";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface Place {
  id: string;
  name: string;
  category: string;
  type: "restaurant" | "shop" | "other";
  coordinates: [number, number];
  address?: string;
}

export interface Listing {
  _id: string;
  donorId: string | { _id: string; name: string; email: string };
  description: string;
  quantity: number;
  expiryTime: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  status: "available" | "claimed";
  claimedBy?: string | { _id: string; name: string; email: string };
  claimedAt?: string;
  rescueStatus?: "pending" | "en_route" | "completed" | "cancelled";
  sourceType: "restaurant" | "shop" | "community";
  placeName?: string;
  distanceKm?: number;
  category: string;
  dietaryTags: string[];
  safetyAdvice: string;
  pickupPin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ImpactStats {
  totalMeals: number;
  co2SavedKg: number;
}
