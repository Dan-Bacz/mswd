import assert from "node:assert/strict";
import test from "node:test";
import {
  VERIFICATION_SESSION_TTL_MS,
  createVerificationToken,
  hashQrPayload,
  hashVerificationToken,
  namesAreSimilar,
  parseRecognizedNationalIdPayload,
} from "./verification";

test("accepts only an explicitly identified National ID payload", () => {
  const payload = parseRecognizedNationalIdPayload(JSON.stringify({
    issuer: "PhilSys",
    name: "Juan Dela Cruz",
    birthDate: "1990-02-03",
    sex: "M",
  }));

  assert.equal(payload?.name, "Juan Dela Cruz");
  assert.equal(payload?.birthDate?.toISOString(), "1990-02-03T00:00:00.000Z");
  assert.equal(payload?.sex, "M");
});

test("rejects malformed, undocumented, and oversized payloads", () => {
  assert.equal(parseRecognizedNationalIdPayload("not-json"), null);
  assert.equal(parseRecognizedNationalIdPayload(JSON.stringify({ name: "Juan" })), null);
  assert.equal(parseRecognizedNationalIdPayload(JSON.stringify({ issuer: "unknown", name: "Juan", birthDate: "1990-01-01" })), null);
  assert.equal(parseRecognizedNationalIdPayload("x".repeat(4097)), null);
});

test("verification tokens and QR payloads are one-way and deterministic as expected", () => {
  const token = createVerificationToken();
  assert.notEqual(token, createVerificationToken());
  assert.equal(hashVerificationToken(token), hashVerificationToken(token));
  assert.equal(hashQrPayload("  payload  "), hashQrPayload("payload"));
  assert.notEqual(hashQrPayload("payload"), "payload");
});

test("name comparison supports manual-review mismatch detection", () => {
  assert.equal(namesAreSimilar("Juan Dela Cruz", "JUAN DELA CRUZ"), true);
  assert.equal(namesAreSimilar("Juan Dela Cruz", "Maria Santos"), false);
});

test("verification sessions use a bounded expiration window", () => {
  assert.equal(VERIFICATION_SESSION_TTL_MS, 15 * 60 * 1000);
});
