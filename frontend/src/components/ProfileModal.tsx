import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  X,
  User,
  Mail,
  Shield,
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [latitude, setLatitude] = useState(user?.location?.coordinates[1]?.toString() || "");
  const [longitude, setLongitude] = useState(user?.location?.coordinates[0]?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen || !user) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      setIsError(true);
      return;
    }

    setLocating(true);
    setMessage("Fetching current coordinates...");
    setIsError(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage("Coordinates fetched successfully.");
        setLocating(false);
      },
      () => {
        setMessage("Failed to retrieve device location.");
        setIsError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!name.trim()) {
      setMessage("Name cannot be empty.");
      setIsError(true);
      return;
    }

    if (!latitude || !longitude || Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      setMessage("Please enter valid location coordinates.");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const response = await api.put<{ user: any }>("/api/auth/profile", {
        name,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      });
      setUser(response.data.user);
      setMessage("Profile updated successfully!");
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1200);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update profile. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-slate-300/50 dark:shadow-slate-950/50 overflow-hidden transition-colors duration-300">
        {/* Header - Fixed */}
        <div className="relative p-6 pb-4 sm:p-8 sm:pb-5 border-b border-slate-200 dark:border-slate-800/50 shrink-0 transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Profile Settings</h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">Update your account credentials and rescue location.</p>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 pt-4 sm:p-8 sm:pt-5 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Email Address (Read-only)</label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 pl-11 pr-4 py-3 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none transition-colors duration-300"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Account Role (Read-only)</label>
              <div className="relative mt-2">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  disabled
                  value={user.role === "donor" ? "Donor" : "Receiver"}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 pl-11 pr-4 py-3 text-xs text-slate-500 dark:text-slate-400 capitalize cursor-not-allowed outline-none transition-colors duration-300"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200">Full Name</label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Primary Coordinates</p>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-colors duration-200 disabled:opacity-50"
                >
                  {locating ? <Loader2 className="h-3 w-3 animate-spin text-cyan-600 dark:text-cyan-400" /> : <Navigation className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />}
                  <span>Fetch Location</span>
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="group/lat">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 group-focus-within/lat:text-cyan-600 dark:group-focus-within/lat:text-cyan-400 transition-colors duration-200">Latitude</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-focus-within/lat:text-cyan-600 dark:group-focus-within/lat:text-cyan-400 transition-colors duration-200" />
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500"
                      placeholder="e.g. 18.5204"
                    />
                  </div>
                </div>
                <div className="group/lng">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 group-focus-within/lng:text-cyan-600 dark:group-focus-within/lng:text-cyan-400 transition-colors duration-200">Longitude</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-focus-within/lng:text-cyan-600 dark:group-focus-within/lng:text-cyan-400 transition-colors duration-200" />
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500"
                      placeholder="e.g. 73.8567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all duration-300 ${
                isError
                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                  : message.includes("Fetching")
                  ? "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 animate-pulse"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}>
                {isError ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : message.includes("Fetching") ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full items-center justify-center rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 py-3.5 text-sm font-bold tracking-wider uppercase transition-colors duration-200 flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin text-white dark:text-slate-950" />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
