import { redirect } from "next/navigation";

/** Legacy route — game lives at /dashboard/game */
export default function LegacyGamePage() {
  redirect("/dashboard/game");
}
