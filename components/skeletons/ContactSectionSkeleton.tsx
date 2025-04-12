import React from "react";
import styled from "styled-components";
import { TextSkeleton, ButtonSkeleton } from "@/components/common/LoadingSkeleton";

const ContactSkeletonContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background-alt);
  position: relative;
  overflow: hidden;
`;

const ContactSkeletonContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const ContactFlexContainer = styled.div`
  display: flex;
  gap: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ContactInfoSkeleton = styled.div`
  flex: 1;
`;

const ContactFormSkeleton = styled.div`
  flex: 1;
  background-color: var(--card-bg);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FormGroupSkeleton = styled.div`
  margin-bottom: 20px;
`;

const LabelSkeleton = styled(TextSkeleton)`
  margin-bottom: 8px;
`;

const InputSkeleton = styled.div`
  width: 100%;
  height: 45px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
`;

const TextAreaSkeleton = styled.div`
  width: 100%;
  height: 120px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
`;

const ContactSectionSkeleton = () => {
  return (
    <ContactSkeletonContainer>
      <ContactSkeletonContent>
        <TitleContainer>
          {/* Section Title Skeleton */}
          <TextSkeleton lines={1} width="30%" style={{ height: "40px", margin: "0 auto" }} />
        </TitleContainer>

        <ContactFlexContainer>
          <ContactInfoSkeleton>
            <TextSkeleton lines={1} width="80%" style={{ height: "30px", marginBottom: "1.5rem" }} />
            <TextSkeleton lines={3} width={["95%", "90%", "85%"]} style={{ marginBottom: "2rem" }} />
            <TextSkeleton lines={1} width="60%" />
          </ContactInfoSkeleton>
          
          <ContactFormSkeleton>
            <FormGroupSkeleton>
              <LabelSkeleton lines={1} width="20%" style={{ height: "16px" }} />
              <InputSkeleton />
            </FormGroupSkeleton>
            
            <FormGroupSkeleton>
              <LabelSkeleton lines={1} width="20%" style={{ height: "16px" }} />
              <InputSkeleton />
            </FormGroupSkeleton>
            
            <FormGroupSkeleton>
              <LabelSkeleton lines={1} width="20%" style={{ height: "16px" }} />
              <InputSkeleton />
            </FormGroupSkeleton>
            
            <FormGroupSkeleton>
              <LabelSkeleton lines={1} width="20%" style={{ height: "16px" }} />
              <TextAreaSkeleton />
            </FormGroupSkeleton>
            
            <ButtonSkeleton width="100%" height="50px" />
          </ContactFormSkeleton>
        </ContactFlexContainer>
      </ContactSkeletonContent>
    </ContactSkeletonContainer>
  );
};

export default ContactSectionSkeleton; 