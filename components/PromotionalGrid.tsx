"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card'; // Use Card for structure

interface PromotionalCardProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
  buttonText: string;
  isLarge?: boolean; // For the left card
  badgeText?: string; // For the right cards
  accentColor?: string; // For badges/buttons
}

// Example accent color (Neon Green) - should match header or be passed
const DEFAULT_ACCENT_COLOR = '#39FF14';

const PromoCard: React.FC<PromotionalCardProps> = ({
  title,
  subtitle,
  imageUrl,
  link,
  buttonText,
  isLarge = false,
  badgeText,
  accentColor = DEFAULT_ACCENT_COLOR,
}) => {
  const badgeStyle = {
    backgroundColor: accentColor,
    color: '#000000', // Assuming black text contrasts well
  };

  return (
    <Card className={`relative overflow-hidden group ${isLarge ? 'h-[400px] md:h-[500px] lg:h-[600px]' : 'h-[280px] md:h-[240px] lg:h-[290px]'}`}>
      <Link href={link} className="absolute inset-0 z-10">
        <span className="sr-only">{title}</span>
      </Link>
      <Image
        src={imageUrl || '/placeholder.jpg'} // Use placeholder
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 50vw"}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

      {/* Badge (for right cards) */}
      {badgeText && (
        <Badge
          variant="default"
          className="absolute top-3 left-3 z-20"
          style={badgeStyle}
        >
          {badgeText}
        </Badge>
      )}

      {/* Content */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 text-white">
        <h3 className={`font-bold ${isLarge ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl'} mb-2`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`text-sm md:text-base mb-4 ${isLarge ? '' : 'line-clamp-2'}`}>
            {subtitle}
          </p>
        )}
        <Button
          variant="secondary" // Use secondary for contrast on image
          size={isLarge ? 'lg' : 'default'}
          className="relative z-30 bg-white/90 text-black hover:bg-white"
          asChild
        >
          <Link href={link}>{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};


interface PromotionalGridProps {
  accentColor?: string;
  largeImageUrl?: string | null;
  smallTopImageUrl?: string | null;
  smallBottomImageUrl?: string | null;
}

const PromotionalGrid: React.FC<PromotionalGridProps> = ({
  accentColor = DEFAULT_ACCENT_COLOR,
  largeImageUrl,
  smallTopImageUrl,
  smallBottomImageUrl,
}) => {
  // Placeholder data (links, text) - images will come from props
  const largeCardData = {
    title: "Season's Must-Haves",
    // imageUrl is now a prop
    link: "/store/all/category/featured",
    buttonText: "Shop Now",
  };

  const smallCardTopData = {
    title: "Up to 30% Off",
    subtitle: "Selected styles just added to sale.",
    // imageUrl is now a prop
    link: "/store/all/sales",
    buttonText: "Shop Sale",
    badgeText: "SALE",
  };

   const smallCardBottomData = {
    title: "New Outerwear",
    subtitle: "Ready for cooler weather?",
    // imageUrl is now a prop
    link: "/store/all/category/outerwear",
    buttonText: "Explore Jackets",
    badgeText: "NEW",
  };


  return (
    <section className="py-12 md:py-16 lg:py-20 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column (Large Card) */}
          <div className="md:col-span-1">
            <PromoCard
              {...largeCardData}
              imageUrl={largeImageUrl || "/summer-fashion-banner.jpg"} // Use prop or fallback
              isLarge
              accentColor={accentColor}
            />
          </div>

          {/* Right Column (Stacked Cards) */}
          <div className="md:col-span-1 flex flex-col gap-6 md:gap-8">
            <PromoCard
              {...smallCardTopData}
              imageUrl={smallTopImageUrl || "/placeholder.jpg"} // Use prop or fallback
              accentColor={accentColor}
            />
            <PromoCard
              {...smallCardBottomData}
              imageUrl={smallBottomImageUrl || "/placeholder.jpg"} // Use prop or fallback
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionalGrid;
