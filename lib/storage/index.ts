import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "@/lib/config/env";

export type UploadedFileLike = {
  name?: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export async function saveUploadedFile(file: UploadedFileLike) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name ?? "") || guessExtension(file.type ?? "");
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(env.uploadsDir, filename);
  await fs.mkdir(env.uploadsDir, { recursive: true });
  await fs.writeFile(destination, bytes);

  return {
    storageKey: filename,
    url: env.r2PublicBaseUrl
      ? `${env.r2PublicBaseUrl.replace(/\/$/, "")}/${filename}`
      : `${env.publicStorageBasePath.replace(/\/$/, "")}/${filename}`,
    mimeType: file.type || null
  };
}

function guessExtension(mimeType: string) {
  if (mimeType === "image/png") {
    return ".png";
  }
  if (mimeType === "image/webp") {
    return ".webp";
  }
  if (mimeType === "image/gif") {
    return ".gif";
  }
  if (mimeType === "video/mp4") {
    return ".mp4";
  }
  if (mimeType === "video/webm") {
    return ".webm";
  }
  if (mimeType === "video/quicktime") {
    return ".mov";
  }
  if (mimeType === "audio/webm") {
    return ".webm";
  }
  if (mimeType === "audio/mp4") {
    return ".m4a";
  }
  if (mimeType === "audio/mpeg") {
    return ".mp3";
  }
  if (mimeType === "audio/wav") {
    return ".wav";
  }
  return ".jpg";
}
