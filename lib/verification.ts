import { createHash, randomBytes } from "node:crypto";

export const VERIFICATION_SESSION_TTL_MS = 15 * 60 * 1000;

export type RecognizedNationalIdPayload = {
  name: string;
  birthDate: Date | null;
  sex: string | null;
};

export function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashVerificationToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashQrPayload(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function fromObject(value: Record<string, unknown>): RecognizedNationalIdPayload | null {
  const name = normalizeText(value.name ?? value.fullName ?? value.full_name);
  const birthDate = parseDate(value.birthDate ?? value.birth_date ?? value.dateOfBirth ?? value.date_of_birth);
  const sex = normalizeText(value.sex ?? value.gender) || null;
  if (!name || (!birthDate && !sex)) return null;
  return { name, birthDate, sex };
}

/**
 * Supports only documented/test payload shapes that explicitly identify their fields.
 * Unknown PhilSys payloads are rejected and never treated as authentic.
 */
export function parseRecognizedNationalIdPayload(raw: string): RecognizedNationalIdPayload | null {
  const value = raw.trim();
  if (!value || value.length > 4096) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const object = parsed as Record<string, unknown>;
      const namespace = normalizeText(object.type ?? object.issuer ?? object.source).toLowerCase();
      if (!namespace || (!namespace.includes("philsys") && !namespace.includes("national"))) return null;
      return fromObject(object);
    }
  } catch {
    // The payload is not JSON. Do not guess at an undocumented format.
  }

  return null;
}

export function namesAreSimilar(left: string, right: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const leftParts = new Set(normalize(left).split(" ").filter(Boolean));
  const rightParts = new Set(normalize(right).split(" ").filter(Boolean));
  if (!leftParts.size || !rightParts.size) return false;
  const overlap = [...leftParts].filter((part) => rightParts.has(part)).length;
  return overlap >= Math.min(2, leftParts.size, rightParts.size);
}

export function splitRecognizedName(name: string) {
  const parts = name.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", middleName: "", lastName: "" };
  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1],
  };
}
