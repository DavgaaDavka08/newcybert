"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
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
    <div style={{ minHeight: "100vh", fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
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
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontFamily: "inherit",
              padding: "6px 10px",
              borderRadius: 8,
            }}
          >
            <Ic n="chevLeft" size={16} /> Буцах
          </button>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>2025 ЕЭШ сорил</div>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{session?.user?.name?.split(" ")[0]}</div>
      </header>
      <EesPracticeView />
    </div>
  );
}
