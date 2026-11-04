"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Camera,
  CheckCircle2,
  FileImage,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Video,
} from "lucide-react";
import {
  createOfficerVerificationSessionAction,
  recordOfficerLivenessInconclusiveAction,
  recordOfficerNationalIdScanAction,
} from "@/app/actions/auth";

type VerificationResult = { ok: boolean; message: string; name?: string; birthDate?: string | null; sex?: string | null };

export function IdentityVerification({ onReadyChange, onIdentityFieldsChange }: { onReadyChange?: (ready: boolean) => void; onIdentityFieldsChange?: (fields: { name: string; birthDate: string | null; sex: string | null }) => void }) {
  const [sessionId, setSessionId] = useState("");
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [qrStatus, setQrStatus] = useState("Not started");
  const [authenticityStatus, setAuthenticityStatus] = useState("Not verified");
  const [livenessStatus, setLivenessStatus] = useState("Not started");
  const [matchStatus, setMatchStatus] = useState("Unavailable");
  const [overallStatus, setOverallStatus] = useState("Verification required");
  const [details, setDetails] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [challenge, setChallenge] = useState("turn your head slowly to the left");
  const [pending, startTransition] = useTransition();
  const sessionRef = useRef<{ id: string; token: string; expiresAt: string } | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const ready = Boolean(sessionId && qrStatus === "Decoded" && livenessStatus === "Inconclusive — manual review" && overallStatus === "Manual review required");

  useEffect(() => onReadyChange?.(ready), [onReadyChange, ready]);

  useEffect(() => () => {
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function resetVerification() {
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    controlsRef.current = null;
    streamRef.current = null;
    sessionRef.current = null;
    setSessionId("");
    setToken("");
    setExpiresAt("");
    setQrStatus("Not started");
    setAuthenticityStatus("Not verified");
    setLivenessStatus("Not started");
    setMatchStatus("Unavailable");
    setOverallStatus("Verification required");
    setDetails(null);
    setError("");
  }

  async function ensureSession() {
    if (sessionRef.current && new Date(sessionRef.current.expiresAt) > new Date()) return sessionRef.current;
    const result = await createOfficerVerificationSessionAction();
    if (!result.ok) {
      setError("Unable to start a secure verification session.");
      return null;
    }
    sessionRef.current = { id: result.sessionId, token: result.token, expiresAt: result.expiresAt };
    setSessionId(result.sessionId);
    setToken(result.token);
    setExpiresAt(result.expiresAt);
    return sessionRef.current;
  }

  function submitQrPayload(payload: string) {
    startTransition(async () => {
      const session = await ensureSession();
      if (!session) return;
      const formData = new FormData();
      formData.set("verificationSessionId", session.id);
      formData.set("verificationToken", session.token);
      formData.set("qrPayload", payload);
      const result = await recordOfficerNationalIdScanAction(null, formData);
      if (!result.ok) {
        setQrStatus("Failed");
        setError(result.message);
        return;
      }
      setDetails(result);
      if (result.name) onIdentityFieldsChange?.({ name: result.name, birthDate: result.birthDate ?? null, sex: result.sex ?? null });
      setQrStatus("Decoded");
      setAuthenticityStatus("Not verified — manual review");
      setOverallStatus("Continue to live face verification");
      setError("");
    });
  }

  async function startScanner() {
    setError("");
    if (!(await ensureSession())) return;
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, scanError) => {
        if (result) {
          controlsRef.current?.stop();
          controlsRef.current = null;
          submitQrPayload(result.getText());
        } else if (scanError && !String(scanError).includes("NotFoundException")) {
          setError("The QR code could not be read. Move closer, improve lighting, and try again.");
        }
      });
    } catch {
      setError("Camera permission was denied or this browser cannot access the camera. Use the upload option instead.");
    }
  }

  function handleQrUpload(file: File | undefined) {
    if (!file) return;
    startTransition(async () => {
      if (!(await ensureSession())) return;
      const url = URL.createObjectURL(file);
      try {
        const reader = new BrowserMultiFormatReader();
        const result = await reader.decodeFromImageUrl(url);
        submitQrPayload(result.getText());
      } catch {
        setQrStatus("Failed");
        setError("The image did not contain a readable QR code. Upload a clear Philippine National ID QR image.");
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch {
      setCameraError("Camera permission was denied or no camera is available. You may continue to manual review only after the National ID QR is decoded.");
    }
  }

  function recordForManualReview() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("verificationSessionId", sessionId);
      formData.set("verificationToken", token);
      const result = await recordOfficerLivenessInconclusiveAction(null, formData);
      if (!result.ok) {
        setCameraError(result.message);
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setCameraOpen(false);
      setLivenessStatus("Inconclusive — manual review");
      setMatchStatus("Unavailable — authorized ID portrait required");
      setOverallStatus("Manual review required");
      setCameraError(result.message);
    });
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6" aria-labelledby="identity-verification-heading">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88724]">Required identity review</p>
        <h2 id="identity-verification-heading" className="mt-1 text-lg font-bold text-slate-900">National ID and live face verification</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">Your QR payload is decoded in this browser and only a hash plus permitted identity fields are retained. The system does not store raw QR data, raw video, or face embeddings.</p>
      </div>

      <input type="hidden" name="verificationSessionId" value={sessionId} />
      <input type="hidden" name="verificationToken" value={token} />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">1. Scan Philippine National ID</h3><p className="mt-1 text-xs text-slate-600">Use the camera or upload an image containing the QR code. QR decoding alone does not prove authenticity.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{qrStatus}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startScanner} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#073783] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0B4599] disabled:opacity-60"><Camera className="h-4 w-4" />Start ID scan</button>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileImage className="h-4 w-4" />Upload ID image<input type="file" accept="image/*" className="sr-only" onChange={(event) => handleQrUpload(event.currentTarget.files?.[0])} /></label>
        </div>
        <video ref={videoRef} muted playsInline className="mt-4 aspect-video w-full rounded-xl bg-slate-950 object-cover" aria-label="National ID QR camera preview" />
        {details && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" />Recognized identity fields</div><dl className="mt-2 grid gap-1 text-xs sm:grid-cols-3"><div><dt className="text-emerald-700">Name</dt><dd className="font-semibold">{details.name}</dd></div><div><dt className="text-emerald-700">Birth date</dt><dd className="font-semibold">{details.birthDate ?? "Not provided"}</dd></div><div><dt className="text-emerald-700">Sex</dt><dd className="font-semibold">{details.sex ?? "Not provided"}</dd></div></dl></div>}
        <p className="mt-3 text-xs font-medium text-amber-800">Authenticity: {authenticityStatus}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">2. Live face verification</h3><p className="mt-1 text-xs text-slate-600">The current build does not claim certified anti-spoofing. A camera interaction is recorded as inconclusive for administrator review.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{livenessStatus}</span></div>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={startCamera} disabled={pending || qrStatus !== "Decoded"} className="inline-flex items-center gap-2 rounded-xl border border-[#073783] px-4 py-3 text-sm font-semibold text-[#073783] disabled:cursor-not-allowed disabled:opacity-50"><Video className="h-4 w-4" />Start camera</button><button type="button" onClick={() => setChallenge(Math.random() > 0.5 ? "blink twice, then look straight at the camera" : "turn your head slowly to the left")} disabled={!cameraOpen || pending} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className="h-4 w-4" />New challenge</button><button type="button" onClick={recordForManualReview} disabled={!cameraOpen || pending} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">Record for manual review</button></div>
        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">Challenge instruction: <strong>{challenge}</strong>. Exactly-one-face detection, presentation-attack detection, and face matching require an approved computer-vision service/model that is not configured here.</p>
        {cameraError && <p role="alert" className="mt-3 text-xs text-rose-700">{cameraError}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3"><Status label="QR status" value={qrStatus} /><Status label="ID authenticity" value={authenticityStatus} /><Status label="Face match" value={matchStatus} /></div>
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Overall result: {overallStatus}.</strong> No account can be automatically approved by this browser workflow. An administrator must manually verify the submitted ID and authorized portrait before approval.</p></div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {pending && <p className="inline-flex items-center gap-2 text-xs text-slate-600"><LoaderCircle className="h-4 w-4 animate-spin" />Verifying securely…</p>}
      {expiresAt && <p className="text-[11px] text-slate-500">Verification session expires {new Date(expiresAt).toLocaleTimeString("en-PH")}.</p>}
      <button type="button" onClick={resetVerification} className="text-xs font-semibold text-slate-600 underline underline-offset-2">Start over</button>
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xs font-semibold text-slate-800">{value}</p></div>;
}
