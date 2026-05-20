"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainApp } from "@/components/layout/MainApp";

export default function DashboardGamePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") return (
    <div style={{
      minHeight: "100vh", background: "#F0F4F8",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#64748B", fontFamily: "inherit",
    }}>
      Ачаалж байна...
    </div>
  );

  if (status !== "authenticated") return null;

  return <MainApp />;
}
