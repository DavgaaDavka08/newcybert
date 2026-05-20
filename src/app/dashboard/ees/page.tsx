"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { T } from "@/styles/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { EesPracticeView } from "@/components/ees/EesPracticeView";

export default function EesPracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.muted,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}
      >
        Ачаалж байна...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 28px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackButton href="/dashboard" label="Буцах" />
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>2025 ЕЭШ сорил</div>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{session?.user?.name?.split(" ")[0]}</div>
      </header>
      <EesPracticeView />
    </div>
  );
}
