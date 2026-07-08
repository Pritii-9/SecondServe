import { useState, useEffect } from "react";
import type { Listing } from "../types/index";
import { api } from "../utils/api";
import { ListingCard } from "./ListingCard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { useSocket } from "../context/SocketContext";
import {
  Loader2,
  Navigation,
  PlusCircle,
  Calendar,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface DonorDashboardProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function DonorDashboard({ isModalOpen, setIsModalOpen }: DonorDashboardProps) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expiryTime, setExpiryTime] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const { latestListing } = useSocket();

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const response = await api.get<{ listings: Listing[] }>("/api/listings/my-listings");
        setMyListings(response.data.listings);
      } catch (error) {
        console.error("Failed to load listings", error);
      }
    };
    fetchMyListings();
  }, []);

  useEffect(() => {
    if (!latestListing) return;
    setMyListings((current) => {
      const existingIndex = current.findIndex((item) => item._id === latestListing._id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = latestListing;
        return next;
      }
      return [latestListing, ...current];
    });
  }, [latestListing]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (quantity < 1) nextErrors.quantity = "Quantity must be at least 1.";
    if (!expiryTime) nextErrors.expiryTime = "Expiry time is required.";
    if (!latitude || Number.isNaN(Number(latitude))) nextErrors.latitude = "Valid latitude is required.";
    if (!longitude || Number.isNaN(Number(longitude))) nextErrors.longitude = "Valid longitude is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available in this browser.");
      return;
    }

    setLocating(true);
    setMessage("Fetching current location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage("Location captured successfully.");
        setLocating(false);
      },
      () => {
        setMessage("Unable to access your location. Please enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      await api.post<Listing>("/api/listings", {
        description,
        quantity,
        expiryTime,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)] as [number, number],
        },
      });

      setMessage("Food listing posted successfully!");
      setDescription("");
      setQuantity(1);
      setExpiryTime("");
      setLatitude("");
      setLongitude("");
      setErrors({});
      setTimeout(() => setIsModalOpen(false), 1500); // Close modal on success
    } catch (error) {
      setMessage("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPickup = async (id: string, pin: string) => {
    try {
      await api.post(`/api/listings/${id}/verify-pickup`, { pin });
      setMessage("Rescue verified and completed successfully!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to verify PIN. Please try again.";
      setMessage(errorMsg);
    }
  };

  return (
    <div className="space-y-10 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
      </div>

      <AnalyticsDashboard />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
            <div className="mb-8 flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
                <div className="relative rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
                  <PlusCircle className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Post Food Rescue</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Provide details to instantly alert nearby volunteers.</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Food Description</label>
                <div className="relative mt-2">
                  <FileText className="absolute left-4 top-4.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    rows={3}
                    placeholder="e.g. 5 boxes of fresh cheese pizzas..."
                  />
                </div>
                {errors.description && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-500"><AlertCircle className="h-4 w-4" />{errors.description}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quantity (Servings)</label>
                  <div className="relative mt-2">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expiry Time</label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="datetime-local" value={expiryTime} onChange={(event) => setExpiryTime(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  {errors.expiryTime && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-500"><AlertCircle className="h-4 w-4" />{errors.expiryTime}</p>}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pickup Location</p>
                  <button
                    type="button" onClick={getLocation} disabled={locating}
                    className="inline-flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors duration-200 disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin text-cyan-500" /> : <Navigation className="h-4 w-4 text-cyan-500 animate-pulse" />}
                    <span>{latitude ? "Location Captured ✓" : "Use current location"}</span>
                  </button>
                </div>
                {(!latitude || !longitude) && (
                  <p className="text-xs text-amber-500 mt-2">Click "Use current location" to automatically set coordinates.</p>
                )}
                {errors.latitude && <p className="mt-2 text-xs text-rose-500">Location is required.</p>}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                <span>{loading ? "Posting..." : "Confirm & Post Food"}</span>
              </button>
            </form>
            
            {message && (
              <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 dark:border-slate-900 pt-8 transition-colors duration-300">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Your Active Listings</h3>
          <span className="rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors duration-300">
            {myListings.length} posted
          </span>
        </div>
        
        {myListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-12 text-center text-slate-500 dark:text-slate-500 transition-colors duration-300">
            <Package className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-700 mb-3 transition-colors duration-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-500 transition-colors duration-300">No food posted yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 transition-colors duration-300">Click the button above to add your first food rescue listing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((listing) => (
              <div key={listing._id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/5">
                <ListingCard 
                  listing={listing} 
                  isDonorView={true}
                  onVerifyPickup={handleVerifyPickup}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
