import React from "react";
import styled from "styled-components";
import { TextSkeleton, CardSkeleton } from "@/components/common/LoadingSkeleton";

const FAQSkeletonContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background);
  position: relative;
  overflow: hidden;
`;

const FAQSkeletonContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const FAQItemSkeleton = styled.div`
  background-color: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FAQHeaderSkeleton = styled.div`
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToggleSkeleton = styled(CardSkeleton)`
  width: 24px;
  height: 24px;
  border-radius: 4px;
`;

const FAQSectionSkeleton = () => {
  return (
    <FAQSkeletonContainer>
      <FAQSkeletonContent>
        <TitleContainer>
          {/* Section Title Skeleton */}
          <TextSkeleton lines={1} width="50%" style={{ height: "40px", margin: "0 auto" }} />
        </TitleContainer>

        {/* Generate 6 FAQ item skeletons */}
        {Array(6).fill(0).map((_, index) => (
          <FAQItemSkeleton key={index}>
            <FAQHeaderSkeleton>
              <TextSkeleton lines={1} width="70%" />
              <ToggleSkeleton />
            </FAQHeaderSkeleton>
          </FAQItemSkeleton>
        ))}
      </FAQSkeletonContent>
    </FAQSkeletonContainer>
  );
};

export default FAQSectionSkeleton; 