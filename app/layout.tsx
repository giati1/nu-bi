import type { ReactNode } from "react";
import type { Metadata } from "next";
import { PWARegister } from "@/components/pwa-register";
import { env } from "@/lib/config/env";
import { ensureDatabase } from "@/lib/db/client";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "NU-BI",
  description: "NU-BI is a social app for sharing posts, stories, video, and messages.",
  applicationName: "NU-BI",
  manifest: "/manifest.webmanifest",
  metadataBase: getMetadataBase(),
  openGraph: {
    title: "NU-BI",
    description: "NU-BI is a social app for sharing posts, stories, video, and messages.",
    siteName: "NU-BI",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NU-BI",
    description: "NU-BI is a social app for sharing posts, stories, video, and messages."
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureDatabase();

  return (
    <html lang="en" style={{ backgroundColor: "#000000", colorScheme: "dark" }}>
      <head>
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" name="viewport" />
        <meta content="#000000" name="theme-color" />
        <meta content="dark" name="color-scheme" />
      </head>
      <body style={{ backgroundColor: "#000000", color: "#ffffff" }}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

function getMetadataBase() {
  try {
    return new URL(env.appUrl);
  } catch {
    return new URL("http://localhost:8000");
  }
}
