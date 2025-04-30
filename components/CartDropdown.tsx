"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingCart, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CartDropdown() {
  const { cartItems, itemCount, totalPrice, removeFromCart } = useCart();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open Cart">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger> {/* PopoverTrigger should close here */}
      <PopoverContent className="w-80 p-0"> {/* Adjust width as needed */}
        <div className="p-4">
          <h4 className="font-medium leading-none">Shopping Cart</h4>
          <p className="text-sm text-muted-foreground">
            {itemCount} item(s) in your cart.
          </p>
        </div>
        <Separator />
        {itemCount > 0 ? (
          <>
            <ScrollArea className="h-[250px] p-4"> {/* Adjust max height */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-start space-x-3">
                    <Image
                      src={item.imageUrl || '/placeholder.svg'}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-grow overflow-hidden">
                      <Link href={`/store/${item.storeId}/product/${item.productId}`} className="text-sm font-medium hover:underline truncate block">
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4 space-y-3">
               <div className="flex justify-between text-sm font-medium">
                 <span>Subtotal:</span>
                 <span>${totalPrice.toFixed(2)}</span>
               </div>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/store/cart">View Cart</Link>
                 </Button>
                 <Button size="sm" className="flex-1" asChild>
                    <Link href="/store/checkout">Checkout</Link>
                 </Button>
               </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Your cart is empty.
          </div>
        )}
      </PopoverContent> {/* PopoverContent should close here */}
    </Popover> // Popover should close here
  );
}
