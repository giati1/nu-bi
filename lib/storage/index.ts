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
    url: `${env.publicStorageBasePath.replace(/\/$/, "")}/${filename}`,
    mimeType: file.type || null
  };
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

function extname(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index) : "";
}

function guessExtension(mimeType: string) {
  switch (mimeType) {
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
