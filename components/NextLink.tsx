import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/**
 * A wrapper around Next.js Link component that:
 * 1. Properly handles both internal and external links
 * 2. Prevents cancellation errors by properly handling navigation
 * 3. Provides consistent styling and behavior
 */
interface NextLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  scroll?: boolean;
  target?: string;
  rel?: string;
  title?: string;
  id?: string;
  style?: React.CSSProperties;
  shallow?: boolean;
  prefetch?: boolean;
}

const NextLink: React.FC<NextLinkProps> = ({
  href,
  children,
  className,
  onClick,
  scroll = true,
  ...props
}) => {
  const router = useRouter();
  const isExternal =
    href &&
    (href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:"));

  // Handle link clicks to avoid navigation cancellation issues
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow the parent onClick to run first if it exists
    if (onClick) {
      onClick(e);
    }

    // If the event was prevented by the parent onClick, respect that
    if (e.defaultPrevented) {
      return;
    }

    // For internal links, handle navigation via the router
    if (!isExternal && href) {
      e.preventDefault();

      // Close any open mobile menus or other UI elements
      // This helps prevent rendering cancellations

      // Use router.push for client-side navigation
      router.push(href);
    }
    // For external links, let the browser handle it normally
  };

  // Use a regular anchor tag for external links
  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  // Use Next's Link component for internal navigation
  return (
    <Link
      href={href}
      scroll={scroll}
      {...props}
      className={className}
      onClick={handleClick}>

      {children}

    </Link>
  );
};

export default NextLink;
