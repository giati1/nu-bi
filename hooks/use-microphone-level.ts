"use client";

import { useEffect, useRef, useState } from "react";

export function useMicrophoneLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setLevel(0);
      return;
    }

    const AudioContextCtor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / Math.max(1, data.length);
      setLevel(Math.min(1, average / 160));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      source.disconnect();
      analyser.disconnect();
      void context.close();
      setLevel(0);
    };
  }, [stream]);

  return level;
}
