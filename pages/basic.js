import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Link from 'next/link';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #121212;
  color: #ffffff;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: rgba(18, 18, 24, 0.8);
  backdrop-filter: blur(10px);
`;

const Logo = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(90deg, #6c63ff, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: #6c63ff;
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #6c63ff, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  max-width: 800px;
  margin-bottom: 2.5rem;
  color: rgba(255, 255, 255, 0.8);
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const Button = styled.a`
  background: linear-gradient(90deg, #6c63ff, #4ecdc4);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: 500;
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
  }
`;

const Footer = styled.footer`
  background-color: rgba(18, 18, 24, 0.8);
  padding: 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

export default function BasicPage() {
  return (
    <>
      <Head>
        <title>Cymasphere - Basic Page</title>
        <meta name="description" content="Cymasphere with Next.js integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container>
        <Header>
          <Logo>CYMASPHERE</Logo>
          <Nav>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
            <Link href="/login" passHref legacyBehavior>
              <NavLink>Login</NavLink>
            </Link>
          </Nav>
        </Header>
        
        <Main>
          <Title>Discover Sound in a New Way</Title>
          <Subtitle>
            Experience the perfect blend of visual and auditory creativity with our innovative sound design platform.
          </Subtitle>
          <Button href="#features">Explore Features</Button>
        </Main>
        
        <Footer>
          © {new Date().getFullYear()} Cymasphere. All rights reserved.
        </Footer>
      </Container>
    </>
  );
} 