"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdManagerCampaigns() {
  const router = useRouter();

  // Redirect to the existing admin ad manager campaigns page
  React.useEffect(() => {
    router.push("/admin/ad-manager/campaigns");
  }, [router]);

  return null;
} 