import React from "react";
import styled from "styled-components";
import { TextSkeleton, CardSkeleton } from "@/components/common/LoadingSkeleton";

const HowItWorksSkeletonContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background-alt);
`;

const HowItWorksSkeletonContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
`;

const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }

  &:nth-child(even) {
    flex-direction: row-reverse;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepImageSkeleton = styled(CardSkeleton)`
  flex: 1;
  min-height: 300px;
  border-radius: 10px;
`;

const StepNumberSkeleton = styled(CardSkeleton)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const HowItWorksSectionSkeleton = () => {
  return (
    <HowItWorksSkeletonContainer>
      <HowItWorksSkeletonContent>
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

        <StepsContainer>
          {/* Step 1 */}
          <StepRow>
            <StepContent>
              <StepNumberSkeleton />
              <TextSkeleton lines={1} width="70%" style={{ height: "30px", marginBottom: "1rem" }} />
              <TextSkeleton lines={3} width={["100%", "95%", "90%"]} />
            </StepContent>
            <StepImageSkeleton />
          </StepRow>

          {/* Step 2 */}
          <StepRow>
            <StepContent>
              <StepNumberSkeleton />
              <TextSkeleton lines={1} width="70%" style={{ height: "30px", marginBottom: "1rem" }} />
              <TextSkeleton lines={3} width={["100%", "95%", "90%"]} />
            </StepContent>
            <StepImageSkeleton />
          </StepRow>

          {/* Step 3 */}
          <StepRow>
            <StepContent>
              <StepNumberSkeleton />
              <TextSkeleton lines={1} width="70%" style={{ height: "30px", marginBottom: "1rem" }} />
              <TextSkeleton lines={3} width={["100%", "95%", "90%"]} />
            </StepContent>
            <StepImageSkeleton />
          </StepRow>
        </StepsContainer>
      </HowItWorksSkeletonContent>
    </HowItWorksSkeletonContainer>
  );
};

export default HowItWorksSectionSkeleton; 