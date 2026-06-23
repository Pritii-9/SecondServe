import { LogOut, X, AlertTriangle } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md transition-all duration-300" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-300/50 dark:shadow-slate-950/50 transition-all duration-300 animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <AlertTriangle className="h-7 w-7 text-rose-500 dark:text-rose-400" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Confirm Logout</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Are you sure you want to log out of your secondServe account? You will need to verify your email again to log back in.
        </p>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 py-3.5 text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-400 dark:bg-rose-500 dark:hover:bg-rose-400 text-white dark:text-slate-950 py-3.5 text-sm font-bold tracking-wider uppercase shadow-lg shadow-rose-500/20 dark:shadow-rose-500/10 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
