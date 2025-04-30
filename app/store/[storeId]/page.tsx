"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
// Removed unused imports like ShoppingCart, ArrowLeft, Card components, useCart (will be used by ProductCard internally)
import StoreHeader from '@/components/StoreHeader';
import TopNotificationBar from '@/components/TopNotificationBar'; // Import new component
import HeroBanner from '@/components/HeroBanner'; // Import new component
import NewArrivalsCarousel from '@/components/NewArrivalsCarousel'; // Import new component
import PromotionalGrid from '@/components/PromotionalGrid'; // Import new component
import { StoredStoreData, ProductData } from '@/types/store';
import { Product } from '@/types/product';
import { searchPexelsPhotos, PexelsPhoto } from '@/actions/pexels-api'; // Import Pexels actions
import { cn } from "@/lib/utils";

// Removed inline ProductCard component definition

// --- Main Store Page Component ---
export default function StorePage() {
  const params = useParams();
  const router = useRouter(); // Keep router for error navigation
  const storeId = params.storeId as string;

  const [storeData, setStoreData] = useState<StoredStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [productImageMap, setProductImageMap] = useState<Record<string, string>>({}); // Map productId to imageUrl
  const [promoImageUrls, setPromoImageUrls] = useState<{ large: string | null; smallTop: string | null; smallBottom: string | null }>({ large: null, smallTop: null, smallBottom: null });
  const [imagesLoading, setImagesLoading] = useState(false);

  // Load store data from localStorage
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    if (!storeId) {
      setError("Store ID not found in URL.");
      setLoading(false);
      return;
    }

    const loadData = () => {
      setLoading(true); // Ensure loading state is true when reloading
      try {
        const dataString = localStorage.getItem(storeId);
        if (!dataString) {
          setError(`No store data found for ID: ${storeId}. Has it been created or deleted?`);
          setStoreData(null);
          setLoading(false);
          return;
        }
        const parsedData: StoredStoreData = JSON.parse(dataString);

        if (!parsedData.storeName || !parsedData.products) {
           throw new Error("Stored data is incomplete or invalid.");
        }

        // Ensure products have IDs and basic structure
        parsedData.products = parsedData.products?.map((p, index) => ({
            id: p.id || `prod-${index}-${Date.now()}`, // Ensure ID exists
            title: p.title || 'Untitled Product',
            description: p.description || '',
            price: typeof p.price === 'number' ? p.price : 0,
            imageUrl: p.imageUrl || '/placeholder.svg',
        })) || []; // Ensure products is an array

        setStoreData(parsedData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load or parse store data:", err);
        setError(`Failed to load store data: ${err.message}`);
        setStoreData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData(); // Initial load

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storeId || event.key === null) {
        console.log(`Storage change detected for store ${storeId}. Reloading data.`);
        loadData(); // Reload store data on storage change
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false; // Cleanup mount status
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storeId]);

  // Fetch images from Pexels after storeData is loaded
  useEffect(() => {
    if (!storeData || storeData.products.length === 0) return; // Don't fetch if no data or products

    let isMounted = true;
    const fetchImages = async () => {
      if (!isMounted) return;
      setImagesLoading(true);
      console.log("Fetching images from Pexels...");

      try {
        // Fetch Hero Banner Image (use store name or description)
        const heroQuery = storeData.storeDescription || storeData.storeName || 'fashion banner';
        const heroResult = await searchPexelsPhotos(heroQuery, 1, 1, 'landscape');
        if (isMounted && heroResult.photos.length > 0) {
          setHeroImageUrl(heroResult.photos[0].src.large2x || heroResult.photos[0].src.original);
        } else {
           setHeroImageUrl(storeData.bannerImageUrl ?? null); // Fallback to stored banner (ensure null if undefined)
        }

        // Fetch Product Images (one per product, only if original URL is missing/placeholder)
        const productPromises = storeData.products.map(async (product) => {
          const originalImageUrl = product.imageUrl;
          const isPlaceholder = !originalImageUrl || originalImageUrl === '/placeholder.svg';

          if (!isPlaceholder) {
            // Use the original image URL if it exists and isn't a placeholder
            return { id: product.id!, url: originalImageUrl };
          } else {
            // Fetch from Pexels only if original image is missing or placeholder
            const productQuery = product.title || 'product'; // More generic query
            console.log(`Fetching Pexels image for product "${product.title}" (Query: ${productQuery})`);
            const productResult = await searchPexelsPhotos(productQuery, 1, 1, 'portrait');
            if (productResult.photos.length > 0) {
              return { id: product.id!, url: productResult.photos[0].src.large || productResult.photos[0].src.medium };
            }
            // Fallback to placeholder if Pexels fetch also fails
            return { id: product.id!, url: '/placeholder.svg' };
          }
        });
        const productImages = await Promise.all(productPromises);
        if (isMounted) {
          const newImageMap = productImages.reduce((acc, img) => {
            acc[img.id] = img.url;
            return acc;
          }, {} as Record<string, string>);
          setProductImageMap(newImageMap);
        }

        // Fetch Promotional Grid Images
        const promoQueries = ["fashion sale", "new collection", "outerwear"]; // Example queries
        const promoPromises = promoQueries.map(query => searchPexelsPhotos(query, 1, 1));
        const promoResults = await Promise.all(promoPromises);
        if (isMounted) {
          setPromoImageUrls({
            large: promoResults[0]?.photos[0]?.src.large2x || '/summer-fashion-banner.jpg', // Fallback to existing public image
            smallTop: promoResults[1]?.photos[0]?.src.large || '/placeholder.jpg',
            smallBottom: promoResults[2]?.photos[0]?.src.large || '/placeholder.jpg',
          });
        }

      } catch (err) {
        console.error("Failed to fetch images from Pexels:", err);
        // Keep existing/placeholder images on error
        if (isMounted) {
            setHeroImageUrl(storeData.bannerImageUrl ?? null); // Fallback hero (ensure null if undefined)
            setPromoImageUrls({ // Fallback promos
                large: '/summer-fashion-banner.jpg',
                smallTop: '/placeholder.jpg',
                smallBottom: '/placeholder.jpg',
            });
            // Product images will use placeholders defined in mapping if fetch fails
        }
      } finally {
        if (isMounted) setImagesLoading(false);
        console.log("Image fetching complete.");
      }
    };

    fetchImages();

    return () => { isMounted = false; }; // Cleanup mount status

  }, [storeData]); // Re-run when storeData changes


  // --- Render Logic ---
  // Show main loader if store data OR images are loading initially
  if (loading || (imagesLoading && !heroImageUrl && Object.keys(productImageMap).length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" /> {/* Use theme color */}
      </div>
    );
  }

  // Show error if store data failed to load
  if (error || !storeData) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Store</AlertTitle>
          <AlertDescription>{error || "Store data could not be loaded."}</AlertDescription>
        </Alert>
         <Button onClick={() => router.push('/create-store')} className="mt-4">Create or Select a Store</Button>
      </div>
    );
  }

  // --- Main Store Render ---
  const {
    storeName, storeDescription, logoDataUrl, products, // Use logoDataUrl here
    themeColor, containerStyle, layoutStyle,
    announcementText, bannerImageUrl, fontStyle,
    // Extract products separately for mapping
    products: productsData = [], // Default to empty array
  } = storeData;

  // Map ProductData[] to Product[] for NewArrivalsCarousel, using fetched images
  const productsForCarousel: Product[] = productsData.map(pd => ({
      id: pd.id!,
      name: pd.title,
      description: pd.description,
      price: pd.price,
      imageUrl: productImageMap[pd.id!] || pd.imageUrl || '/placeholder.svg', // Use fetched image or fallback
      category: 'Default', // Add default category - TODO: Get from ProductData if available
      sizes: ['S', 'M', 'L'], // Add default sizes - TODO: Get from ProductData if available
      // Add other Product fields with defaults if needed
      badge: undefined, // TODO: Get from ProductData if available
      details: undefined, // TODO: Get from ProductData if available
      colors: undefined, // TODO: Get from ProductData if available
  }));

  // TODO: Apply fontStyle - This usually requires setting up the font in layout.tsx/globals.css
  // and applying a class here, e.g., `font-${fontStyle}` if using Tailwind conventions.
  // For now, it's just retrieved but not applied.
  const accentColor = storeData.themeColor || '#39FF14'; // Use themeColor from storeData or default

  return (
    <div className={`storefront-wrapper ${storeData.fontStyle ? `font-${storeData.fontStyle}` : ''}`}> {/* Apply fontStyle from storeData */}
      {/* Top Notification Bar */}
      {storeData.announcementText && (
        <TopNotificationBar message={storeData.announcementText} />
      )}

      {/* Updated Store Header */}
      <StoreHeader
        storeName={storeData.storeName}
        logoDataUrl={storeData.logoDataUrl} // Pass directly as types should match (string | null)
        storeId={storeId}
        accentColor={accentColor} // Pass accent color
      />

      {/* Hero Banner - Use fetched heroImageUrl */}
      <HeroBanner
        headline={storeData.storeName}
        subheadline={storeData.storeDescription || "Discover our latest collection."}
        backgroundImageUrl={heroImageUrl} // Use fetched image URL
        backgroundColor="bg-gray-800" // Fallback background if no image
        primaryCtaText="Shop All"
        primaryCtaLink={`/store/${storeId}/all`}
        secondaryCtaText="View Sales"
        secondaryCtaLink={`/store/${storeId}/sales`}
        accentColor={accentColor}
      />

      {/* New Arrivals Carousel - productsForCarousel now has fetched images */}
      <NewArrivalsCarousel
        title="New Arrivals"
        subtitle="Check out the latest additions to our collection."
        products={productsForCarousel} // Use mapped products
        storeId={storeId}
        accentColor={accentColor}
      />

      {/* Promotional Grid - Pass fetched image URLs */}
      <PromotionalGrid
         accentColor={accentColor}
         largeImageUrl={promoImageUrls.large}
         smallTopImageUrl={promoImageUrls.smallTop}
         smallBottomImageUrl={promoImageUrls.smallBottom}
      />

      {/* Removed old product grid/list section */}
      {/* Removed old banner image section */}
      {/* Removed old announcement div */}

      {/* Keep Basic Footer */}
       <footer className="mt-16 border-t">
          <div className="container mx-auto py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
             <span>&copy; {new Date().getFullYear()} {storeData.storeName}. Powered by StoreBuilder.</span>
             {/* Pexels Attribution */}
             <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
               Photos provided by Pexels
             </a>
          </div>
       </footer>
    </div>
  );
}
