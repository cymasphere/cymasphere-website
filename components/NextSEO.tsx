/**
 * @fileoverview SEO and social meta tags for pages using the legacy Head API.
 * @module components/NextSEO
 * @description Default title and copy position Cymasphere as a harmony engine.
 */

import React, { ReactNode } from "react";
import Head from "next/head";

interface NextSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
  noindex?: boolean;
  children?: ReactNode;
}

/**
 * @brief SEO component for Next.js pages using `next/head`.
 * @param props.title Page title (defaults to Harmony Engine suite messaging).
 * @param props.description Meta description for search and OG.
 * @param props.keywords Comma-separated keywords.
 * @returns Head fragment with meta, Open Graph, and Twitter tags.
 */
const NextSEO: React.FC<NextSEOProps> = ({
  title = "Cymasphere — Harmony Engine & Audio/MIDI Creative Suite",
  description =
    "Write better music from harmony out. An intelligent audio/MIDI studio for progressions, voicings, and melody—built from first principles around how music works.",
  keywords =
    "Cymasphere, harmony engine, audio MIDI, creative suite, music theory, chord progression, MIDI composition, voicing, VST3, AU, DAW, composition",
  canonical = "",
  ogType = "website",
  ogImage = "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/meta/og-image.webp",
  twitterCard = "summary_large_image",
  noindex = false,
  children,
}) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="Cymasphere" />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {children}
    </Head>
  );
};

export default NextSEO;
