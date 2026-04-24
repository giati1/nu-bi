import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NU-BI",
    short_name: "NU-BI",
    description: "NU-BI is a social app for posts, stories, video, and messages.",
    start_url: "/home",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/icons/nomi-icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/icons/nomi-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
