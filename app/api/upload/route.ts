import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireViewer();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!isUploadedFileLike(file)) {
      return NextResponse.json({ error: "Missing upload file." }, { status: 400 });
    }
    if (!isSupportedMimeType(file.type)) {
      return NextResponse.json({ error: "Only images, audio, and short-form video uploads are supported." }, { status: 400 });
    }
    const saved = await saveUploadedFile(file);
    return NextResponse.json({ file: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}

function isSupportedMimeType(mimeType: string | undefined) {
  if (!mimeType) {
    return false;
  }
  return (
    mimeType.startsWith("image/") ||
    mimeType === "audio/webm" ||
    mimeType === "audio/mp4" ||
    mimeType === "audio/mpeg" ||
    mimeType === "audio/wav" ||
    mimeType === "video/mp4" ||
    mimeType === "video/webm" ||
    mimeType === "video/quicktime"
  );
}

function isUploadedFileLike(
  value: unknown
): value is { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  );
}
