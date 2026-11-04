"use client";

import { useState } from "react";
import { LoaderCircle, ScanLine } from "lucide-react";

type IdentityFields = { name: string; birthDate: string | null; sex: string | null };

function findField(text: string, labels: string[]) {
  const label = labels.join("|");
  const match = new RegExp(`(?:${label})\\s*[:\\-]?\\s*([^\\n]+)`, "i").exec(text);
  return match?.[1]?.replace(/[|]+/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

function parseOcrText(text: string): IdentityFields | null {
  const fullName = findField(text, ["FULL NAME", "NAME", "NOMBRE"]);
  const first = findField(text, ["GIVEN NAME", "FIRST NAME"]);
  const middle = findField(text, ["MIDDLE NAME"]);
  const last = findField(text, ["LAST NAME", "SURNAME"]);
  const name = fullName || [first, middle, last].filter(Boolean).join(" ");
  if (!name) return null;

  const birthDate = findField(text, ["DATE OF BIRTH", "BIRTH DATE", "DOB"]).replace(/[^0-9/.-]/g, "") || null;
  const sex = findField(text, ["SEX", "GENDER"]).split(" ")[0] || null;
  return { name, birthDate, sex };
}

export function NationalIdCapture({ onFilesReady, onIdentityFieldsChange }: { onFilesReady: (ready: boolean) => void; onIdentityFieldsChange: (fields: IdentityFields) => void }) {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState("Waiting for the front image");
  const [ocrError, setOcrError] = useState("");

  async function readFrontImage(file: File | undefined) {
    if (!file) {
      setFrontFile(null);
      onFilesReady(false);
      return;
    }
    setFrontFile(file);
    onFilesReady(Boolean(file && backFile));
    setOcrError("");
    setOcrStatus("Reading the front image…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(file);
      await worker.terminate();
      const fields = parseOcrText(result.data.text);
      if (!fields) {
        setOcrStatus("Image captured, but no readable identity fields were detected. Enter the fields manually.");
        return;
      }
      onIdentityFieldsChange(fields);
      setOcrStatus("Identity fields detected. Review the pre-filled values before continuing.");
    } catch {
      setOcrError("The image was saved, but automatic reading was unavailable. Enter the fields manually.");
      setOcrStatus("Manual entry required");
    }
  }

  function setBack(file: File | undefined) {
    setBackFile(file ?? null);
    onFilesReady(Boolean(frontFile && file));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3"><ScanLine className="mt-0.5 h-5 w-5 text-[#073783]" /><div><h3 className="font-bold text-slate-900">National ID reference images</h3><p className="mt-1 text-xs leading-relaxed text-slate-600">Capture or upload both sides. The front image is read locally with OCR to pre-fill your name fields; the original images are saved for administrator identity review.</p></div></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Front of National ID<input name="nationalIdFront" type="file" required accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => readFrontImage(event.currentTarget.files?.[0])} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs" /></label>
        <label className="text-sm font-semibold text-slate-700">Back of National ID<input name="nationalIdBack" type="file" required accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setBack(event.currentTarget.files?.[0])} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs" /></label>
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">{ocrStatus === "Reading the front image…" && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{ocrStatus}</p>
      {ocrError && <p role="alert" className="mt-2 text-xs text-amber-700">{ocrError}</p>}
      <p className="mt-2 text-[11px] text-slate-500">OCR suggestions are not proof of identity. Check every field against the original ID before submitting.</p>
    </section>
  );
}
