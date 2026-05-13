"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainApp } from "@/components/layout/MainApp";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role === "admin") router.replace("/admin");
  }, [status, session, router]);

  if (status === "loading") return (
    <div style={{
      minHeight: "100vh", background: "#F0F4F8",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#94A3B8", fontFamily: "Plus Jakarta Sans, sans-serif",
    }}>
      Ачаалж байна...
    </div>
  );

  if (status !== "authenticated") return null;

  return <MainApp />;
}
