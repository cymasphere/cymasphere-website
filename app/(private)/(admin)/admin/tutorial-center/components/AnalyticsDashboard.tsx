"use client";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const Title = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: var(--text);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  return (
    <Container className={className}>
      <Title>Your Learning Progress</Title>
      
      <StatsGrid>
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>Videos Watched</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>0m</StatValue>
          <StatLabel>Time Spent</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>0%</StatValue>
          <StatLabel>Completion Rate</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>Learning Streak</StatLabel>
        </StatCard>
      </StatsGrid>
    </Container>
  );
}