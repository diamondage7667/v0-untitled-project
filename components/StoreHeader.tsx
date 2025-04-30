"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CartDropdown from '@/components/CartDropdown';
import { Button } from '@/components/ui/button';
import { Menu, Search, User, ShoppingCart } from 'lucide-react'; // Added icons

interface StoreHeaderProps {
  storeName: string;
  logoDataUrl: string | null; // Renamed prop
  storeId: string;
  // Using a specific prop for accent color for clarity
  accentColor?: string;
}

// Example accent color (Neon Green) - replace or make dynamic later
const DEFAULT_ACCENT_COLOR = '#39FF14';

export default function StoreHeader({ storeName, logoDataUrl, storeId, accentColor = DEFAULT_ACCENT_COLOR }: StoreHeaderProps) {
  // Apply accent color to background, ensure text contrast is handled (e.g., dark text on light accent)
  // Using inline style for simplicity, could be moved to CSS/Tailwind config
  const headerStyle = {
    backgroundColor: accentColor,
    // Add text color if needed based on accentColor brightness
    // color: determineTextColor(accentColor),
  };

  return (
    // Removed border-b, added custom background color
    <header className="sticky top-0 z-40 w-full" style={headerStyle}>
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side: Menu + Logo */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden"> {/* Hamburger for mobile/tablet */}
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          {logoDataUrl ? (
            <Link href={`/store/${storeId}`} className="flex items-center gap-2 flex-shrink-0">
              <Image
                src={logoDataUrl}
                alt={`${storeName} Logo`}
                width={40} // Adjusted size
                height={40} // Adjusted size
                className="object-contain rounded" // Keep rounded if desired
              />
              {/* Optionally hide store name text if logo is prominent */}
              {/* <span className="font-bold text-lg">{storeName}</span> */}
            </Link>
          ) : (
            <Link href={`/store/${storeId}`} className="font-bold text-lg">
              {storeName}
            </Link>
          )}
          {/* Desktop Navigation Links (Placeholder) */}
          <nav className="hidden lg:flex gap-4 ml-6">
             <Link href={`/store/${storeId}/category/men`} className="text-sm font-medium hover:underline">Men</Link>
             <Link href={`/store/${storeId}/category/women`} className="text-sm font-medium hover:underline">Women</Link>
             <Link href={`/store/${storeId}/category/accessories`} className="text-sm font-medium hover:underline">Accessories</Link>
             <Link href={`/store/${storeId}/sales`} className="text-sm font-medium hover:underline text-red-600">Sale</Link>
          </nav>
        </div>

        {/* Right side: Utility Icons + Admin Link */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Button>
          {/* Using CartDropdown component */}
          <CartDropdown />

          {/* Admin Dashboard Link - consider moving elsewhere or conditional display */}
          {/* <Link href={`/admin/${storeId}/dashboard`} passHref>
            <Button variant="outline" size="sm" className="ml-2">
              Admin
            </Button>
          </Link> */}
        </div>
      </div>
    </header>
  );
}
