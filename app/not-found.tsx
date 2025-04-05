"use client";

import Link from "next/link";
import styled from "styled-components";

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 6rem;
  margin-bottom: 1rem;
  color: var(--primary);
`;

const Subtitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--text);
`;

const Description = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  color: var(--text-secondary);
`;

const HomeButton = styled.a`
  background-color: var(--primary);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background-color: #5852e3;
    transform: translateY(-2px);
    text-decoration: none;
  }
`;

export default function NotFound() {
  return (
    <NotFoundContainer>
      <Title>404</Title>
      <Subtitle>Page Not Found</Subtitle>
      <Description>
        Oops! The page you are looking for might have been removed, had its
        name changed, or is temporarily unavailable.
      </Description>
      <Link href="/" passHref legacyBehavior>
        <HomeButton>Return to Home</HomeButton>
      </Link>
    </NotFoundContainer>
  );
} 