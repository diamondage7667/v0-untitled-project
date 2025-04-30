"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useCallback and useRef
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
import { Label } from '@/components/ui/label'; // Import Label
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Added Search, X, Palette, Check icons
import { Loader2, ShoppingCart, ArrowLeft, Eye, Upload, Download, ImageIcon, Plus, Minus, CheckCircle, Search, X, Palette, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { visualizeProduct } from "@/actions/visualize-product";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// --- Types (Ideally shared) ---
type Product = {
  id?: string;
  title: string;
  imageUrl: string;
  description: string;
  price: number;
};

type StoredStoreData = {
  storeName: string;
  storeDescription: string;
  logoPreviewUrl: string | null; // Note: This should ideally be logoDataUrl based on previous changes
  themeColor: string;
  products: Product[];
  containerStyle: "rounded" | "straight";
  layout: string; // Keep layout type simple here
};

// --- Component ---
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [storeData, setStoreData] = useState<StoredStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1); // State for quantity
  // State for embedded visualizer
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Use useRef from React

  // --- New Visualizer State ---
  // Note: Renamed isLoading/error from template to avoid conflict if needed, but reusing isVisualizing/visualizeError here.
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]); // Holds selected Product objects
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // For the product selector dialog
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedProductForColor, setSelectedProductForColor] = useState<string | null>(null); // ID of product being colored
  const [productColors, setProductColors] = useState<Record<string, { hex: string; name: string }>>({}); // Store selected colors {productId: {hex, name}}
  const [uploadedProductImage, setUploadedProductImage] = useState<string | null>(null); // For custom product upload
  const [uploadedProductName, setUploadedProductName] = useState<string>(""); // For custom product upload name

  // Remove the old state for selected IDs as we now use selectedProducts array
  // const [selectedAdditionalProductIds, setSelectedAdditionalProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!storeId || !productId) {
      setError("Store ID or Product ID not found in URL.");
      setLoading(false);
      return;
    }

    try {
      const dataString = localStorage.getItem(storeId);
      if (!dataString) {
        setError(`No store data found for ID: ${storeId}.`);
        setLoading(false);
        return;
      }
      const parsedData: StoredStoreData = JSON.parse(dataString);

       // Assign IDs if missing (consistency with store page)
       // Important: Ensure IDs are stable and match those generated/used on the store page
       parsedData.products = parsedData.products.map((p, index) => ({
          ...p,
          // Use existing ID if present, otherwise generate based on storeId and index
          id: p.id || `prod-${index}-${storeId}`
      }));

      const foundProduct = parsedData.products.find(p => p.id === productId);

      if (!foundProduct) {
        setError(`Product with ID ${productId} not found in store ${storeId}.`);
        setLoading(false);
        return;
      }

      setStoreData(parsedData);
      setProduct(foundProduct);
      // Initialize selectedProducts with the main product
      if (foundProduct) {
        setSelectedProducts([foundProduct]);
      }

    } catch (err: any) {
      console.error("Failed to load or parse data:", err);
      setError(`Failed to load product data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [storeId, productId]);

  // --- Quantity Handlers ---
  const handleQuantityChange = useCallback((value: number) => {
    const newQuantity = Math.max(1, value); // Ensure quantity is at least 1
    setQuantity(newQuantity);
  }, []);

  // --- New Visualizer Helper Functions & Data ---

  // Determine product type for visualization (based on the main product)
  // Note: This assumes products in a store might have different categories,
  // but the visualizer context (clothing vs decor) is based on the primary product.
  // If products *within* a store can have drastically different types needing
  // different visualization contexts, this logic might need refinement.
  const getProductType = (): "clothing" | "decor" | "other" => {
    if (!product) return "other";
    // Assuming Product type has a 'category' field, which is missing in the current type definition.
    // We'll need to add 'category' to the Product type later or adapt this logic.
    // For now, let's default based on common assumptions or add a placeholder category.
    // Placeholder: Assume all products in a store are 'other' for now.
    // TODO: Update Product type and this logic if category is available.
    return "other"; // Placeholder
    // Example if category existed:
    // if (product.category === "apparel" || product.category === "footwear") return "clothing";
    // if (product.category === "home") return "decor";
    // return "other";
  }

  // Helper function to determine product type for *any* product (used in visualizeProduct call)
  const getProductTypeForProduct = (productData: Product): "clothing" | "decor" | "other" => {
    // Same TODO as above regarding the 'category' field.
    // Placeholder logic:
    return "other";
    // Example if category existed:
    // if (productData.category === "apparel" || productData.category === "footwear" || productData.category === "accessories") return "clothing";
    // if (productData.category === "home") return "decor";
    // return "other";
  }


  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedProductImage(reader.result as string);
      const defaultName = file.name.split(".")[0].replace(/[_-]/g, " ");
      setUploadedProductName(defaultName);

      // Create a custom product object (adapt based on local Product type)
      const customProduct: Product = {
        id: `custom-${Date.now()}`,
        title: defaultName, // Use 'title' based on local Product type
        description: "Custom uploaded product",
        price: 0,
        imageUrl: reader.result as string,
        // category: getProductType() === "clothing" ? "apparel" : getProductType() === "decor" ? "home" : "accessories", // Add if category exists
      };

      if (selectedProducts.length < 4) {
        setSelectedProducts(prev => [...prev, customProduct]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorSelect = (productId: string, hex: string, name: string) => {
    setProductColors(prev => ({
      ...prev,
      [productId]: { hex, name },
    }));
    setShowColorPicker(false);
    setSelectedProductForColor(null);
  };

  const addProduct = (productToAdd: Product) => {
    if (selectedProducts.length < 4 && !selectedProducts.some((p) => p.id === productToAdd.id)) {
      setSelectedProducts(prev => [...prev, productToAdd]);
    }
  };

  const removeProduct = (productId: string) => {
    // Prevent removing the main product
    if (productId === product?.id) return;

    setSelectedProducts(prev => prev.filter((p) => p.id !== productId));
    // Also remove color if set
    setProductColors(prev => {
      const newColors = { ...prev };
      delete newColors[productId];
      return newColors;
    });
  };

  const isProductSelected = (productId?: string): boolean => {
     if (!productId) return false;
     return selectedProducts.some((p) => p.id === productId);
  };

  const getColorIndicator = (productId?: string) => {
    if (!productId || !productColors[productId]) return null;
    return (
      <div
        className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-gray-400 dark:border-gray-600 shadow-sm"
        style={{ backgroundColor: productColors[productId].hex }}
        title={`Color: ${productColors[productId].name}`}
      />
    );
  };

  const colorPalette = [
    { hex: "#000000", name: "Black" }, { hex: "#FFFFFF", name: "White" },
    { hex: "#FF0000", name: "Red" }, { hex: "#0000FF", name: "Blue" },
    { hex: "#008000", name: "Green" }, { hex: "#FFFF00", name: "Yellow" },
    { hex: "#FFA500", name: "Orange" }, { hex: "#800080", name: "Purple" },
    { hex: "#FFC0CB", name: "Pink" }, { hex: "#A52A2A", name: "Brown" },
    { hex: "#808080", name: "Gray" }, { hex: "#C0C0C0", name: "Silver" },
    { hex: "#FFD700", name: "Gold" }, { hex: "#00FFFF", name: "Cyan" },
    { hex: "#FF00FF", name: "Magenta" },
  ];

  // Filter products for the selector dialog (use storeData)
  useEffect(() => {
    if (!storeData || !product) {
      setFilteredProducts([]);
      return;
    }
    const currentProductId = product.id;
    const filtered = storeData.products.filter(p =>
        p.id !== currentProductId &&
        (p.title.toLowerCase().includes(searchQuery.toLowerCase())
        // || p.category?.toLowerCase().includes(searchQuery.toLowerCase()) // Add if category exists
        )
    );
    // Add sorting logic here if needed (based on category, etc.)
    setFilteredProducts(filtered);
  }, [searchQuery, storeData, product]);


  // --- Old code to be replaced/removed ---
  // Filter out the current product for the additional selection list
  // const otherProducts = storeData?.products.filter(p => p.id !== productId) || [];


  // --- Visualize Function (Updated with new state) ---
  async function handleVisualize() {
      // Use selectedProducts state instead of selectedAdditionalProductIds
      if (!selectedProducts.length || !storeData) return;

      setIsVisualizing(true);
      setVisualizeError(null);
      setGeneratedImage(null);

      try {
        // Map selected products to the format expected by visualizeProduct action
        const productsToVisualize = selectedProducts.map(p => ({
            id: p.id || `temp-${Math.random()}`, // Handle potential missing ID for custom uploads
            name: p.title,
            imageUrl: p.imageUrl,
            type: getProductTypeForProduct(p), // Use helper function
            color: p.id ? productColors[p.id] : undefined, // Get color if ID exists
        }));

        const result = await visualizeProduct({
          products: productsToVisualize,
          userImage: userImage || undefined,
        });

          if (result.error) {
              throw new Error(result.error);
          }

          setGeneratedImage(result.visualizationUrl);
      } catch (err: any) {
          console.error("Visualization error:", err);
          setVisualizeError(err.message || "Failed to generate visualization");
      } finally {
          setIsVisualizing(false);
      }
  }

  // Handle background file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      // Basic validation (optional)
      const MAX_BG_SIZE = 10 * 1024 * 1024; // 10MB limit for background
      if (file.size > MAX_BG_SIZE) {
          alert(`Background image size exceeds ${MAX_BG_SIZE / 1024 / 1024}MB limit.`);
          if(fileInputRef.current) fileInputRef.current.value = '';
          return;
      }
      if (!file.type.startsWith("image/")) {
           alert("Please select an image file.");
           if(fileInputRef.current) fileInputRef.current.value = '';
           return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setUserImage(reader.result as string);
      };
       reader.onerror = (error) => {
          console.error("Error reading background file:", error);
          alert("Failed to read background image.");
          setUserImage(null);
          if(fileInputRef.current) fileInputRef.current.value = '';
      }
      reader.readAsDataURL(file);
  }

  // Handle download
  function handleDownload() {
      if (!generatedImage) return;
      const a = document.createElement("a");
      a.href = generatedImage;
      a.download = `${product?.title.replace(/\s+/g, "-").toLowerCase() || 'visualization'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  // --- Render Logic ---
   if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Product</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
         <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft size={16} className="mr-2"/> Go Back
         </Button>
      </div>
    );
  }

  if (!product || !storeData) {
     return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Alert>
          <AlertTitle>Product Not Found</AlertTitle>
          <AlertDescription>The requested product could not be loaded.</AlertDescription>
        </Alert>
         <Button onClick={() => router.back()} variant="outline" className="mt-4">
             <ArrowLeft size={16} className="mr-2"/> Go Back
         </Button>
      </div>
    );
  }

  // --- Main Product Render ---
  const { themeColor } = storeData;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl"> {/* Increased max-width */}
       <Button onClick={() => router.push(`/store/${storeId}`)} variant="outline" size="sm" className="mb-6 absolute top-4 left-4 z-10"> {/* Positioned top-left */}
            <ArrowLeft size={16} className="mr-2"/> Back to Store
       </Button>

      {/* New Visual-First Layout: Visualization Area | Controls Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative min-h-[calc(100vh-150px)]"> {/* Adjust min-height as needed */}

        {/* --- Visualization Area (Takes 2/3 on large screens) --- */}
        <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner min-h-[400px] lg:min-h-full">
          {isVisualizing ? (
            <div className="flex flex-col items-center text-center p-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-3" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Generating Visualization...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This might take a moment.</p>
            </div>
          ) : generatedImage ? (
            // Display generated image, potentially overlaid on user image if desired (complex)
            // For now, just show the generated image
            <Image
              src={generatedImage}
              alt="Product Visualization"
              layout="fill" // Use layout fill to cover the area
              objectFit="contain" // 'contain' is usually best for visualizations
              className="p-2" // Add padding if needed
            />
          ) : userImage ? (
             // Show uploaded user image as the background/preview
             <Image
               src={userImage}
               alt="Reference Background"
               layout="fill"
               objectFit="cover" // 'cover' to fill the background area
               className="opacity-80" // Slightly faded to differentiate from final result
             />
          ) : (
            // Placeholder: Show the main product image before upload/generation
            <>
              <Image
                src={product.imageUrl || '/placeholder.svg'} // Use product image URL
                alt={`Placeholder for ${product.title}`}
                layout="fill"
                objectFit="contain" // Contain the product image within the area
                className="p-4 opacity-70" // Add padding and slight opacity
              />
              {/* Optional: Add overlay text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-10 dark:bg-opacity-30 p-4 pointer-events-none">
                 <ImageIcon className="h-12 w-12 mb-3 text-white text-opacity-80" />
                 <p className="text-lg font-medium text-white text-opacity-90 text-center">Visualize {product.title}</p>
                 <p className="text-sm text-white text-opacity-70 text-center">Upload a reference image using the controls</p>
              </div>
            </>
          )}
           {/* Display error within the visualization area */}
           {visualizeError && !isVisualizing && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                    <Alert variant="destructive">
                        <AlertTitle>Visualization Error</AlertTitle>
                        <AlertDescription>{visualizeError}</AlertDescription>
                    </Alert>
                </div>
           )}
           {/* Download button positioned over the image */}
           {generatedImage && !isVisualizing && (
               <Button onClick={handleDownload} variant="secondary" size="sm" className="absolute top-4 right-4 z-10">
                  <Download className="mr-2 h-4 w-4" /> Download
               </Button>
           )}
        </div>

        {/* --- Controls Sidebar (Takes 1/3 on large screens) --- */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">

          {/* Product Info */}
          <Card>
            <CardHeader>
                {/* Display original product image as a small thumbnail */}
                <div className="flex items-center gap-4">
                    <Image
                        src={product.imageUrl || '/placeholder.svg'}
                        alt={product.title}
                        width={64} // Small size
                        height={64}
                        className="h-16 w-16 object-cover rounded-md border"
                    />
                    <div>
                        <CardTitle className="text-2xl">{product.title}</CardTitle>
                        <p className="text-xl font-semibold mt-1" style={{ color: themeColor }}>
                            ${product.price.toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none text-sm">
                 <p>{product.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cart & Quantity */}
           <Card>
             <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quantity" className="text-sm font-medium">Quantity:</Label>
                      <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                    {/* Add to Cart Button */}
                    <Button
                        size="lg"
                        style={{ backgroundColor: themeColor }}
                        className="w-full hover:opacity-90"
                        onClick={() => {
                            if (product.id) {
                                addToCart({
                                    productId: product.id, storeId: storeId, title: product.title,
                                    price: product.price, imageUrl: product.imageUrl, quantity: quantity
                                });
                                alert(`${quantity} x ${product.title} added to cart!`);
                                setQuantity(1);
                            } else {
                                console.error("Product ID is missing, cannot add to cart.");
                                alert("Error: Could not add product to cart.");
                            }
                        }}
                    >
                        <ShoppingCart size={20} className="mr-2"/> Add to Cart
                    </Button>
                </div>
             </CardContent>
           </Card>

           {/* --- NEW Visualization Controls Section --- */}
           <Card className="flex-grow flex flex-col">
             <CardHeader>
               <CardTitle className="text-lg">Visualize {getProductType() === "clothing" ? "on You" : "in Your Space"}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 flex-grow">

               {/* Selected Products & Upload */}
               <div className="space-y-2">
                 <div className="flex justify-between items-center mb-1">
                   <Label className="text-xs uppercase tracking-wider">
                     Products ({selectedProducts.length}/4)
                   </Label>
                   <input
                     type="file"
                     id="product-upload"
                     className="hidden"
                     accept="image/*"
                     onChange={handleProductImageUpload}
                   />
                   <label
                     htmlFor="product-upload"
                     className="text-xs uppercase tracking-wider bg-white dark:bg-gray-900 border border-black dark:border-white px-2 py-1 cursor-pointer flex items-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                   >
                     <Upload className="h-3 w-3 mr-1" />
                     Upload
                   </label>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   {selectedProducts.map((p) => (
                     <div
                       key={p.id || p.imageUrl} // Use imageUrl as fallback key for custom uploads
                       className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 aspect-square flex flex-col justify-between"
                     >
                       <div className="flex-grow flex items-center justify-center overflow-hidden mb-1">
                         <Image
                           src={p.imageUrl || "/placeholder.svg"}
                           alt={p.title}
                           width={60} // Explicit width/height for Image component
                           height={60}
                           className="max-h-full max-w-full object-contain"
                         />
                       </div>
                       <p className="text-[10px] text-center truncate text-black dark:text-white leading-tight">{p.title}</p>
                       {/* Remove button (only if not the main product) */}
                       {p.id !== product.id && (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-0.5 border border-white dark:border-gray-900 h-4 w-4"
                           onClick={() => removeProduct(p.id!)} // Assume custom products have generated IDs
                           title="Remove product"
                         >
                           <X className="h-2.5 w-2.5" />
                         </Button>
                       )}
                       {/* Color picker button */}
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-1 right-1 bg-white dark:bg-gray-800 text-black dark:text-white p-0.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm h-4 w-4"
                         onClick={() => {
                           setSelectedProductForColor(p.id || null); // Handle potential missing ID
                           if (p.id) setShowColorPicker(true);
                         }}
                         title="Change color"
                         disabled={!p.id} // Disable for custom products without persistent ID?
                       >
                         <Palette className="h-2.5 w-2.5" />
                       </Button>
                       {/* Color indicator */}
                       {getColorIndicator(p.id)}
                     </div>
                   ))}
                   {selectedProducts.length < 4 && (
                     <Button
                       variant="outline"
                       className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center hover:border-black dark:hover:border-white transition-colors text-gray-400 hover:text-black dark:hover:text-white h-full"
                       onClick={() => setShowProductSelector(true)}
                     >
                       <Plus className="h-5 w-5 mb-1" />
                       <span className="text-[10px] uppercase tracking-wider text-center">
                         Add Product
                       </span>
                     </Button>
                   )}
                 </div>
               </div>

               {/* Reference Image Upload */}
               <div>
                 <Label className="text-sm font-medium flex items-center gap-2 mb-1">
                   Reference Image
                   {userImage && <CheckCircle className="h-4 w-4 text-green-500" />}
                 </Label>
                 <div
                   className="bg-gray-100 dark:bg-gray-800 min-h-[6rem] h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors relative p-2 rounded-md"
                   onClick={() => fileInputRef.current?.click()}
                 >
                   {userImage ? (
                     <div className="w-full h-full flex items-center justify-center">
                       <Image
                         src={userImage}
                         alt="User uploaded background"
                         width={100} height={75} // Example dimensions
                         className="max-w-full max-h-24 object-contain" // Limit height
                       />
                       <Button
                         variant="ghost" size="icon"
                         className="absolute top-1 right-1 bg-black text-white rounded-full p-0.5 border border-white dark:border-gray-900 h-4 w-4"
                         onClick={(e) => { e.stopPropagation(); setUserImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                         title="Remove background"
                       >
                         <X className="h-2.5 w-2.5" />
                       </Button>
                     </div>
                   ) : (
                     <>
                       <Upload className="h-5 w-5 text-gray-400 mb-1" />
                       <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                         Upload Background
                       </p>
                       <p className="text-[10px] text-gray-400 mt-0.5">Click or drag & drop</p>
                     </>
                   )}
                   <input
                     type="file"
                     ref={fileInputRef}
                     className="hidden"
                     accept="image/*"
                     onChange={handleFileChange}
                   />
                 </div>
               </div>
             </CardContent>
             {/* Generate Button */}
             <div className="p-4 border-t mt-auto">
               <Button
                 onClick={handleVisualize}
                 disabled={isVisualizing || !userImage} // Disable if loading or no user image
                 size="lg"
                 className="w-full"
                 style={{ backgroundColor: userImage ? themeColor : undefined }}
               >
                 {isVisualizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                 {isVisualizing ? 'Generating...' : (userImage ? 'Generate Visualization' : 'Upload Background First')}
               </Button>
             </div>
           </Card>
           {/* --- END NEW Visualization Controls Section --- */}

        </div> {/* End Controls Sidebar */}
      </div> {/* End Main Grid */}

       {/* --- Product Selector Dialog --- */}
       {showProductSelector && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl rounded-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-base uppercase tracking-wider font-medium text-black dark:text-white">
                Select Products ({selectedProducts.length}/4)
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowProductSelector(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Search products in this store..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-black dark:text-white text-sm rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Optional: Add custom product upload within dialog */}
                {/* <div> ... upload button ... </div> */}
              </div>
            </div>

            <ScrollArea className="overflow-y-auto p-4 flex-grow">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const alreadySelected = isProductSelected(p.id);
                  const canAddMore = selectedProducts.length < 4;
                  return (
                    <div
                      key={p.id}
                      className={`relative border rounded-md ${
                        alreadySelected
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 opacity-80"
                          : canAddMore
                            ? "border-gray-200 dark:border-gray-700 cursor-pointer hover:border-black dark:hover:border-white"
                            : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                      } transition-all p-2 text-black dark:text-white aspect-square flex flex-col justify-between`}
                      onClick={() => {
                        if (!alreadySelected && canAddMore) {
                          addProduct(p);
                        } else if (alreadySelected) {
                          // Allow deselecting from dialog
                          removeProduct(p.id!);
                        }
                      }}
                      title={alreadySelected ? `${p.title} (Selected)` : canAddMore ? `Add ${p.title}` : "Maximum products selected"}
                    >
                      {alreadySelected && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white p-0.5 rounded-full border border-white dark:border-gray-900">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <div className="h-20 flex-grow flex items-center justify-center overflow-hidden mb-1">
                        <Image
                          src={p.imageUrl || "/placeholder.svg"}
                          alt={p.title}
                          width={80} height={80} // Example dimensions
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-center font-medium uppercase tracking-wider truncate leading-tight">{p.title}</p>
                      {/* <p className="text-[9px] text-center text-gray-500 dark:text-gray-400 capitalize truncate">{p.category}</p> */}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    No other products found matching your search.
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
              <Button
                className="uppercase tracking-wider text-xs font-medium"
                onClick={() => setShowProductSelector(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Color Picker Modal --- */}
      {showColorPicker && selectedProductForColor && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 max-w-xs w-full shadow-2xl rounded-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">Select Color</h3>
              <Button
                variant="ghost" size="icon"
                onClick={() => { setShowColorPicker(false); setSelectedProductForColor(null); }}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {colorPalette.map((color) => (
                  <Button
                    key={color.hex}
                    variant="outline"
                    size="icon"
                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white p-0"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleColorSelect(selectedProductForColor!, color.hex, color.name)}
                    title={color.name}
                  >
                    {productColors[selectedProductForColor!]?.hex === color.hex && (
                      <Check className={`h-4 w-4 ${color.hex === "#FFFFFF" || color.hex === "#FFFF00" || color.hex === "#C0C0C0" || color.hex === "#FFD700" || color.hex === "#00FFFF" ? "text-black" : "text-white"}`} />
                    )}
                    {color.hex === "#FFFFFF" && <span className="absolute inset-0 border border-gray-300 rounded-full pointer-events-none"></span>}
                  </Button>
                ))}
              </div>

              <div className="mb-4">
                <Label className="block text-xs font-medium text-black dark:text-white mb-1 uppercase tracking-wider">Custom Color</Label>
                <Input
                  type="color"
                  className="w-full h-10 p-0 border border-gray-300 dark:border-gray-700 cursor-pointer rounded-md"
                  value={productColors[selectedProductForColor!]?.hex || "#ffffff"}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const paletteColor = colorPalette.find(c => c.hex.toLowerCase() === hex.toLowerCase());
                    handleColorSelect(selectedProductForColor!, hex, paletteColor ? paletteColor.name : "Custom");
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                className="uppercase tracking-wider text-xs font-medium"
                onClick={() => { setShowColorPicker(false); setSelectedProductForColor(null); }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
