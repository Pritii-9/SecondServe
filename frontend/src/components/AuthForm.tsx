import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/index";
import { api } from "../utils/api";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  MapPin,
  Compass,
  HeartHandshake,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const roles: Array<{ value: UserRole; label: string; description: string; icon: any }> = [
  {
    value: "donor",
    label: "Donor",
    description: "Post rescued food and share it with nearby receivers.",
    icon: HeartHandshake,
  },
  {
    value: "receiver",
    label: "Receiver",
    description: "Browse nearby rescue listings and claim food quickly.",
    icon: Compass,
  },
];

export function AuthForm() {
  const { login, register, verifyCode, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("receiver");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionTitle =
    mode === "login"
      ? "Sign in to secondServe"
      : mode === "register"
      ? "Create your account"
      : "Verify your email";

  const actionLabel = mode === "login" ? "Sign in" : "Create account";

  const toggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setMessage(null);
    setErrors({});
    setShowPassword(false);
    setVerificationCode("");
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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

    setLocating(true);
    setMessage("Fetching your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage("Location captured successfully.");
        setLocating(false);
      },
      () => {
        setMessage("Unable to access your location. Please enter it manually.");
        setLocating(false);
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
        const res = await login(email, password);
        if (res?.requiresVerification) {
          setVerifyEmail(res.email || email);
          setMode("verify");
          setCooldown(30);
          setMessage("A verification code was sent to your email.");
        }
      } else {
        const res = await register(name, email, password, role, {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        });
        if (res?.requiresVerification) {
          setVerifyEmail(res.email || email);
          setMode("verify");
          setCooldown(30);
          setMessage("A verification code was sent to your email.");
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Authentication failed. Please check your details.";
      setMessage(errorMsg);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrors({});
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setErrors({ verificationCode: "Please enter a valid 6-digit code." });
      return;
    }

    try {
      await verifyCode(verifyEmail, verificationCode);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid or expired verification code.";
      setMessage(errorMsg);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setMessage(null);
    try {
      await api.post("/api/auth/resend-code", { email: verifyEmail });
      setMessage("Verification code resent successfully!");
      setCooldown(30);
    } catch {
      setMessage("Failed to resend verification code. Please try again.");
    }
  };

  const registrationHint = useMemo(() => {
    if (mode === "login") return "Enter your existing account credentials.";
    if (mode === "verify") return "We sent a security verification code to secure your login/registration.";
    return role === "donor"
      ? "Donors share rescued food with nearby receivers. A location is required so we can show your listings on the map."
      : "Receivers search the live map for nearby available food. A location helps us send nearby listings faster.";
  }, [mode, role]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-[2rem] border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-slate-950/50">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-30 blur-sm"></div>
              <img src="/icons.svg" alt="SecondServe icon" className="relative h-16 w-16 rounded-3xl bg-slate-950 p-3.5 shadow-xl border border-slate-800" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-400">secondServe</p>
              <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white">{sectionTitle}</h1>
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">{registrationHint}</p>
            </div>
          </div>
          {mode !== "verify" && (
            <div className="flex shrink-0 gap-1 rounded-2xl bg-slate-950/80 p-1.5 ring-1 ring-slate-800 self-start sm:self-center">
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 ${mode === "login" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"}`}
                onClick={() => toggleMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 ${mode === "register" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"}`}
                onClick={() => toggleMode("register")}
              >
                Sign up
              </button>
            </div>
          )}
        </div>

        {mode !== "verify" ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="group">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">Full name</label>
                <div className="relative mt-2">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 pl-12 pr-4 py-3.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-650"
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="group">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">Email address</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 pl-12 pr-4 py-3.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-650"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">Password</label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 pl-12 pr-12 py-3.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-650"
                    placeholder="Enter a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/40 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Account role</p>
                  <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
                    {roles.map((option) => {
                      const RoleIcon = option.icon;
                      const isSelected = role === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          className={`group/role rounded-2xl border p-4 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-cyan-500/80 bg-cyan-500/5 shadow-lg shadow-cyan-500/5"
                              : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-xl p-2.5 transition-colors duration-200 ${
                              isSelected ? "bg-cyan-500 text-slate-950" : "bg-slate-950 border border-slate-800 text-slate-400 group-hover/role:text-slate-200"
                            }`}>
                              <RoleIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{option.label}</p>
                              <p className="mt-1 text-xs text-slate-400 leading-normal">{option.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Primary location coordinates</p>
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors duration-200 disabled:opacity-50"
                    >
                      {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" /> : <Navigation className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />}
                      <span>{locating ? "Locating..." : "Use current location"}</span>
                    </button>
                  </div>
                  <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
                    <div className="group/lat">
                      <label className="block text-xs text-slate-400 group-focus-within/lat:text-cyan-400 transition-colors duration-200">Latitude</label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/lat:text-cyan-400 transition-colors duration-200" />
                        <input
                          type="text"
                          value={latitude}
                          onChange={(event) => setLatitude(event.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-700"
                          placeholder="e.g. 18.5204"
                        />
                      </div>
                      {errors.latitude && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.latitude}</span>
                        </div>
                      )}
                    </div>
                    <div className="group/lng">
                      <label className="block text-xs text-slate-400 group-focus-within/lng:text-cyan-400 transition-colors duration-200">Longitude</label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/lng:text-cyan-400 transition-colors duration-200" />
                        <input
                          type="text"
                          value={longitude}
                          onChange={(event) => setLongitude(event.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-700"
                          placeholder="e.g. 73.8567"
                        />
                      </div>
                      {errors.longitude && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.longitude}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden group/btn w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-4 text-sm font-bold tracking-wider uppercase text-slate-950 transition hover:from-cyan-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-cyan-500/10 flex gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Working…</span>
                </>
              ) : (
                <span>{actionLabel}</span>
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifySubmit}>
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200">
                Verification Code
              </label>
              <p className="mt-2 text-xs text-slate-400">
                We sent a 6-digit security code to <span className="font-semibold text-white">{verifyEmail}</span>. Enter it below to verify your account.
              </p>
              <div className="relative mt-4">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200" />
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 pl-12 pr-4 py-3.5 text-center text-lg font-bold tracking-[0.5em] text-cyan-450 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-700 placeholder:tracking-normal"
                  placeholder="123456"
                />
              </div>
              {errors.verificationCode && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.verificationCode}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden group/btn w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-4 text-sm font-bold tracking-wider uppercase text-slate-950 transition hover:from-cyan-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-cyan-500/10 flex gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <span>Verify Account</span>
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors duration-200"
              >
                Back to Login
              </button>
              <button
                type="button"
                disabled={cooldown > 0}
                onClick={handleResendCode}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-350 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend verification code"}
              </button>
            </div>
          </form>
        )}

        {message && (
          <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm border transition-all duration-300 ${
            message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("not") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")
              ? "bg-rose-500/10 border-rose-500/20 text-rose-350"
              : message.toLowerCase().includes("fetching")
              ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 animate-pulse"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-355"
          }`}>
            {message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("not") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired") ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : message.toLowerCase().includes("fetching") ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
