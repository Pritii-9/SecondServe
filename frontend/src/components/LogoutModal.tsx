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
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-sm flex flex-col rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-slate-300/50 dark:shadow-slate-950/50 overflow-hidden transition-colors duration-300 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="relative p-6 pb-4 sm:p-8 sm:pb-5 border-b border-slate-200 dark:border-slate-800/50 shrink-0 transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Sign Out</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 pt-5 sm:p-8 sm:pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-colors duration-300">
            Are you sure you want to log out of your secondServe account? You will need to verify your email again to log back in.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 py-3.5 text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white py-3.5 text-xs font-bold tracking-wider uppercase shadow-lg shadow-rose-500/20 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
