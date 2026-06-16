import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/index";

const roles: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: "donor",
    label: "Donor",
    description: "Post rescued food and share it with nearby receivers.",
  },
  {
    value: "receiver",
    label: "Receiver",
    description: "Browse nearby rescue listings and claim food quickly.",
  },
];

export function AuthForm() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("receiver");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionTitle = mode === "login" ? "Sign in to secondServe" : "Create your account";
  const actionLabel = mode === "login" ? "Sign in" : "Create account";

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password.trim()) nextErrors.password = "Password is required.";

    if (mode === "register") {
      if (!name.trim()) nextErrors.name = "Name is required.";
      if (!role) nextErrors.role = "A role is required.";
      if (!latitude || Number.isNaN(Number(latitude))) nextErrors.latitude = "Valid latitude is required.";
      if (!longitude || Number.isNaN(Number(longitude))) nextErrors.longitude = "Valid longitude is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available in this browser.");
      return;
    }

    setMessage("Fetching your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage("Location captured successfully.");
      },
      () => {
        setMessage("Unable to access your location. Please enter it manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!validate()) return;

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password, role, {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        });
      }
    } catch (error) {
      setMessage("Authentication failed. Please check your details and try again.");
    }
  };

  const registrationHint = useMemo(() => {
    if (mode === "login") return "Enter your existing account credentials.";
    return role === "donor"
      ? "Donors share rescued food with nearby receivers. A location is required so we can show your listings on the map."
      : "Receivers search the live map for nearby available food. A location helps us send nearby listings faster.";
  }, [mode, role]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/30">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">secondServe</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">{sectionTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">{registrationHint}</p>
            </div>
            <div className="flex gap-3 rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-200 ring-1 ring-slate-700">
              <button
                type="button"
                className={`rounded-2xl px-4 py-2 transition ${mode === "login" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`rounded-2xl px-4 py-2 transition ${mode === "register" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                onClick={() => setMode("register")}
              >
                Sign up
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-200">Full name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Enter your name"
                />
                {errors.name && <p className="mt-2 text-sm text-rose-400">{errors.name}</p>}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-200">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-2 text-sm text-rose-400">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Enter a secure password"
                />
                {errors.password && <p className="mt-2 text-sm text-rose-400">{errors.password}</p>}
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Account role</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {roles.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`rounded-3xl border p-4 text-left transition ${role === option.value ? "border-cyan-400 bg-cyan-500/15" : "border-slate-700 bg-slate-900/80 hover:border-slate-500"}`}
                      >
                        <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                      </button>
                    ))}
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
                  type="button"
                  onClick={getLocation}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                >
                  Use current location
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Working…" : actionLabel}
            </button>
          </form>

          {message && <div className="mt-6 rounded-3xl bg-slate-950/90 p-4 text-sm text-slate-200">{message}</div>}
        </div>
      </div>
    </div>
  );
}
