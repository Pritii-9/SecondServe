import { useState, useEffect } from "react";
import type { Listing } from "../types/index";
import { api } from "../utils/api";
import { ListingCard } from "./ListingCard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { WorkspaceSettings } from "./WorkspaceSettings";
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

export function DonorDashboard() {
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
    <div className="space-y-10">
      <AnalyticsDashboard />
      
      <section className="rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/20 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 transition-colors duration-300">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
            <div className="relative rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 transition-colors duration-300">
              <PlusCircle className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Create Food Listing</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Rescue fresh food and make it available instantly.</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200">Food Description</label>
            <div className="relative mt-2">
              <FileText className="absolute left-4 top-4.5 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200" />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                rows={3}
                placeholder="What food items are you rescuing? e.g. 5 boxes of fresh cheese pizzas..."
              />
            </div>
            {errors.description && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.description}</span>
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200">Quantity (Servings / Items)</label>
              <div className="relative mt-2">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200" />
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>
              {errors.quantity && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.quantity}</span>
                </div>
              )}
            </div>

            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200">Best Before / Expiry Time</label>
              <div className="relative mt-2">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200" />
                <input
                  type="datetime-local"
                  value={expiryTime}
                  onChange={(event) => setExpiryTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              {errors.expiryTime && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.expiryTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-900 pt-5 transition-colors duration-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 transition-colors duration-300">Listing location coordinates</p>
              <button
                type="button"
                onClick={getLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-200 disabled:opacity-50"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600 dark:text-cyan-400" /> : <Navigation className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />}
                <span>{locating ? "Locating..." : "Use current location"}</span>
              </button>
            </div>
            <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
              <div className="group/lat">
                <label className="block text-xs text-slate-500 dark:text-slate-400 group-focus-within/lat:text-cyan-600 dark:group-focus-within/lat:text-cyan-400 transition-colors duration-200">Latitude</label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within/lat:text-cyan-600 dark:group-focus-within/lat:text-cyan-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-700"
                    placeholder="e.g. 18.5204"
                  />
                </div>
                {errors.latitude && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.latitude}</span>
                  </div>
                )}
              </div>
              <div className="group/lng">
                <label className="block text-xs text-slate-500 dark:text-slate-400 group-focus-within/lng:text-cyan-600 dark:group-focus-within/lng:text-cyan-400 transition-colors duration-200">Longitude</label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within/lng:text-cyan-600 dark:group-focus-within/lng:text-cyan-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-700"
                    placeholder="e.g. 73.8567"
                  />
                </div>
                {errors.longitude && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.longitude}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full items-center justify-center rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 px-6 py-4 text-sm font-bold tracking-wider uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 flex gap-2 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white dark:text-slate-950" />
                <span>Working...</span>
              </>
            ) : (
              <span>Post Food</span>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm border transition-all duration-300 ${
            message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("not")
              ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300"
              : message.toLowerCase().includes("fetching")
              ? "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-300 animate-pulse"
              : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-300"
          }`}>
            {message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("not") ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : message.toLowerCase().includes("fetching") ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}
      </section>

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
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 transition-colors duration-300">Use the form above to add your first food rescue listing.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
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

      {/* Enterprise RBAC Section */}
      <div className="pt-8">
        <WorkspaceSettings />
      </div>
    </div>
  );
}
