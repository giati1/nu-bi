import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanionStudio } from "@/components/companion-studio";
import { requirePageViewer } from "@/lib/auth/session";

export const metadata = { title: "Companion Studio | NOMI" };

export default async function CompanionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requirePageViewer("/companions");
  return (
    <AppShell
      title="Companion Studio"
      subtitle="Create a fictional adult AI companion and keep your conversations private. Local prototype."
    >
      <CompanionStudio />
    </AppShell>
  );
}
