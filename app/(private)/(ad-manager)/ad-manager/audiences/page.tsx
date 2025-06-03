"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdManagerAudiences() {
  const router = useRouter();

  React.useEffect(() => {
    router.push("/admin/ad-manager/audiences");
  }, [router]);

  return null;
} 