import { NextResponse } from "next/server";
import { z } from "zod";
import { generateVideoClip } from "@/lib/ai";
import { requireViewer } from "@/lib/auth/session";

const schema = z.object({
  prompt: z.string().min(8).max(800),
  style: z.string().min(2).max(60),
  mood: z.string().min(2).max(40).optional(),
  seconds: z.enum(["4", "8"]),
  size: z.enum(["720x1280", "1280x720"])
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const contentType = request.headers.get("content-type") ?? "";
    let video;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = schema.parse({
        prompt: formData.get("prompt"),
        style: formData.get("style"),
        mood: formData.get("mood"),
        seconds: formData.get("seconds"),
        size: formData.get("size")
      });

      const referenceImage = formData.get("referenceImage");
      if (referenceImage && !(referenceImage instanceof File)) {
        throw new Error("Reference image upload was invalid.");
      }
      if (
        referenceImage instanceof File &&
        (!referenceImage.type.startsWith("image/") ||
          !["image/jpeg", "image/png", "image/webp"].includes(referenceImage.type))
      ) {
        throw new Error("Use a JPG, PNG, or WebP image as the video reference.");
      }

      video = await generateVideoClip({
        ...parsed,
        referenceImage: referenceImage instanceof File && referenceImage.size > 0 ? referenceImage : null
      });
    } else {
      const parsed = schema.parse(await request.json());
      video = await generateVideoClip({ ...parsed, referenceImage: null });
    }

    return NextResponse.json(video);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate video.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
