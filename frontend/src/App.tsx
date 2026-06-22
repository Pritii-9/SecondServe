import { useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { DonorDashboard } from "./components/DonorDashboard";
import { ReceiverMap } from "./components/ReceiverMap";
import { ReceiverDashboard } from "./components/ReceiverDashboard";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { LogOut, User as UserIcon, HeartHandshake, Compass, Settings, Moon, Sun } from "lucide-react";
import { ProfileModal } from "./components/ProfileModal";
import { LogoutModal } from "./components/LogoutModal";
import { NotificationBell } from "./components/NotificationBell";

const App = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const isDonor = user?.role === "donor";
  const [receiverTab, setReceiverTab] = useState<"map" | "rescues">("map");

  const welcomeTitle = isDonor ? "Donor Dashboard" : "Receiver Dashboard";
  const welcomeDescription = isDonor
    ? "Post rescued food, watch new listings appear live, and keep your rescue network moving."
    : "Browse nearby rescue locations, open listings on the map, and claim the freshest food first.";

  const activeView = isDonor ? <DonorDashboard /> : (receiverTab === "map" ? <ReceiverMap /> : <ReceiverDashboard />);

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
              <div className="relative rounded-xl bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <HeartHandshake className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-400 leading-none block">secondServe</span>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold block mt-0.5">Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 transition-colors duration-300">
              <div className="h-6 w-6 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <UserIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all duration-200"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all duration-200"
              title="Profile Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 rounded-3xl border border-slate-200 dark:border-slate-900 bg-gradient-to-br from-white via-slate-50 to-transparent dark:from-slate-900/40 dark:via-slate-900/10 dark:to-transparent p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 transition-colors duration-300">
              {isDonor ? <HeartHandshake className="h-3.5 w-3.5" /> : <Compass className="h-3.5 w-3.5" />}
              <span className="uppercase tracking-wider">{user.role} dashboard</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl transition-colors duration-300">{welcomeTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed transition-colors duration-300">{welcomeDescription}</p>
          </div>
        </div>

        {!isDonor && (
          <div className="mb-6 flex gap-2 rounded-2xl bg-slate-50 dark:bg-slate-950 p-1.5 ring-1 ring-slate-200 dark:ring-slate-800 w-fit transition-colors duration-300">
            <button
              onClick={() => setReceiverTab("map")}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                receiverTab === "map"
                  ? "bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setReceiverTab("rescues")}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                receiverTab === "rescues"
                  ? "bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              My Rescues
            </button>
          </div>
        )}

        {activeView}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={logout} />
    </div>
  );
};

export default App;
