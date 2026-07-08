import { useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { DonorDashboard } from "./components/DonorDashboard";
import { ReceiverMap } from "./components/ReceiverMap";
import { ReceiverDashboard } from "./components/ReceiverDashboard";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { LayoutDashboard, Map as MapIcon, Settings as SettingsIcon, LogOut, User as UserIcon, HeartHandshake, Compass, Moon, Sun } from "lucide-react";
import { ProfileModal } from "./components/ProfileModal";
import { LogoutModal } from "./components/LogoutModal";
import { NotificationBell } from "./components/NotificationBell";
import { WorkspaceSettings } from "./components/WorkspaceSettings";

const App = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"overview" | "map" | "rescues" | "settings">("overview");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isDonor = user?.role === "donor";

  if (!user) {
    return <AuthForm />;
  }

  // Determine which component to render based on currentView
  let activeComponent;
  if (currentView === "settings") {
    activeComponent = <WorkspaceSettings />;
  } else if (isDonor) {
    activeComponent = <DonorDashboard isModalOpen={isCreateModalOpen} setIsModalOpen={setIsCreateModalOpen} />;
  } else {
    activeComponent = currentView === "map" ? <ReceiverMap /> : <ReceiverDashboard />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Permanent Left Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-xs"></div>
            <div className="relative rounded-xl bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800">
              <HeartHandshake className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 leading-none block">secondServe</span>
            <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold block mt-0.5">Workspace</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Primary Action Button */}
          <div className="mb-6">
            {isDonor ? (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Create Listing
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView("map")}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <MapIcon className="w-4 h-4" /> Find Food
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentView("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              currentView === "overview" || (isDonor && (currentView === "map" || currentView === "rescues"))
                ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>

          {!isDonor && (
            <>
              <button
                onClick={() => setCurrentView("map")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  currentView === "map"
                    ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <MapIcon className="h-4 w-4" />
                Live Map
              </button>
              <button
                onClick={() => setCurrentView("rescues")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  currentView === "rescues"
                    ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Compass className="h-4 w-4" />
                My Rescues
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              currentView === "settings"
                ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            Workspace Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 cursor-pointer hover:bg-cyan-500/20 transition" onClick={() => setIsProfileOpen(true)}>
                <UserIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-none truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
            <NotificationBell />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 inline-flex items-center justify-center h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all duration-200"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="flex-1 inline-flex items-center justify-center h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {activeComponent}
        </div>
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={logout} />
    </div>
  );
};

export default App;
