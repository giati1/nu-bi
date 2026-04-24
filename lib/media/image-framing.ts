export async function processImageUpload(
  file: File,
  {
    cssFilter = "none",
    focusY = 28,
    aspectRatio = 4 / 5,
    fitMode = "cover"
  }: {
    cssFilter?: string;
    focusY?: number;
    aspectRatio?: number;
    fitMode?: "cover" | "contain";
  } = {}
) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sourceAspectRatio = sourceWidth / sourceHeight;

    const canvas = document.createElement("canvas");
    const outputWidth = sourceAspectRatio >= aspectRatio ? Math.round(sourceHeight * aspectRatio) : sourceWidth;
    const outputHeight = Math.round(outputWidth / aspectRatio);
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    if (fitMode === "contain") {
      const scale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const drawWidth = Math.round(sourceWidth * scale);
      const drawHeight = Math.round(sourceHeight * scale);
      const drawX = Math.round((canvas.width - drawWidth) / 2);
      const maxOffsetY = Math.max(0, canvas.height - drawHeight);
      const desiredOffsetY = Math.round(((focusY / 100) * canvas.height) - drawHeight / 2);
      const drawY = clamp(desiredOffsetY, 0, maxOffsetY);

      context.fillStyle = "#0a0a0a";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.filter = cssFilter;
      context.drawImage(image, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
    } else {
      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      let cropX = 0;
      let cropY = 0;

      if (sourceAspectRatio > aspectRatio) {
        cropWidth = sourceHeight * aspectRatio;
        cropX = (sourceWidth - cropWidth) / 2;
      } else if (sourceAspectRatio < aspectRatio) {
        cropHeight = sourceWidth / aspectRatio;
        const maxCropY = Math.max(0, sourceHeight - cropHeight);
        const desiredCenterY = (focusY / 100) * sourceHeight;
        cropY = clamp(desiredCenterY - cropHeight / 2, 0, maxCropY);
      }

      context.filter = cssFilter;
      context.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      return file;
    }

    return new File([blob], file.name.replace(/\.\w+$/, "") + "-framed.jpg", {
      type: "image/jpeg"
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}
