import { useState, useEffect } from "react";
import type { Listing } from "../types/index";
import { api } from "../utils/api";
import { ListingCard } from "./ListingCard";
import { useSocket } from "../context/SocketContext";
import {
  Package,
  Loader2,
  Clock,
} from "lucide-react";

export function ReceiverDashboard() {
  const [myClaims, setMyClaims] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { latestListing } = useSocket();

  useEffect(() => {
    const fetchMyClaims = async () => {
      try {
        const response = await api.get<{ listings: Listing[] }>("/api/listings/my-claims");
        setMyClaims(response.data.listings);
      } catch (error) {
        console.error("Failed to load claims", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyClaims();
  }, []);

  useEffect(() => {
    if (!latestListing) return;
    setMyClaims((current) => {
      const existingIndex = current.findIndex((item) => item._id === latestListing._id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = latestListing;
        return next;
      }
      return current; // If it's a new listing, we didn't claim it yet, so don't add to my claims
    });
  }, [latestListing]);

  const handleUpdateRescueStatus = async (id: string, newStatus: string) => {
    try {
      await api.post(`/api/listings/${id}/rescue`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/20 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 transition-colors duration-300">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
             <div className="relative shrink-0">
               <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
               <div className="relative rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 transition-colors duration-300">
                 <Package className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
               </div>
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">My Rescues</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Track and manage your claimed food items.</p>
             </div>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors duration-300">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-cyan-600 dark:text-cyan-400" /> : <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
            {loading ? "Loading..." : `${myClaims.length} active claims`}
          </span>
        </div>
        
        {loading ? (
           <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500 dark:text-cyan-400" />
           </div>
        ) : myClaims.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-12 text-center text-slate-500 dark:text-slate-500 transition-colors duration-300">
            <Clock className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-700 mb-3 transition-colors duration-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-500 transition-colors duration-300">No active rescues</p>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 transition-colors duration-300">Switch to the map view to find and claim nearby food.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {myClaims.map((listing) => (
              <div key={listing._id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/5">
                <ListingCard 
                   listing={listing} 
                   canUpdateRescue={true} 
                   onUpdateRescueStatus={handleUpdateRescueStatus} 
                   isReceiverView={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
