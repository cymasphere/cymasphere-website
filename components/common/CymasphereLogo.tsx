import React from "react";
import Link from "next/link";
import styled from "styled-components";
import EnergyBall from "./EnergyBall";

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  text-decoration: none;
  position: relative;
  z-index: 1;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    text-decoration: none;
  }
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  font-size: ${(props) => props.$fontSize || "1.8rem"};
  font-weight: 700;
  margin-left: 6px;
  font-family: "Montserrat", sans-serif;

  .cyma {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .sphere {
    color: white;
    -webkit-text-fill-color: white; /* Force white color even with gradient */
  }
`;

const CymasphereLogo = ({
  size = "40px",
  fontSize = "1.8rem",
  showText = true,
  href,
  onClick,
  className,
}) => {
  const content = (
    <LogoWrapper $clickable={!!href} onClick={onClick}>
      <EnergyBall size={size} />
      {showText && (
        <LogoText $fontSize={fontSize}>
          <span className="cyma">CYMA</span>
          <span className="sphere">SPHERE</span>
        </LogoText>
      )}
    </LogoWrapper>
  );

  return (
    <LogoContainer className={className}>
      {href ? <Link href={href}>{content}</Link> : content}
    </LogoContainer>
  );
};

export default CymasphereLogo;
