import React from "react";
import styled from "styled-components";
import {
  CardSkeleton,
  TextSkeleton,
  ButtonSkeleton,
} from "@/components/common/LoadingSkeleton";

const HeroSkeletonContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 20px 80px;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
`;

const HeroSkeletonContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const VisualizerSkeleton = styled(CardSkeleton)`
  margin-top: 3rem;
  width: 100%;
  max-width: 800px;
  height: 400px;
  border-radius: 12px;
`;

const HeroSectionSkeleton = () => {
  return (
    <HeroSkeletonContainer>
      <HeroSkeletonContent>
        {/* Title Skeleton */}
        <TextSkeleton
          lines={1}
          width="60%"
          style={{ height: "60px", marginBottom: "1.5rem" }}
        />

        {/* Subtitle Skeleton */}
        <TextSkeleton
          lines={2}
          width={["80%", "70%"]}
          style={{ marginBottom: "3rem" }}
        />

        {/* Buttons Skeleton */}
        <ButtonGroup>
          <ButtonSkeleton width="180px" height="45px" />
          <ButtonSkeleton width="180px" height="45px" />
        </ButtonGroup>

        {/* Visualizer Skeleton */}
        <VisualizerSkeleton />
      </HeroSkeletonContent>
    </HeroSkeletonContainer>
  );
};

export default HeroSectionSkeleton;
