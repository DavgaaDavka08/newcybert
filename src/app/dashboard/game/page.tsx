"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainApp } from "@/components/layout/MainApp";
import { Loading } from "@/components/ui/Loading";

export default function DashboardGamePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return <Loading fullScreen background="#F0F4F8" message="Ачаалж байна…" />;
  }

  if (status !== "authenticated") return null;

  return <MainApp />;
}
