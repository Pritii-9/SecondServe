import { AuthForm } from "./components/AuthForm";
import { DonorDashboard } from "./components/DonorDashboard";
import { ReceiverMap } from "./components/ReceiverMap";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { user, logout } = useAuth();

  const isDonor = user?.role === "donor";
  const welcomeTitle = isDonor ? "Donor dashboard" : "Receiver dashboard";
  const welcomeDescription = isDonor
    ? "Post rescued food, watch new listings appear live, and keep your rescue network moving."
    : "Browse nearby rescue locations, open listings on the map, and claim the freshest food first.";

  const activeView = isDonor ? <DonorDashboard /> : <ReceiverMap />;

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/95 shadow-sm shadow-slate-950/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">secondServe</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{welcomeTitle}</h1>
            <p className="mt-4 max-w-2xl text-slate-400 sm:text-lg">{welcomeDescription}</p>
          </div>

          <div className="rounded-3xl bg-slate-950/90 px-5 py-4 text-sm text-slate-200 ring-1 ring-slate-700">
            <p className="font-semibold text-white">Signed in as</p>
            <p className="mt-2 text-slate-300">{user.name} • {user.role}</p>
            <button
              onClick={logout}
              className="mt-4 inline-flex rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {activeView}
      </main>
    </div>
  );
};

export default App;
