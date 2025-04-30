"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  headline: string;
  subheadline: string;
  backgroundImageUrl?: string | null; // Allow null for background image URL
  backgroundColor?: string; // Optional background color (used if no image)
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  accentColor?: string; // For the primary button
}

// Example accent color (Neon Green) - should match header or be passed
const DEFAULT_ACCENT_COLOR = '#39FF14';

const HeroBanner: React.FC<HeroBannerProps> = ({
  headline,
  subheadline,
  backgroundImageUrl,
  backgroundColor = 'bg-gray-200 dark:bg-gray-900', // Default fallback color
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
  accentColor = DEFAULT_ACCENT_COLOR,
}) => {
  const backgroundStyle = backgroundImageUrl
    ? { backgroundImage: `url(${backgroundImageUrl})` }
    : {};
  const backgroundClasses = backgroundImageUrl
    ? 'bg-cover bg-center bg-no-repeat'
    : backgroundColor;

  const primaryButtonStyle = {
    backgroundColor: accentColor,
    // Add text color if needed based on accentColor brightness
    // color: determineTextColor(accentColor),
  };

  // Basic contrast for secondary button text on potentially dark backgrounds
  const secondaryButtonClasses = "border-primary text-primary hover:bg-primary/10 dark:border-white dark:text-white dark:hover:bg-white/10";

  return (
    <section
      className={`relative w-full py-24 md:py-32 lg:py-40 ${backgroundClasses}`}
      style={backgroundStyle}
    >
      {/* Optional overlay for better text readability on images */}
      {backgroundImageUrl && <div className="absolute inset-0 bg-black/30"></div>}

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-4">
            {headline}
          </h1>
          <p className="text-lg text-gray-200 sm:text-xl lg:text-2xl mb-8">
            {subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              style={primaryButtonStyle}
              className="text-white hover:opacity-90" // Ensure text is visible
            >
              <a href={primaryCtaLink}>{primaryCtaText}</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={secondaryButtonClasses}
            >
              <a href={secondaryCtaLink}>{secondaryCtaText}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
