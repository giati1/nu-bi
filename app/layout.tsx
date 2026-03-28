import type { ReactNode } from "react";
import type { Metadata } from "next";
import { env } from "@/lib/config/env";
import { ensureDatabase } from "@/lib/db/client";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "NOMI",
  description: "NOMI is a premium AI-ready social platform for identity, feed, shorts, and messaging.",
  applicationName: "NOMI",
  metadataBase: getMetadataBase(),
  openGraph: {
    title: "NOMI",
    description: "NOMI is a premium AI-ready social platform for identity, feed, shorts, and messaging.",
    siteName: "NOMI",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NOMI",
    description: "NOMI is a premium AI-ready social platform for identity, feed, shorts, and messaging."
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureDatabase();

  return (
    <html lang="en">
      <head>
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" name="viewport" />
      </head>
      <body>{children}</body>
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
