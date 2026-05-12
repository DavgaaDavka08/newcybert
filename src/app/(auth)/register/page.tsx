// src/app/(auth)/register/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?register=1");
  }, [router]);
  return <div style={{ minHeight: "100vh", background: "#0D0D15" }} />;
}
