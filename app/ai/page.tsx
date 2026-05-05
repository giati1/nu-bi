import { redirect } from "next/navigation";
import { requirePageViewer } from "@/lib/auth/session";

export default async function AIPage() {
  await requirePageViewer("/ai");
  redirect("/ai-tools");
}
