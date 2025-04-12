"use client";
import React from "react";
import styled from "styled-components";
import { motion, MotionProps } from "framer-motion";

// Base styled component without motion props
const CardBase = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

// Wrapper component that handles motion props
const AnimatedCard: React.FC<React.PropsWithChildren<MotionProps>> = ({
  children,
  ...motionProps
}) => {
  return (
    <motion.div {...motionProps}>
      <CardBase>{children}</CardBase>
    </motion.div>
  );
};

// Usage example for settings page:
// <AnimatedCard
//   initial={{ opacity: 0, y: 20 }}
//   animate={{ opacity: 1, y: 0 }}
//   transition={{ duration: 0.4 }}
// >
//   <CardTitle>...</CardTitle>
//   <CardContent>...</CardContent>
// </AnimatedCard>

export default AnimatedCard;
