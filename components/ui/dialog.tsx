import * as React from "react";

export function Dialog({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative min-w-[320px] max-w-[90vw] rounded-2xl bg-white p-6 text-[#0B1A3E] shadow-xl">
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

Dialog.Title = function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-bold text-[#0B1A3E]">{children}</h2>;
};
