import { NextResponse } from "next/server";
import { getStoredFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  const file = await getStoredFile(params.key);
  if (!file) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  return new NextResponse(file.body, {
    headers: {
      "content-type": file.contentType,
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
