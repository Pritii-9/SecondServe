import { useEffect, useState } from "react";
import { Activity, Leaf } from "lucide-react";
import { api } from "../utils/api";
import type { ImpactStats as StatsType } from "../types/index";

export function ImpactStats() {
  const [stats, setStats] = useState<StatsType>({ totalMeals: 0, co2SavedKg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<{ totalMeals: number; co2SavedKg: number }>("/api/listings/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch impact stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="h-28 w-full animate-pulse rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 mb-8"></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 p-6 shadow-xl shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/10">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Meals Rescued</p>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalMeals}</p>
          </div>
          <div className="rounded-2xl bg-emerald-200/50 dark:bg-emerald-500/20 p-3 sm:p-4">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-cyan-200 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/40 dark:to-cyan-900/20 p-6 shadow-xl shadow-cyan-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-cyan-500/20 dark:bg-cyan-500/10 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">CO₂ Prevented</p>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.co2SavedKg.toFixed(1)} <span className="text-lg sm:text-xl font-bold text-slate-500 dark:text-slate-400">kg</span>
            </p>
          </div>
          <div className="rounded-2xl bg-cyan-200/50 dark:bg-cyan-500/20 p-3 sm:p-4">
            <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
