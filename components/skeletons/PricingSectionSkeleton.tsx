import React from "react";
import styled from "styled-components";
import { TextSkeleton, CardSkeleton, ButtonSkeleton } from "@/components/common/LoadingSkeleton";

const PricingSkeletonContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background);
  position: relative;
  overflow: hidden;
`;

const PricingSkeletonContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const PricingTabsSkeleton = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
`;

const TabSkeleton = styled(CardSkeleton)`
  width: 120px;
  height: 40px;
  border-radius: 20px;
  margin: 0 10px;
`;

const PricingCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin: 0 auto;
  max-width: 1200px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PricingCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PriceTagSkeleton = styled(TextSkeleton)`
  margin: 20px 0;
`;

const FeatureListSkeleton = styled.div`
  margin: 20px 0;
  flex: 1;
`;

const PricingSectionSkeleton = () => {
  return (
    <PricingSkeletonContainer>
      <PricingSkeletonContent>
        <TitleContainer>
          {/* Section Title Skeleton */}
          <TextSkeleton lines={1} width="30%" style={{ height: "40px", margin: "0 auto" }} />
          {/* Section Subtitle Skeleton */}
          <TextSkeleton 
            lines={2} 
            width={["70%", "60%"]} 
            style={{ margin: "1.5rem auto 0" }} 
          />
        </TitleContainer>

        <PricingTabsSkeleton>
          <TabSkeleton />
          <TabSkeleton />
        </PricingTabsSkeleton>

        <PricingCardGrid>
          {/* Generate 3 pricing cards */}
          {Array(3).fill(0).map((_, index) => (
            <PricingCard key={index}>
              {/* Plan name */}
              <TextSkeleton lines={1} width="50%" style={{ height: "30px" }} />
              
              {/* Price */}
              <PriceTagSkeleton lines={1} width="70%" style={{ height: "60px" }} />
              
              {/* Description */}
              <TextSkeleton lines={2} width={["90%", "80%"]} />
              
              {/* Features list */}
              <FeatureListSkeleton>
                {Array(5).fill(0).map((_, featureIndex) => (
                  <TextSkeleton 
                    key={featureIndex} 
                    lines={1} 
                    width="90%" 
                    style={{ margin: "10px 0" }} 
                  />
                ))}
              </FeatureListSkeleton>
              
              {/* Button */}
              <ButtonSkeleton width="100%" height="50px" />
            </PricingCard>
          ))}
        </PricingCardGrid>
      </PricingSkeletonContent>
    </PricingSkeletonContainer>
  );
};

export default PricingSectionSkeleton; 