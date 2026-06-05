"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { T } from "@/styles/tokens";
import { EesPracticeView } from "@/components/ees/EesPracticeView";
import { Loading } from "@/components/ui/Loading";
import { SubpageShell } from "@/components/layout/SubpageShell";

export default function EesPracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return <Loading fullScreen background={T.bg} message="Ачаалж байна…" />;
  }

  return (
    <SubpageShell>
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
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>📝 ЕЭШ сорил 2025</div>
          <div style={{ fontSize: 13, color: T.muted }}>{session?.user?.name?.split(" ")[0]}</div>
        </header>
        <EesPracticeView />
      </div>
    </SubpageShell>
  );
}
