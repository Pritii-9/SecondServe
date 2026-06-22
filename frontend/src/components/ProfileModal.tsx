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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-900 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-xl font-bold text-white tracking-tight">Profile Settings</h3>
        <p className="mt-1 text-xs text-slate-400">Update your account credentials and rescue location.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address (Read-only)</label>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-650" />
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full rounded-2xl border border-slate-850 bg-slate-950/30 pl-11 pr-4 py-3 text-xs text-slate-450 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Account Role (Read-only)</label>
            <div className="relative mt-2">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-650" />
              <input
                type="text"
                disabled
                value={user.role === "donor" ? "Donor" : "Receiver"}
                className="w-full rounded-2xl border border-slate-850 bg-slate-950/30 pl-11 pr-4 py-3 text-xs text-slate-450 capitalize cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">Full Name</label>
            <div className="relative mt-2">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-655"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-855 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Primary Coordinates</p>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors duration-200 disabled:opacity-50"
              >
                {locating ? <Loader2 className="h-3 w-3 animate-spin text-cyan-400" /> : <Navigation className="h-3 w-3 text-cyan-400" />}
                <span>Fetch Location</span>
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="group/lat">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-focus-within/lat:text-cyan-400 transition-colors duration-200">Latitude</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 group-focus-within/lat:text-cyan-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-3 py-2 text-xs text-slate-100 outline-none transition focus:border-cyan-500"
                    placeholder="e.g. 18.5204"
                  />
                </div>
              </div>
              <div className="group/lng">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-focus-within/lng:text-cyan-400 transition-colors duration-200">Longitude</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 group-focus-within/lng:text-cyan-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-3 py-2 text-xs text-slate-100 outline-none transition focus:border-cyan-500"
                    placeholder="e.g. 73.8567"
                  />
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all duration-300 ${
              isError
                ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                : message.includes("Fetching")
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-355"
            }`}>
              {isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-450" />
              ) : message.includes("Fetching") ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-455" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-450" />
              )}
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full items-center justify-center rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-3.5 text-xs font-bold tracking-wider uppercase transition-colors duration-200 flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10 font-bold"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-950" />}
            <span>Save Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
}
