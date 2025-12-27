/**
 * @fileoverview TableLoadingRow Component
 * @module components/common/TableLoadingRow
 * 
 * A table row component that displays a loading indicator with a message.
 * Designed to span multiple columns in a table while data is being loaded.
 * 
 * @example
 * // In a table with 5 columns
 * <TableLoadingRow colSpan={5} message="Loading data..." />
 */

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
`;

/**
 * @brief Props for TableLoadingRow component
 */
interface TableLoadingRowProps {
  /** @param {number} colSpan - Number of table columns to span */
  colSpan: number;
  /** @param {string} message - Loading message to display */
  message: string;
}

/**
 * @brief TableLoadingRow component
 * 
 * Renders a table row with a loading spinner and message that spans
 * the specified number of columns. Used to indicate loading state in tables.
 * 
 * @param {TableLoadingRowProps} props - Component props
 * @returns {JSX.Element} A table row element with loading indicator
 * 
 * @note Uses Framer Motion for spinner animation
 * @note Spinner is 20px with primary color styling
 * @note Message is displayed next to the spinner
 */
const TableLoadingRow: React.FC<TableLoadingRowProps> = ({ colSpan, message }) => {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
        <EmptyState>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem', 
            color: 'var(--text-secondary)' 
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
              style={{ 
                width: '20px', 
                height: '20px', 
                border: '3px solid rgba(108, 99, 255, 0.3)', 
                borderTop: '3px solid var(--primary)', 
                borderRadius: '50%' 
              }}
            />
            {message}
          </span>
        </EmptyState>
      </td>
    </tr>
  );
};

export default TableLoadingRow; 