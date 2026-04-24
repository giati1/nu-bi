import { env, usesLocalStorage, usesR2 } from "@/lib/config/env";
import { getCloudflareBindings } from "@/lib/cloudflare/context";

export type UploadedFileLike = {
  name?: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export async function saveUploadedFile(file: UploadedFileLike) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = guessExtension(file.type ?? "") || extname(file.name ?? "");
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const cloudflare = getCloudflareBindings();

  if (usesR2()) {
    if (!cloudflare?.MEDIA) {
      throw new Error(
        "STORAGE_DRIVER is set to r2, but the Cloudflare MEDIA binding is unavailable. Use wrangler dev/deploy for R2, or switch STORAGE_DRIVER=local for local Node development."
      );
    }

    await cloudflare.MEDIA.put(filename, bytes, {
      httpMetadata: {
        contentType: file.type || undefined
      }
    });

    return {
      storageKey: filename,
      url: env.r2PublicBaseUrl
        ? `${env.r2PublicBaseUrl.replace(/\/$/, "")}/${filename}`
        : `${env.publicMediaBasePath.replace(/\/$/, "")}/${filename}`,
      mimeType: file.type || null
    };
  }

  if (!usesLocalStorage()) {
    throw new Error(`Unsupported STORAGE_DRIVER value: ${env.storageDriver}`);
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const destination = path.join(env.uploadsDir, filename);
  await fs.mkdir(env.uploadsDir, { recursive: true });
  await fs.writeFile(destination, bytes);

  return {
    storageKey: filename,
    url: toStoredFileUrl(filename),
    mimeType: file.type || null
  };
}

export async function saveGeneratedDataUrl(input: { filenamePrefix: string; dataUrl: string }) {
  const parsed = parseDataUrl(input.dataUrl);
  if (!parsed) {
    throw new Error("Generated media was not a valid data URL.");
  }

  const extension = guessExtension(parsed.mimeType);
  const file = {
    name: `${input.filenamePrefix}${extension}`,
    type: parsed.mimeType,
    async arrayBuffer() {
      return parsed.bytes.buffer.slice(
        parsed.bytes.byteOffset,
        parsed.bytes.byteOffset + parsed.bytes.byteLength
      );
    }
  } satisfies UploadedFileLike;

  return await saveUploadedFile(file);
}

export async function getStoredFile(key: string) {
  const cloudflare = getCloudflareBindings();

  if (usesR2()) {
    if (!cloudflare?.MEDIA) {
      throw new Error(
        "STORAGE_DRIVER is set to r2, but the Cloudflare MEDIA binding is unavailable. Use wrangler dev/deploy for R2, or switch STORAGE_DRIVER=local for local Node development."
      );
    }

    const object = await cloudflare.MEDIA.get(key);
    if (!object?.body) {
      return null;
    }

    const headers = new Headers();
    object.writeHttpMetadata?.(headers);
    if (!headers.get("content-type") && object.httpMetadata?.contentType) {
      headers.set("content-type", object.httpMetadata.contentType);
    }

    return {
      body: object.body,
      contentType: headers.get("content-type") ?? guessMimeTypeFromKey(key)
    };
  }

  if (!usesLocalStorage()) {
    throw new Error(`Unsupported STORAGE_DRIVER value: ${env.storageDriver}`);
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(env.uploadsDir, key);

  try {
    const body = await fs.readFile(filePath);
    return {
      body,
      contentType: guessMimeTypeFromKey(key)
    };
  } catch {
    return null;
  }
}

export function toStoredFileUrl(storageKey: string) {
  return `${env.publicMediaBasePath.replace(/\/$/, "")}/${encodeURIComponent(storageKey)}`;
}

export function normalizeStoredFileUrl(url: string | null | undefined, storageKey?: string | null) {
  if (!url && !storageKey) {
    return null;
  }

  if (!usesLocalStorage()) {
    return url ?? null;
  }

  if (storageKey) {
    return toStoredFileUrl(storageKey);
  }

  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(`${env.publicMediaBasePath.replace(/\/$/, "")}/`)) {
    return trimmed;
  }

  if (/^data:/i.test(trimmed)) {
    return trimmed;
  }

  const localUploadsBase = `${env.publicStorageBasePath.replace(/\/$/, "")}/`;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith(localUploadsBase)) {
        const filename = parsed.pathname.slice(localUploadsBase.length).split("/").pop();
        return filename ? toStoredFileUrl(decodeURIComponent(filename)) : trimmed;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith(localUploadsBase)) {
    const filename = trimmed.slice(localUploadsBase.length).split("/").pop();
    return filename ? toStoredFileUrl(decodeURIComponent(filename)) : trimmed;
  }

  return trimmed;
}

function extname(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index) : "";
}

function guessExtension(mimeType: string) {
  switch (mimeType) {
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    case "audio/webm":
      return ".webm";
    case "audio/mp4":
      return ".m4a";
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
      return ".wav";
    default:
      return ".jpg";
  }
}

function guessMimeTypeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    default:
      return "image/jpeg";
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/s);
  if (!match) {
    return null;
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return {
    mimeType,
    bytes: new Uint8Array(buffer)
  };
}
