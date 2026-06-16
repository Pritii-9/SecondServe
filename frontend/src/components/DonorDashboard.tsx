import { useState } from "react";
import type { Listing } from "../types/index";
import { api } from "../utils/api";

export function DonorDashboard() {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expiryTime, setExpiryTime] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post<Listing>("/api/listings", {
        description,
        quantity,
        expiryTime,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)] as [number, number],
        },
      });

      setMessage(`Listing created: ${response.data._id}`);
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

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-700 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/40 ring-1 ring-slate-700">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Donor Dashboard</h2>
        <p className="mt-2 text-slate-300">Post rescued food and let receivers claim it.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-200">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            rows={4}
          />
          {errors.description && <p className="mt-2 text-sm text-rose-400">{errors.description}</p>}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
            {errors.quantity && <p className="mt-2 text-sm text-rose-400">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Expiry Time</label>
            <input
              type="datetime-local"
              value={expiryTime}
              onChange={(event) => setExpiryTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
            {errors.expiryTime && <p className="mt-2 text-sm text-rose-400">{errors.expiryTime}</p>}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g. 37.7749"
            />
            {errors.latitude && <p className="mt-2 text-sm text-rose-400">{errors.latitude}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g. -122.4194"
            />
            {errors.longitude && <p className="mt-2 text-sm text-rose-400">{errors.longitude}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="mr-3 inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing with AI...
            </>
          ) : (
            "Post Food"
          )}
        </button>
      </form>

      {message && <p className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-slate-200">{message}</p>}
    </section>
  );
}
