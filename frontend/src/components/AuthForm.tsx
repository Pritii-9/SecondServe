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
    <div className="flex min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Left Panel - Brand / Value Prop (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/90 via-slate-900/95 to-emerald-900/90 z-10" />
        
        {/* Content */}
        <div className="relative z-20 flex flex-col justify-between w-full h-full p-16">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm border border-white/20">
                <HeartHandshake className="h-6 w-6 text-cyan-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-white">secondServe</span>
            </div>
          </div>
          
          <div className="max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Zero-waste logistics for modern enterprises.
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              Join the leading platform connecting surplus food from high-volume donors directly to local communities in real-time. Fast, secure, and fully traceable.
            </p>
          </div>
          
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-4">Trusted by Industry Leaders</p>
            <div className="flex gap-4 opacity-50">
               {/* Decorative placeholders for logos */}
               <div className="h-8 w-24 bg-white/20 rounded-md"></div>
               <div className="h-8 w-24 bg-white/20 rounded-md"></div>
               <div className="h-8 w-24 bg-white/20 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-32 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="lg:hidden absolute top-8 left-6 flex items-center gap-3">
           <div className="rounded-xl bg-cyan-50 dark:bg-slate-900 p-2 border border-cyan-100 dark:border-slate-800">
              <HeartHandshake className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
           </div>
           <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white">secondServe</span>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-lg mt-12 lg:mt-0">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {sectionTitle}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {registrationHint}
            </p>
          </div>

          {mode !== "verify" ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400"
                      placeholder="Jane Doe"
                    />
                  </div>
                  {errors.name && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> <span>{errors.name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400"
                    placeholder="jane@company.com"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  {mode === "login" && (
                    <a href="#" className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">Forgot password?</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" /> <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div className="pt-2">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Account Type</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {roles.map((option) => {
                          const RoleIcon = option.icon;
                          const isSelected = role === option.value;
                          return (
                             <button
                              key={option.value}
                              type="button"
                              onClick={() => setRole(option.value)}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                                isSelected
                                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 ring-1 ring-cyan-500"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              <RoleIcon className={`h-5 w-5 ${isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                              <span className={`text-sm font-semibold ${isSelected ? "text-cyan-900 dark:text-cyan-300" : "text-slate-700 dark:text-slate-300"}`}>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Service Location</p>
                        <button
                          type="button" onClick={getLocation} disabled={locating}
                          className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                          {locating ? "Locating..." : "Use current"}
                        </button>
                      </div>
                      <div className="grid gap-3 grid-cols-2">
                        <div>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 placeholder:text-slate-400"
                              placeholder="Lat"
                            />
                          </div>
                          {errors.latitude && <p className="text-[10px] text-rose-500 mt-1">{errors.latitude}</p>}
                        </div>
                        <div>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 placeholder:text-slate-400"
                              placeholder="Lng"
                            />
                          </div>
                          {errors.longitude && <p className="text-[10px] text-rose-500 mt-1">{errors.longitude}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-3.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                <span>{loading ? "Please wait..." : actionLabel}</span>
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifySubmit}>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Verification Code
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Sent to <span className="font-semibold text-slate-900 dark:text-white">{verifyEmail}</span>
                </p>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-12 pr-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 dark:text-white outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400"
                    placeholder="123456"
                  />
                </div>
                {errors.verificationCode && (
                 <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-2">
                    <AlertCircle className="h-4 w-4" /> <span>{errors.verificationCode}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-3.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 mt-4 shadow-sm"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                <span>Verify Account</span>
              </button>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Back to Login
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleResendCode}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {message && (
            <div className={`mt-6 flex items-start gap-3 rounded-xl p-4 text-sm border ${
              message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("not") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")
                ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                : message.toLowerCase().includes("fetching")
                ? "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 animate-pulse"
                : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
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

          {mode !== "verify" && (
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => toggleMode("register")} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => toggleMode("login")} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
