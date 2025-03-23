import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Link from 'next/link';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 0 2rem;
  background-color: #121212;
  color: #ffffff;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #6c63ff, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  text-align: center;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
`;

const Button = styled.a`
  background: linear-gradient(90deg, #6c63ff, #4ecdc4);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 30px;
  font-weight: 500;
  font-size: 1rem;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
  }
`;

export default function Fallback() {
  return (
    <>
      <Head>
        <title>CymaSphere - Development Mode</title>
        <meta name="description" content="CymaSphere development fallback page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container>
        <Title>CymaSphere Next.js Integration</Title>
        <Message>
          The Next.js integration is in progress. This fallback page ensures you can still navigate
          even if some components are experiencing rendering issues during development.
        </Message>
        <Link href="/" passHref legacyBehavior>
          <Button>Go to Home</Button>
        </Link>
      </Container>
    </>
  );
} 