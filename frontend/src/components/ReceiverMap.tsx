import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../utils/api";
import type { Listing, Place } from "../types/index";
import { ListingCard } from "./ListingCard";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const defaultIcon = new Icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
    setCenter(place.coordinates);
    fetchNearby(place.coordinates[0], place.coordinates[1], radiusKm, place.name, filterType === "all" ? undefined : filterType);
    setMessage(`Showing listings around ${place.name}`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available in this browser.");
      return;
    }

    setMessage("Fetching current location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(coords);
        fetchNearby(coords[0], coords[1]);
        setMessage("Using device location.");
      },
      () => {
        setMessage("Unable to access device location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleUseAccountLocation = () => {
    if (!user?.location) {
      setMessage("No saved account location available.");
      return;
    }

    const coords: [number, number] = [user.location.coordinates[1], user.location.coordinates[0]];
    setCenter(coords);
    fetchNearby(coords[0], coords[1]);
    setMessage("Using saved account location.");
  };

  const handleClaim = async (listingId: string) => {
    try {
      const response = await api.post<Listing>(`/api/listings/${listingId}/claim`);
      setListings((current) => current.map((item) => (item._id === response.data._id ? response.data : item)));
      setMessage("Listing claimed successfully.");
    } catch (err) {
      setError("Unable to claim this listing. Please try again.");
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      if (user?.location) {
        const accountCoords: [number, number] = [user.location.coordinates[1], user.location.coordinates[0]];
        setCenter(accountCoords);
        fetchNearby(accountCoords[0], accountCoords[1]);
      } else {
        fetchNearby(center[0], center[1]);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(coords);
        fetchNearby(coords[0], coords[1]);
      },
      () => {
        if (user?.location) {
          const accountCoords: [number, number] = [user.location.coordinates[1], user.location.coordinates[0]];
          setCenter(accountCoords);
          fetchNearby(accountCoords[0], accountCoords[1]);
        } else {
          fetchNearby(center[0], center[1]);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
      <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/icons.svg" alt="SecondServe icon" className="h-12 w-12 rounded-2xl bg-slate-900 p-2 shadow-lg shadow-slate-950/30" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Nearby Rescue Listings</h2>
              <p className="mt-2 text-sm text-slate-400">Markers update in real time when new AI-enhanced listings become available.</p>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            {loading ? "Finding listings..." : `${listings.length} listings within ${radiusKm}km`}
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Search Pune restaurants or shops"
              />
              <button
                type="button"
                onClick={handleSearchPlaces}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Search places
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "restaurant", "shop"] as const).map((typeOption) => (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => {
                    setFilterType(typeOption);
                    if (searchText) fetchPlaces(searchText);
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${filterType === typeOption ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
                >
                  {typeOption === "all" ? "All" : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Use device location
              </button>
              <button
                type="button"
                onClick={handleUseAccountLocation}
                className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
              >
                Use saved account location
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-300">Radius</label>
              <select
                value={radiusKm}
                onChange={(event) => handleRadiusChange(Number(event.target.value))}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
          </div>
          {message && <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200">{message}</div>}
          {placeLoading ? (
            <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200">Loading Pune places…</div>
          ) : places.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {places.slice(0, 8).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                >
                  <p className="font-semibold text-white">{place.name}</p>
                  <p className="text-slate-400">{place.category}</p>
                  {place.address && <p className="text-slate-500">{place.address}</p>}
                </button>
              ))}
            </div>
          ) : searchText ? (
            <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200">No matching Pune places found.</div>
          ) : null}
        </div>

        {error && <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      </div>

      <div className="h-[520px] rounded-3xl border border-slate-700 bg-slate-900/80 shadow-xl shadow-slate-950/30">
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
            <Marker key={listing._id} position={[listing.location.coordinates[1], listing.location.coordinates[0]]} icon={defaultIcon}>
              <Popup>
                <ListingCard listing={listing} canClaim={listing.status === "available"} onClaim={handleClaim} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
