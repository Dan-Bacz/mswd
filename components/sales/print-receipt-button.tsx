"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1A3E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#172B4D]"><Printer className="h-4 w-4" /> Print receipt</button>;
}
