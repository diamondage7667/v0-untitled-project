"use client";

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/product-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface NewArrivalsCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  storeId: string;
  accentColor?: string; // Pass down for product card badges
}

// Example accent color (Neon Green) - should match header or be passed
const DEFAULT_ACCENT_COLOR = '#39FF14';

const NewArrivalsCarousel: React.FC<NewArrivalsCarouselProps> = ({
  title,
  subtitle,
  products,
  storeId,
  accentColor = DEFAULT_ACCENT_COLOR,
}) => {
  // Basic category filtering logic (can be expanded)
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Determine which products are "Trending" - simple logic for now (e.g., first few)
  const trendingProductIds = products.slice(0, 3).map(p => p.id);

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Section Title and Subtitle */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Category Filter Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:mx-auto sm:grid-cols-none sm:inline-flex">
            {categories.slice(0, 5).map((category) => ( // Limit tabs shown for simplicity
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Carousel Content (inside a TabsContent for potential future use, though filtering happens outside) */}
          <TabsContent value={selectedCategory} className="mt-6">
             {/* Only render carousel if there are products */}
             {filteredProducts.length > 0 ? (
                <Carousel
                  opts={{
                    align: "start",
                    loop: filteredProducts.length > 4, // Loop if enough items
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {filteredProducts.map((product, index) => (
                      <CarouselItem key={product.id || index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <ProductCard
                          product={product}
                          storeId={storeId}
                          accentColor={accentColor}
                          isTrending={trendingProductIds.includes(product.id)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {filteredProducts.length > 4 && ( // Show controls only if scrollable
                    <>
                      <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden lg:inline-flex" />
                      <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden lg:inline-flex" />
                    </>
                  )}
                </Carousel>
             ) : (
                <p className="text-center text-muted-foreground mt-8">No products found in this category.</p>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default NewArrivalsCarousel;
