"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdManagerAnalytics() {
  const router = useRouter();

  React.useEffect(() => {
    router.push("/admin/ad-manager/analytics");
  }, [router]);

  return null;
} 