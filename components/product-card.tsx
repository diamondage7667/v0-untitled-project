"use client";

import { useState, useContext } from "react";
import type { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingBag, MoveVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, CartItem } from "@/context/CartContext"; // Import useCart hook and CartItem type

interface ProductCardProps {
  product: Product;
  storeId?: string; // Make storeId optional
  accentColor?: string; // For badge and potentially buttons
  isTrending?: boolean; // Specific prop for the badge
}

// Example accent color (Neon Green) - should match header or be passed
const DEFAULT_ACCENT_COLOR = '#39FF14';

export function ProductCard({
  product,
  storeId,
  accentColor = DEFAULT_ACCENT_COLOR,
  isTrending = false, // Default to false
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const { addToCart } = useCart(); // Use the custom hook

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent link navigation
    e.preventDefault();
    if (product) {
      // Construct the CartItem object
      const itemToAdd: CartItem = {
        productId: product.id,
        // Use storeId if provided, otherwise a default/fallback.
        // Ensure CartContext/logic handles items without a specific storeId if necessary.
        storeId: storeId || "unknown", // Provide a fallback like "unknown" or ""
        title: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1, // Add one item at a time from the card
        // Include selected size if applicable (might need to adjust CartItem type or how size is handled)
        // selectedSize: selectedSize, // This property isn't in the base CartItem type
      };
      addToCart(itemToAdd);
      // Optionally show a toast notification here
      console.log(`Added ${itemToAdd.title} (Size: ${selectedSize || 'N/A'}) to cart`);
    }
  };

  const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
     e.stopPropagation();
     e.preventDefault();
     // TODO: Implement Quick View Modal logic
     console.log(`Quick view for ${product.name}`);
     alert(`Quick view for ${product.name} (Not Implemented)`);
  }

  const badgeStyle = {
    backgroundColor: accentColor,
    color: '#000000', // Assuming black text contrasts well with neon green
  };

  return (
    <div
      className="relative group overflow-hidden rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 bg-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Conditionally construct the link based on storeId presence */}
      <Link href={storeId ? `/store/${storeId}/product/${product.id}` : `/store/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`}>
        <span className="sr-only">View {product.name}</span>
      </Link>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill // Use fill for aspect ratio
          className={cn(
            "object-cover transition-transform duration-300 ease-in-out",
            isHovered ? "scale-105" : "scale-100"
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" // Optimize image loading
        />

        {/* Trending Badge */}
        {isTrending && (
          <Badge
            variant="default" // Use default variant and apply custom style
            className="absolute top-2 left-2 z-20"
            style={badgeStyle}
          >
            Trending
          </Badge>
        )}

        {/* --- Hover Overlay --- */}
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity duration-300 ease-in-out",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none" // Hide when not hovered
          )}
        >
          {/* Drag Handle Indicator (Top Right) */}
           <MoveVertical className="absolute top-2 right-2 h-5 w-5 text-white/50 cursor-grab" />

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 justify-center">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  size="sm"
                  variant={selectedSize === size ? "secondary" : "outline"}
                  className={cn(
                    "h-8 px-2 text-xs border-white/50 text-white hover:bg-white/20",
                    selectedSize === size && "bg-white text-black border-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent link navigation
                    e.preventDefault();
                    setSelectedSize(size);
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 text-black hover:bg-white text-xs h-9 px-3 flex-1"
              onClick={handleQuickView}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="h-4 w-4 mr-1" /> Quick View
            </Button>
            <Button
              variant="default" // Use default, potentially style with accentColor later
              size="sm"
              className="bg-white/90 text-black hover:bg-white text-xs h-9 px-3 flex-1" // Use accentColor here if desired
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to bag`}
              disabled={!selectedSize && product.sizes && product.sizes.length > 0} // Disable if sizes exist but none selected
            >
              <ShoppingBag className="h-4 w-4 mr-1" /> Add to Bag
            </Button>
          </div>
        </div>
      </div>

      {/* --- Default Content (Visible when not hovered) --- */}
      <div className={cn(
          "p-4 transition-opacity duration-300",
          isHovered ? "opacity-0" : "opacity-100"
      )}>
        {/* Added text-foreground for light/dark mode compatibility */}
        <h3 className="text-sm font-medium truncate mb-1 text-foreground">{product.name}</h3>
        <p className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
      </div>
    </div>
  );
}
