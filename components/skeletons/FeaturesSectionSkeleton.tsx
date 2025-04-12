import React from "react";
import styled from "styled-components";
import { TextSkeleton, CardSkeleton } from "@/components/common/LoadingSkeleton";

const FeaturesSkeletonContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background);
`;

const FeaturesSkeletonContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const FeatureIconSkeleton = styled(CardSkeleton)`
  width: 60px;
  height: 60px;
  border-radius: 10px;
  margin-bottom: 1.5rem;
`;

const FeaturesSectionSkeleton = () => {
  return (
    <FeaturesSkeletonContainer>
      <FeaturesSkeletonContent>
        <TitleContainer>
          {/* Section Title Skeleton */}
          <TextSkeleton lines={1} width="40%" style={{ height: "40px", margin: "0 auto" }} />
          {/* Section Subtitle Skeleton */}
          <TextSkeleton 
            lines={2} 
            width={["70%", "60%"]} 
            style={{ margin: "1.5rem auto 0" }} 
          />
        </TitleContainer>

        <FeaturesGrid>
          {/* Generate 6 feature card skeletons */}
          {Array(6).fill(0).map((_, index) => (
            <FeatureCard key={index}>
              <FeatureIconSkeleton />
              <TextSkeleton lines={1} width="60%" style={{ marginBottom: "1rem" }} />
              <TextSkeleton lines={3} width={["100%", "95%", "90%"]} />
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesSkeletonContent>
    </FeaturesSkeletonContainer>
  );
};

export default FeaturesSectionSkeleton; 