import type { Listing } from "../types/index";

interface ListingCardProps {
  listing: Listing;
  canClaim?: boolean;
  onClaim?: (id: string) => Promise<void>;
}

export function ListingCard({ listing, canClaim, onClaim }: ListingCardProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Listing</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{listing.description}</h3>
          <p className="mt-2 text-sm text-slate-400">Quantity: {listing.quantity} | Expires: {new Date(listing.expiryTime).toLocaleString()}</p>
        </div>
        <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">{listing.category}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {listing.dietaryTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-800"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="rounded-3xl border border-yellow-200/80 bg-yellow-50/80 p-4 text-sm text-slate-900">
        <p className="font-semibold text-yellow-800">Safety Advice</p>
        <p className="mt-1 leading-6">{listing.safetyAdvice}</p>
      </div>

      {listing.distanceKm !== undefined && (
        <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Distance</p>
          <p className="mt-2 text-base font-semibold text-white">{listing.distanceKm.toFixed(1)} km away</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
          <p className="mt-2 text-base font-semibold text-white">{listing.status}</p>
        </div>
        <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Location</p>
          <p className="mt-2 text-base text-white">
            {listing.location.coordinates[1].toFixed(4)}, {listing.location.coordinates[0].toFixed(4)}
          </p>
        </div>
      </div>

      {canClaim && listing.status === "available" && onClaim && (
        <button
          type="button"
          onClick={() => onClaim(listing._id)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Claim this listing
        </button>
      )}
    </div>
  );
}
