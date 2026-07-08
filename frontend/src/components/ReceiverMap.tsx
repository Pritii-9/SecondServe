import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../utils/api";
import type { Listing, Place } from "../types/index";
import { ListingCard } from "./ListingCard";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  MapPin,
  Compass,
  Navigation,
  Loader2,
  Store,
  Utensils,
  AlertCircle,
} from "lucide-react";

const availableIcon = divIcon({
  className: "custom-leaflet-marker-available",
  html: `
    <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
      <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-cyan-400 opacity-40"></span>
      <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 border-2 border-slate-950 shadow-lg shadow-cyan-500/20 text-slate-950">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const claimedIcon = divIcon({
  className: "custom-leaflet-marker-claimed",
  html: `
    <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
      <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-950 shadow-md text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export function ReceiverMap() {
  const { user } = useAuth();
  const [center, setCenter] = useState<[number, number]>(
    user?.location?.coordinates
      ? [user.location.coordinates[1], user.location.coordinates[0]]
      : [18.5204, 73.8567],
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "restaurant" | "shop">("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(true);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { latestListing } = useSocket();

  const mapKey = useMemo(() => `${center[0]}-${center[1]}`, [center]);

  const fetchNearby = async (
    latitude: number,
    longitude: number,
    radius = radiusKm,
    query?: string,
    sourceType?: "restaurant" | "shop",
  ) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const params: Record<string, unknown> = {
        lat: latitude,
        lng: longitude,
        radiusKm: radius,
      };
      if (query) params.query = query;
      if (sourceType) params.sourceType = sourceType;

      const response = await api.get<{ listings: Listing[] }>("/api/listings/nearby", {
        params,
      });
      setListings(response.data.listings);
    } catch (err) {
      setError("Unable to load nearby listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    fetchNearby(center[0], center[1], newRadius, searchText || selectedPlace?.name, filterType === "all" ? undefined : filterType);
  };

  const fetchPlaces = async (query?: string) => {
    setPlaceLoading(true);
    setError(null);
    setMessage(null);

    try {
      const params: Record<string, unknown> = {};
      if (query) params.q = query;
      const response = await api.get<{ places: Place[] }>("/api/places/pune", { params });
      let results = response.data.places;
      if (filterType !== "all") {
        results = results.filter((place) => place.type === filterType);
      }
      setPlaces(results);
    } catch (err) {
      setError("Unable to load Pune places. Please try again.");
    } finally {
      setPlaceLoading(false);
    }
  };

  const handleSearchPlaces = () => {
    fetchPlaces(searchText);
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setCenter([place.coordinates[1], place.coordinates[0]]);
    fetchNearby(place.coordinates[1], place.coordinates[0], radiusKm, place.name, filterType === "all" ? undefined : filterType);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        fetchNearby(latitude, longitude, radiusKm, undefined, filterType === "all" ? undefined : filterType);
        setSelectedPlace(null);
        setLocating(false);
      },
      () => {
        setError("Unable to retrieve device location.");
        setLocating(false);
      },
    );
  };

  const handleUseAccountLocation = () => {
    if (user?.location?.coordinates) {
      const lat = user.location.coordinates[1];
      const lng = user.location.coordinates[0];
      setCenter([lat, lng]);
      fetchNearby(lat, lng, radiusKm, undefined, filterType === "all" ? undefined : filterType);
      setSelectedPlace(null);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      await api.post(`/api/listings/${id}/claim`);
      setMessage("Rescue claimed successfully!");
      fetchNearby(center[0], center[1], radiusKm, searchText || selectedPlace?.name, filterType === "all" ? undefined : filterType);
    } catch (err) {
      setError("Failed to claim rescue. Please try again.");
    }
  };

  const handleUpdateRescueStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/api/listings/${id}/rescue-status`, { rescueStatus: newStatus });
      setMessage(`Rescue status updated to: ${newStatus}`);
      fetchNearby(center[0], center[1], radiusKm, searchText || selectedPlace?.name, filterType === "all" ? undefined : filterType);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    }
  };

  useEffect(() => {
    fetchNearby(center[0], center[1], radiusKm);
  }, []);

  useEffect(() => {
    if (!latestListing) return;
    setListings((current) => {
      const existingIndex = current.findIndex((item) => item._id === latestListing._id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = latestListing;
        return next;
      }
      return [latestListing, ...current];
    });
  }, [latestListing]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/20 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 transition-colors duration-300">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
              <div className="relative rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 transition-colors duration-300">
                <Compass className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Nearby Rescue Listings</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Markers update in real time when new listings appear.</p>
            </div>
          </div>
          <div className="self-start sm:self-auto rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors duration-300">
            {loading && <Loader2 className="h-3 w-3 animate-spin text-cyan-600 dark:text-cyan-400" />}
            <span>{loading ? "Refreshing..." : `${listings.length} Listings Found`}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200" />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Search Pune restaurants, hotels, or cafes..."
              />
            </div>
            <button
              type="button"
              onClick={handleSearchPlaces}
              className="rounded-2xl bg-cyan-500 px-6 py-3.5 text-sm font-bold tracking-wider uppercase text-white dark:text-slate-950 hover:bg-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10 shrink-0"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
            <div className="flex flex-wrap gap-2">
              {(["all", "restaurant", "shop"] as const).map((typeOption) => (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => {
                    setFilterType(typeOption);
                    if (searchText) fetchPlaces(searchText);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    filterType === typeOption
                      ? "bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20 dark:shadow-cyan-500/5"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {typeOption}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-200 disabled:opacity-50"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600 dark:text-cyan-400" /> : <Navigation className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                <span>{locating ? "Locating..." : "Use device location"}</span>
              </button>
              <button
                type="button"
                onClick={handleUseAccountLocation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-200"
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Account Location</span>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-1 transition-colors duration-300">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Radius</label>
              <select
                value={radiusKm}
                onChange={(event) => handleRadiusChange(Number(event.target.value))}
                className="bg-transparent text-xs font-semibold text-cyan-600 dark:text-cyan-400 outline-none cursor-pointer py-1 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/15 bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2 transition-colors duration-300">
              <MapPin className="h-4 w-4 text-emerald-500 dark:text-emerald-450" />
              <span>{message}</span>
            </div>
          )}

          {placeLoading ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-4 py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 transition-colors duration-300">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
              <span>Searching local Pune registry...</span>
            </div>
          ) : places.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {places.slice(0, 8).map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const PlaceIcon = place.type === "restaurant" ? Utensils : Store;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 flex items-start gap-3.5 ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/5 shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/5"
                        : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    <div className={`rounded-xl p-2.5 transition-colors duration-200 shrink-0 ${
                      isSelected ? "bg-cyan-500 text-white dark:text-slate-950" : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      <PlaceIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white leading-tight truncate transition-colors duration-300">{place.name}</p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 capitalize font-semibold mt-1 transition-colors duration-300">{place.category}</p>
                      {place.address && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate transition-colors duration-300">{place.address}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchText ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-xs text-slate-500 transition-colors duration-300">
              No matching Pune locations found. Try searching "FC Road", "Kalyani Nagar", or "Viman Nagar".
            </div>
          ) : null}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-500/15 bg-rose-50 dark:bg-rose-500/5 px-4 py-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2 transition-colors duration-300">
            <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="h-[520px] rounded-3xl border border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-900/10 shadow-xl overflow-hidden relative transition-colors duration-300">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full rounded-3xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {listings.map((listing) => (
            <Marker
              key={listing._id}
              position={[listing.location.coordinates[1], listing.location.coordinates[0]]}
              icon={listing.status === "active" ? availableIcon : claimedIcon}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-[300px] sm:w-[320px] -mx-4 -my-3">
                  <ListingCard
                    listing={listing}
                    canClaim={listing.status === "active"}
                    onClaim={handleClaim}
                    canUpdateRescue={listing.claimedBy === user?.id}
                    onUpdateRescueStatus={handleUpdateRescueStatus}
                  />
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
