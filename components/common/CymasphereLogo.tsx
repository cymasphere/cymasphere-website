import React from "react";
import Link from "next/link";
import styled from "styled-components";
import EnergyBall from "@/components/common/EnergyBall";

interface LogoWrapperProps {
  $clickable?: boolean;
}

interface LogoTextProps {
  $fontSize?: string;
}

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const LogoWrapper = styled.div<LogoWrapperProps>`
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

const LogoText = styled.div<LogoTextProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  font-size: ${(props) => props.$fontSize || "1.8rem"};
  font-weight: 700;
  margin-left: 6px;
  font-family: var(--font-montserrat), -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;

  .cyma {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

interface CymasphereLogoProps {
  size?: string;
  fontSize?: string;
  showText?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

const CymasphereLogo: React.FC<CymasphereLogoProps> = ({
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
          SPHERE
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
