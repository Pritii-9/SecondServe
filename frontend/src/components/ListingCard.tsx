import { useState } from "react";
import type { Listing } from "../types/index";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ShieldAlert,
  Navigation,
  Check,
  Package,
  Activity,
  Compass,
} from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  canClaim?: boolean;
  canUpdateRescue?: boolean;
  isReceiverView?: boolean;
  isDonorView?: boolean;
  onClaim?: (id: string) => Promise<void>;
  onUpdateRescueStatus?: (id: string, newStatus: string) => Promise<void>;
  onVerifyPickup?: (id: string, pin: string) => Promise<void>;
}

export function ListingCard({ 
  listing, 
  canClaim, 
  canUpdateRescue, 
  isReceiverView, 
  isDonorView, 
  onClaim, 
  onUpdateRescueStatus,
  onVerifyPickup 
}: ListingCardProps) {
  const isAvailable = listing.status === "available";
  const [pinInput, setPinInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const formattedExpiry = new Date(listing.expiryTime).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-800 flex flex-col justify-between h-full gap-4">
      {/* Top Banner (Category & Date) */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 transition-colors duration-300">
              <Compass className="h-3.5 w-3.5" />
              {listing.category}
            </span>
            {listing.sourceType && (
              <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 transition-colors duration-300">
                {listing.sourceType}
              </span>
            )}
          </div>
          <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${isAvailable ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-amber-500"}`} />
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 transition-colors duration-300" title={listing.description}>
            {listing.description}
          </h3>
          {listing.placeName && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors duration-300">📍 {listing.placeName}</p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-350 transition-colors duration-300">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 px-3 py-2 transition-colors duration-300">
            <Package className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Qty</span>
              <span className="font-bold text-slate-900 dark:text-white transition-colors duration-300">{listing.quantity} Servings</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 px-3 py-2 transition-colors duration-300">
            <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Expires</span>
              <span className="font-bold text-slate-900 dark:text-white line-clamp-1 transition-colors duration-300">{formattedExpiry}</span>
            </div>
          </div>
        </div>

        {/* Dietary Tags */}
        {listing.dietaryTags && listing.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {listing.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 transition-colors duration-300"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Safety Advice Box */}
        {listing.safetyAdvice && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/10 bg-amber-50 dark:bg-amber-500/5 p-3.5 text-xs text-amber-700 dark:text-amber-300/90 flex gap-2.5 transition-colors duration-300">
            <ShieldAlert className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[10px] transition-colors duration-300">Safety Instruction</p>
              <p className="leading-relaxed text-amber-800 dark:text-slate-350 transition-colors duration-300">{listing.safetyAdvice}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section (Distance / Status / Claim button / Verification) */}
      <div className="space-y-3.5 pt-3 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
          {listing.distanceKm !== undefined ? (
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{listing.distanceKm.toFixed(1)} km away</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
              <span className="font-semibold text-slate-600 dark:text-slate-500"> Pune Region</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">
              {listing.status === "claimed" ? `Claimed (${listing.rescueStatus ?? "pending"})` : "Available"}
            </span>
          </div>
        </div>

        {canClaim && isAvailable && onClaim && (
          <button
            type="button"
            onClick={() => onClaim(listing._id)}
            className="w-full items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white dark:text-slate-950 transition-all duration-200 flex gap-1.5 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            Claim Rescue
          </button>
        )}

        {/* Receiver's PIN display */}
        {isReceiverView && listing.status === "claimed" && listing.pickupPin && listing.rescueStatus !== "completed" && (
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 p-3.5 text-center mt-2 transition-colors duration-300">
             <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 transition-colors duration-300">Pickup PIN</p>
             <p className="text-2xl font-black tracking-widest text-slate-900 dark:text-white mt-1 transition-colors duration-300">{listing.pickupPin}</p>
             <p className="text-[10px] text-slate-500 mt-1 transition-colors duration-300">Show this PIN to the donor when picking up food.</p>
          </div>
        )}

        {/* Donor's PIN input to verify */}
        {isDonorView && listing.status === "claimed" && listing.rescueStatus !== "completed" && onVerifyPickup && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-3.5 mt-2 transition-colors duration-300">
             <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 transition-colors duration-300">Verify Pickup</p>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={4}
                  placeholder="PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900 px-3 py-2 text-center text-sm font-bold tracking-widest text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors duration-300"
                />
                <button
                  type="button"
                  disabled={pinInput.length !== 4 || verifying}
                  onClick={async () => {
                     setVerifying(true);
                     await onVerifyPickup(listing._id, pinInput);
                     setVerifying(false);
                     setPinInput("");
                  }}
                  className="flex-1 items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-bold uppercase text-white dark:text-slate-950 transition-colors duration-300 disabled:opacity-50"
                >
                   {verifying ? "..." : "Verify PIN"}
                </button>
             </div>
          </div>
        )}

        {/* Receiver's ability to update status before completion */}
        {canUpdateRescue && listing.status === "claimed" && listing.rescueStatus !== "completed" && onUpdateRescueStatus && (
          <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 transition-colors duration-300 mt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rescue Status Tracker</label>
            <select
              value={listing.rescueStatus ?? "pending"}
              onChange={(e) => onUpdateRescueStatus(listing._id, e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-colors duration-250 cursor-pointer"
            >
              <option value="pending">⏳ Pending Departure</option>
              <option value="en_route">🚚 En Route</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        )}

        {/* Donor/Receiver view when completed */}
        {listing.rescueStatus === "completed" && (
           <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mt-2 transition-colors duration-300">
              ✅ Rescue Verified & Completed
           </div>
        )}
      </div>
    </div>
  );
}
