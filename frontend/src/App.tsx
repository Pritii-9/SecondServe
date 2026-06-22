import { useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { DonorDashboard } from "./components/DonorDashboard";
import { ReceiverMap } from "./components/ReceiverMap";
import { useAuth } from "./context/AuthContext";
import { LogOut, User as UserIcon, HeartHandshake, Compass, Settings } from "lucide-react";
import { ProfileModal } from "./components/ProfileModal";

const App = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isDonor = user?.role === "donor";
  const welcomeTitle = isDonor ? "Donor Dashboard" : "Receiver Dashboard";
  const welcomeDescription = isDonor
    ? "Post rescued food, watch new listings appear live, and keep your rescue network moving."
    : "Browse nearby rescue locations, open listings on the map, and claim the freshest food first.";

  const activeView = isDonor ? <DonorDashboard /> : <ReceiverMap />;

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
              <div className="relative rounded-xl bg-slate-900 p-2 border border-slate-800">
                <HeartHandshake className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400 leading-none block">secondServe</span>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold block mt-0.5">Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-1.5 text-xs text-slate-200">
              <div className="h-6 w-6 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <UserIcon className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all duration-200"
              title="Profile Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 rounded-3xl border border-slate-900 bg-gradient-to-br from-slate-900/40 via-slate-900/10 to-transparent p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400">
              {isDonor ? <HeartHandshake className="h-3.5 w-3.5" /> : <Compass className="h-3.5 w-3.5" />}
              <span className="uppercase tracking-wider">{user.role} dashboard</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{welcomeTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-400 leading-relaxed">{welcomeDescription}</p>
          </div>
        </div>

        {activeView}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default App;
