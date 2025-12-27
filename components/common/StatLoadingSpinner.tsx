/**
 * @fileoverview StatLoadingSpinner Component
 * @module components/common/StatLoadingSpinner
 * 
 * A small, lightweight loading spinner designed for inline use in statistics
 * and data displays. Uses Framer Motion for smooth rotation animation.
 * 
 * @example
 * // Basic usage
 * <StatLoadingSpinner />
 * 
 * @example
 * // Custom size
 * <StatLoadingSpinner size={24} />
 */

import React from "react";
import { motion } from "framer-motion";

/**
 * @brief Props for StatLoadingSpinner component
 */
interface StatLoadingSpinnerProps {
  /** @param {number} [size=16] - Size of the spinner in pixels */
  size?: number;
}

/**
 * @brief StatLoadingSpinner component
 * 
 * Displays a small rotating spinner suitable for inline use in statistics,
 * tables, or other data displays where space is limited.
 * 
 * @param {StatLoadingSpinnerProps} props - Component props
 * @returns {JSX.Element} The rendered spinner component
 * 
 * @note Uses Framer Motion for smooth 360-degree rotation
 * @note Default size is 16px for minimal visual impact
 * @note Uses primary color from CSS variables
 */
const StatLoadingSpinner: React.FC<StatLoadingSpinnerProps> = ({ size = 16 }) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        border: '2px solid rgba(108, 99, 255, 0.3)', 
        borderTop: '2px solid var(--primary)', 
        borderRadius: '50%',
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    />
  );
};

export default StatLoadingSpinner; 