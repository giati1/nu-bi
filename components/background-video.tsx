"use client";

type BackgroundVideoProps = {
  src: string;
  poster?: string;
  overlayStyle?: "hero" | "card" | "banner" | "subtle";
  className?: string;
};

export function BackgroundVideo({
  src,
  poster,
  overlayStyle = "card",
  className = ""
}: BackgroundVideoProps) {
  const overlayGradient =
    overlayStyle === "hero"
      ? "linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.55) 48%, rgba(5, 5, 8, 0.96) 100%)"
      : overlayStyle === "banner"
        ? "linear-gradient(90deg, rgba(4, 5, 10, 0.92) 0%, rgba(4, 5, 10, 0.72) 55%, rgba(4, 5, 10, 0.88) 100%)"
        : overlayStyle === "subtle"
          ? "linear-gradient(180deg, rgba(5, 6, 12, 0.65) 0%, rgba(5, 6, 12, 0.88) 100%)"
          : "linear-gradient(180deg, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0.46) 44%, rgba(0, 0, 0, 0.92) 100%)";

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {poster ? (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
          loading="lazy"
        />
      ) : null}
      <video
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{
          background: overlayGradient
        }}
      />
    </div>
  );
}
