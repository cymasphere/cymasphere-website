"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdManagerSettings() {
  const router = useRouter();

  React.useEffect(() => {
    router.push("/admin/ad-manager/settings");
  }, [router]);

  return null;
} 