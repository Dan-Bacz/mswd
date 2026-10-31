import { randomUUID } from "node:crypto";

export const STAFF_ID_MAX_SIZE = 5 * 1024 * 1024;
export const STAFF_ID_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export type ValidatedUpload = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: Uint8Array;
};

export class UploadValidationError extends Error {}

function startsWith(content: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => content[offset + index] === value);
}

function detectFileType(content: Uint8Array) {
  if (startsWith(content, [0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (startsWith(content, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (
    String.fromCharCode(...content.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...content.slice(8, 12)) === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  if (String.fromCharCode(...content.slice(0, 5)) === "%PDF-") {
    return { mimeType: "application/pdf", extension: "pdf" };
  }
  return null;
}

export async function validateStaffIdUpload(value: FormDataEntryValue | null): Promise<ValidatedUpload> {
  if (!(typeof File !== "undefined" && value instanceof File) || value.size === 0) {
    throw new UploadValidationError("Upload a government-issued ID or employment document.");
  }

  if (value.size > STAFF_ID_MAX_SIZE) {
    throw new UploadValidationError("The ID file must be 5 MB or smaller.");
  }

  const content = new Uint8Array(await value.arrayBuffer());
  const detected = detectFileType(content);

  if (!detected) {
    throw new UploadValidationError("Upload a valid JPEG, PNG, WebP image, or PDF document.");
  }

  const originalName =
    value.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 255) || `staff-id.${detected.extension}`;

  return {
    fileName: `staff-id-${randomUUID()}.${detected.extension}`,
    originalName,
    mimeType: detected.mimeType,
    size: content.byteLength,
    content,
  };
}
