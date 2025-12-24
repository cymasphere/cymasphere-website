/**
 * @fileoverview Common UI components providing reusable styled components for layout and interactions.
 * @module components/ui/CommonComponents
 */

import styled from "styled-components";

/**
 * @brief A container component with max-width and centered layout.
 * @description Provides a responsive container with a maximum width of 1200px,
 * centered horizontally with automatic margins, and horizontal padding.
 * @example
 * <Container>
 *   <YourContent />
 * </Container>
 */
export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

/**
 * @brief A styled button component with hover and active states.
 * @description Provides a button with consistent styling, including hover
 * and active state animations (translateY effects).
 * @example
 * <Button onClick={handleClick}>Click Me</Button>
 */
export const Button = styled.button`
  display: inline-block;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const CommonComponents = {
  Container,
  Button,
};

export default CommonComponents;
