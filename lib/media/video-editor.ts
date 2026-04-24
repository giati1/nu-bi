export type VideoEditSettings = {
  aspectRatio: number;
  coverTime: number;
  focusY: number;
  muted: boolean;
  trimEnd: number;
  trimStart: number;
};

export type VideoMetadata = {
  duration: number;
  height: number;
  width: number;
};

export async function getVideoMetadata(file: File) {
  return await withVideoFile(file, async (video) => ({
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    width: video.videoWidth || 0,
    height: video.videoHeight || 0
  }));
}

export async function extractVideoFrameAt(file: File, time: number, aspectRatio: number, focusY: number) {
  return await withVideoFile(file, async (video) => {
    await seekVideo(video, time);
    const { sourceHeight, sourceWidth, sourceX, sourceY, targetHeight, targetWidth } = getCropRect(
      video.videoWidth,
      video.videoHeight,
      aspectRatio,
      focusY
    );
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return canvas.toDataURL("image/jpeg", 0.86);
  });
}

export async function processVideoUpload(file: File, settings: VideoEditSettings) {
  return await withVideoFile(file, async (video) => {
    const safeStart = clamp(settings.trimStart, 0, video.duration || 0);
    const safeEnd = clamp(settings.trimEnd, safeStart + 0.1, video.duration || safeStart + 0.1);
    const { sourceHeight, sourceWidth, sourceX, sourceY, targetHeight, targetWidth } = getCropRect(
      video.videoWidth,
      video.videoHeight,
      settings.aspectRatio,
      settings.focusY
    );

    const maxWidth = 720;
    const outputWidth = Math.min(targetWidth, maxWidth);
    const outputHeight = Math.max(1, Math.round(outputWidth / settings.aspectRatio));
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    await seekVideo(video, safeStart);

    const canvasStream = canvas.captureStream(30);
    const captureVideo = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const sourceStream =
      typeof captureVideo.captureStream === "function"
        ? captureVideo.captureStream()
        : typeof captureVideo.mozCaptureStream === "function"
          ? captureVideo.mozCaptureStream()
          : null;
    const outputTracks = [...canvasStream.getVideoTracks()];

    if (!settings.muted && sourceStream) {
      outputTracks.push(...sourceStream.getAudioTracks());
    }

    const outputStream = new MediaStream(outputTracks);
    const recorderMimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(outputStream, { mimeType: recorderMimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    let frameId = 0;
    const drawFrame = () => {
      context.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      if (!video.paused && !video.ended && video.currentTime < safeEnd) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const finished = new Promise<File>((resolve) => {
      recorder.onstop = () => {
        window.cancelAnimationFrame(frameId);
        outputStream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve(
          new File([blob], file.name.replace(/\.\w+$/, "") + "-edited.webm", {
            type: "video/webm"
          })
        );
      };
    });

    recorder.start();
    drawFrame();
    await video.play();

    await new Promise<void>((resolve) => {
      const check = () => {
        if (video.currentTime >= safeEnd || video.ended) {
          resolve();
          return;
        }
        window.requestAnimationFrame(check);
      };

      window.requestAnimationFrame(check);
    });

    video.pause();
    recorder.stop();
    return await finished;
  });
}

async function withVideoFile<T>(file: File, handler: (video: HTMLVideoElement) => Promise<T>) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = objectUrl;
    await waitForVideoEvent(video, "loadedmetadata");
    return await handler(video);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getCropRect(sourceWidth: number, sourceHeight: number, aspectRatio: number, focusY: number) {
  const sourceAspect = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceAspect > aspectRatio) {
    cropWidth = Math.round(sourceHeight * aspectRatio);
    sourceX = Math.max(0, Math.round((sourceWidth - cropWidth) / 2));
  } else if (sourceAspect < aspectRatio) {
    cropHeight = Math.round(sourceWidth / aspectRatio);
    const availableY = Math.max(0, sourceHeight - cropHeight);
    sourceY = Math.round((clamp(focusY, 0, 100) / 100) * availableY);
  }

  return {
    sourceHeight: cropHeight,
    sourceWidth: cropWidth,
    sourceX,
    sourceY,
    targetHeight: cropHeight,
    targetWidth: cropWidth
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    const targetTime = clamp(time, 0, Number.isFinite(video.duration) ? video.duration : time);

    if (Math.abs(video.currentTime - targetTime) < 0.05) {
      resolve();
      return;
    }

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = targetTime;
  });
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: "loadedmetadata") {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not load video metadata."));
    };
    const cleanup = () => {
      video.removeEventListener(eventName, onSuccess);
      video.removeEventListener("error", onError);
    };

    video.addEventListener(eventName, onSuccess);
    video.addEventListener("error", onError);
  });
}
