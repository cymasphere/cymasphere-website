"use client";
import React from "react";
import styled from "styled-components";
import NextSEO from "@/components/NextSEO";

// Styled components
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

export default function DashboardPage(): React.JSX.Element {
  return (
    <>
      <NextSEO
        title="Dashboard | Cymasphere"
        description="Access your Cymasphere account dashboard"
        noindex={true}
      />
      <DashboardContainer />
    </>
  );
}
