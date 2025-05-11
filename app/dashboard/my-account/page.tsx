"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyAccountRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/personal");
  }, [router]);
  return null;
}
