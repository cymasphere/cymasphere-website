import React from 'react';
import styled from 'styled-components';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

const DemoContainer = styled.div`
  padding: 120px 20px 60px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--text);
  
  span {
    color: var(--primary);
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 800px;
`;

const SpinnerGroup = styled.div`
  margin-bottom: 40px;
`;

const SpinnerTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text);
`;

const CodeBlock = styled.pre`
  background-color: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin-top: 20px;
  
  code {
    color: var(--text);
    font-family: 'Fira Code', monospace;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const Card = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text);
`;

/**
 * Demo page to showcase the LoadingSpinner component
 */
const LoadingDemo = () => {
  return (
    <Layout>
      <DemoContainer>
        <Section>
          <Title>
            Loading <span>Animations</span>
          </Title>
          <Description>
            A showcase of the CYMASPHERE branded loading animations. These can be used throughout the application
            to provide a consistent loading experience.
          </Description>

          <SpinnerGroup>
            <SpinnerTitle>Default Loading Spinner</SpinnerTitle>
            <LoadingSpinner />
            <CodeBlock>
              <code>{`<LoadingSpinner />`}</code>
            </CodeBlock>
          </SpinnerGroup>

          <SpinnerGroup>
            <SpinnerTitle>Different Sizes</SpinnerTitle>
            <GridContainer>
              <Card>
                <CardTitle>Small</CardTitle>
                <LoadingSpinner size="small" text="Loading data..." />
                <CodeBlock>
                  <code>{`<LoadingSpinner size="small" text="Loading data..." />`}</code>
                </CodeBlock>
              </Card>
              
              <Card>
                <CardTitle>Medium (Default)</CardTitle>
                <LoadingSpinner size="medium" text="Processing..." />
                <CodeBlock>
                  <code>{`<LoadingSpinner size="medium" text="Processing..." />`}</code>
                </CodeBlock>
              </Card>
              
              <Card>
                <CardTitle>Large</CardTitle>
                <LoadingSpinner size="large" text="Initializing..." />
                <CodeBlock>
                  <code>{`<LoadingSpinner size="large" text="Initializing..." />`}</code>
                </CodeBlock>
              </Card>
            </GridContainer>
          </SpinnerGroup>

          <SpinnerGroup>
            <SpinnerTitle>Custom Text</SpinnerTitle>
            <LoadingSpinner text="Generating your audio..." />
            <CodeBlock>
              <code>{`<LoadingSpinner text="Generating your audio..." />`}</code>
            </CodeBlock>
          </SpinnerGroup>
        </Section>
      </DemoContainer>
    </Layout>
  );
};

export default LoadingDemo; 