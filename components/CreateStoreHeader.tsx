"use client"

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Import Badge

export default function CreateStoreHeader() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-4xl">
        {/* Maybe add a back button or title if needed */}
         <Link href="/" passHref>
             <Button variant="outline" size="sm">
                 <ArrowLeft size={16} className="mr-2" />
                 Back to Home
             </Button>
         </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Cart icon removed from Create Store header */}
          {/* <nav className="flex items-center space-x-1">
            <Link href="/store/cart" passHref>
              <Button variant="ghost" size="icon" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive" // Or use a different color
                    className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </nav> */}
        </div>
      </div>
    </header>
  );
}
