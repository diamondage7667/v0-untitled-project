"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
// Corrected import path (removed .ts)
import { products } from "@/data/products"
import { notFound } from "next/navigation"
import { Eye, Upload, Loader2, Download, Check, Search, Plus, X, Palette, ImageIcon } from "lucide-react" // Added ImageIcon
// Corrected import path (removed .ts)
import { visualizeProduct } from "@/actions/visualize-product"
// Corrected import path (removed .ts)
import type { Product } from "@/types/product"
// Corrected import path for Button (assuming it's from ui)
import { Button } from "@/components/ui/button"
// Corrected import path for Input (assuming it's from ui)
import { Input } from "@/components/ui/input"
// Corrected import path for Label (assuming it's from ui)
import { Label } from "@/components/ui/label"
// Corrected import path for Checkbox (assuming it's from ui)
import { Checkbox } from "@/components/ui/checkbox"
// Corrected import path for ScrollArea (assuming it's from ui)
import { ScrollArea } from "@/components/ui/scroll-area"
// Corrected import path for Alert (assuming it's from ui)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Corrected import path for Card (assuming it's from ui)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Corrected import path for Separator (assuming it's from ui)
import { Separator } from "@/components/ui/separator"
// Assuming these components exist at these paths - NOTE: These were not found previously, might cause errors later
// import { ProductGrid } from "@/components/product-grid"
// import { CategoryNav } from "@/components/category-nav"
// import { FeaturedProducts } from "@/components/featured-products"
// import { SearchBar } from "@/components/search-bar"
// import { VisualizerPlugin } from "@/components/visualizer-plugin"


export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Visualization states
  const [userImage, setUserImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [editPrompt, setEditPrompt] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [uploadedProductImage, setUploadedProductImage] = useState<string | null>(null)
  const [uploadedProductName, setUploadedProductName] = useState<string>("")

  // Add these new state variables inside the ProductPage component
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedProductForColor, setSelectedProductForColor] = useState<string | null>(null)
  const [productColors, setProductColors] = useState<Record<string, { hex: string; name: string }>>({})

  if (!product) {
    notFound()
  }

  // Initialize with the current product
  useEffect(() => {
    const currentProduct = products.find((p) => p.id === params.id)
    if (currentProduct) {
      setSelectedProducts([currentProduct])
    }
  }, [params.id])

  // Filter products based on search query and category compatibility
  useEffect(() => {
    let filtered = products.filter(
      (p) =>
        // Don't include the current product in search results
        p.id !== params.id &&
        // Filter by search query
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    // For clothing, prioritize other clothing items
    if (getProductType() === "clothing") {
      filtered = filtered.sort((a, b) => {
        const aIsClothing = a.category === "apparel" || a.category === "footwear" || a.category === "accessories"
        const bIsClothing = b.category === "apparel" || b.category === "footwear" || b.category === "accessories"

        if (aIsClothing && !bIsClothing) return -1
        if (!aIsClothing && bIsClothing) return 1
        return 0
      })
    }

    // For home decor, prioritize other home items
    if (getProductType() === "decor") {
      filtered = filtered.sort((a, b) => {
        const aIsDecor = a.category === "home"
        const bIsDecor = b.category === "home"

        if (aIsDecor && !bIsDecor) return -1
        if (!aIsDecor && bIsDecor) return 1
        return 0
      })
    }

    setFilteredProducts(filtered)
  }, [searchQuery, params.id, product?.category]) // Added product.category dependency

  // Determine product type for visualization
  const getProductType = (): "clothing" | "decor" | "other" => {
    if (!product) return "other"; // Handle case where product might be null initially
    if (product.category === "apparel" || product.category === "footwear") {
      return "clothing"
    } else if (product.category === "home") {
      return "decor"
    } else {
      return "other"
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUserImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedProductImage(reader.result as string)
      // Set a default name based on the file name
      const defaultName = file.name.split(".")[0].replace(/[_-]/g, " ");
      setUploadedProductName(defaultName)

      // Create a custom product from the uploaded image
      const customProduct: Product = {
        id: `custom-${Date.now()}`,
        name: defaultName,
        description: "Custom uploaded product",
        price: 0, // Assuming custom products have no price initially
        category: getProductType() === "clothing" ? "apparel" : getProductType() === "decor" ? "home" : "accessories",
        imageUrl: reader.result as string,
        // Add other required fields from Product type if necessary, e.g., details, badge, colors, sizes
        details: ["Uploaded by user"],
        badge: "Custom",
        colors: [],
        sizes: [],
      }

      // Add the custom product to selected products
      if (selectedProducts.length < 4) {
        setSelectedProducts([...selectedProducts, customProduct])
      }
    }
    reader.readAsDataURL(file)
  }

  // Add this function to handle color selection
  const handleColorSelect = (productId: string, hex: string, name: string) => {
    setProductColors({
      ...productColors,
      [productId]: { hex, name },
    })
    setShowColorPicker(false)
    setSelectedProductForColor(null)
  }

  // Update the handleVisualize function to include color information
  const handleVisualize = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await visualizeProduct({
        products: selectedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          type: getProductTypeForProduct(p.category),
          color: productColors[p.id] || undefined,
        })),
        userImage: userImage || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setGeneratedImage(result.visualizationUrl)
    } catch (err) {
      console.error("Visualization error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate visualization")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleUpdateVisualization function to include color information
  const handleUpdateVisualization = async () => {
    if (!editPrompt.trim() && !userImage) return

    setIsEditing(true)
    setError(null)

    try {
      // Use the existing visualization as the starting point
      const updatedProducts = [...selectedProducts]

      const result = await visualizeProduct({
        products: updatedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          type: getProductTypeForProduct(p.category),
          color: productColors[p.id] || undefined,
        })),
        userImage: userImage || undefined,
        // Include editPrompt if your visualizeProduct action supports it
        // prompt: editPrompt
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setGeneratedImage(result.visualizationUrl)
      setEditPrompt("") // Clear the edit prompt after successful update
    } catch (err) {
      console.error("Visualization update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update visualization")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage || !product) return // Added check for product

    const a = document.createElement("a")
    a.href = generatedImage
    a.download = `${product.name.replace(/\s+/g, "-").toLowerCase()}-visualization.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const addProduct = (productToAdd: Product) => { // Renamed parameter
    if (selectedProducts.length < 4 && !selectedProducts.some((p) => p.id === productToAdd.id)) {
      setSelectedProducts([...selectedProducts, productToAdd])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
    // Also remove color if set
    const newColors = { ...productColors };
    delete newColors[productId];
    setProductColors(newColors);
  }

  // Check if a product is already selected
  const isProductSelected = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId)
  }

  // Helper function to determine product type
  const getProductTypeForProduct = (category: string): "clothing" | "decor" | "other" => {
    if (category === "apparel" || category === "footwear" || category === "accessories") {
      return "clothing"
    } else if (category === "home") {
      return "decor"
    } else {
      return "other"
    }
  }

  // Add this function to get color indicator for a product
  const getColorIndicator = (productId: string) => {
    if (productColors[productId]) {
      return (
        <div
          className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-gray-400 dark:border-gray-600 shadow-sm" // Adjusted size and position
          style={{ backgroundColor: productColors[productId].hex }}
          title={`Color: ${productColors[productId].name}`}
        />
      )
    }
    return null
  }

  // Add this predefined color palette array after the ProductPage function declaration
  const colorPalette = [
    { hex: "#000000", name: "Black" },
    { hex: "#FFFFFF", name: "White" },
    { hex: "#FF0000", name: "Red" },
    { hex: "#0000FF", name: "Blue" },
    { hex: "#008000", name: "Green" },
    { hex: "#FFFF00", name: "Yellow" },
    { hex: "#FFA500", name: "Orange" },
    { hex: "#800080", name: "Purple" },
    { hex: "#FFC0CB", name: "Pink" },
    { hex: "#A52A2A", name: "Brown" },
    { hex: "#808080", name: "Gray" },
    { hex: "#C0C0C0", name: "Silver" },
    { hex: "#FFD700", name: "Gold" },
    { hex: "#00FFFF", name: "Cyan" },
    { hex: "#FF00FF", name: "Magenta" },
  ]

  // Placeholder for cart quantity - replace with actual context/state if available
  const cartItemCount = 0; // Example value

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-gray-900 dark:bg-black text-white dark:text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-normal uppercase tracking-wider">StyleHub</h1>
            <nav className="hidden md:flex space-x-6">
              <a
                href="/store" // Assuming /store is the main store page
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Home
              </a>
              <a
                href="/store#apparel"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Apparel
              </a>
              <a
                href="/store#footwear"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Footwear
              </a>
              <a
                href="/store#accessories"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Accessories
              </a>
              <a
                href="/store#home"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Home
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <button aria-label="Search">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button aria-label="Cart" className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button aria-label="Account">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm text-gray-900 dark:text-white">
            <a
              href="/store" // Link to main store page
              className="hover:underline underline-offset-4 transition uppercase text-xs tracking-wider text-gray-900 dark:text-white"
            >
              Home
            </a>
            <span className="mx-2">/</span>
            <a
              href={`/store#${product.category.toLowerCase()}`} // Link to category section on store page
              className="hover:underline underline-offset-4 transition uppercase text-xs tracking-wider capitalize"
            >
              {product.category}
            </a>
            <span className="mx-2">/</span>
            <span className="text-black dark:text-white uppercase text-xs tracking-wider">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 overflow-hidden aspect-square flex items-center justify-center"> {/* Added aspect-square */}
                <img
                  // Use activeImageIndex if multiple images were supported
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-auto object-contain max-h-full" // Ensure image fits
                />
              </div>
              {/* Thumbnail section - simplified as only one image exists */}
              <div className="grid grid-cols-4 gap-2">
                <button className="bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 border-black dark:border-white"> {/* Highlight the single image */}
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={`${product.name} thumbnail 1`}
                    className="w-full h-24 object-cover"
                  />
                </button>
                {/* Placeholder thumbnails */}
                {[2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square flex items-center justify-center">
                     <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-6">
                {product.badge && (
                  <span className="inline-block px-3 py-1 text-xs uppercase tracking-wider text-white bg-black dark:bg-white dark:text-black mb-2">
                    {product.badge}
                  </span>
                )}
                <h1 className="text-3xl font-normal uppercase tracking-wider mb-2 text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                {/* Placeholder for reviews */}
                <div className="flex items-center mb-2">
                  <div className="flex text-black dark:text-white">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 ml-2 text-sm">(No reviews yet)</span>
                </div>
                <p className="text-2xl font-normal text-black dark:text-white mb-4">${product.price.toFixed(2)}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm leading-relaxed">{product.description}</p>
              </div>

              {/* Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-2">Color</h3>
                  <div className="flex space-x-2 text-gray-900 dark:text-white">
                    {/* Simplified color mapping */}
                    {product.colors.map((color, index) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full ${index === 0 ? "ring-2 ring-offset-2 ring-black dark:ring-white" : "ring-1 ring-gray-300 dark:ring-gray-700"} `}
                        style={{ backgroundColor: color.toLowerCase() }} // Assuming color names are valid CSS colors
                        aria-label={color}
                      ></button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm uppercase tracking-wider text-gray-900 dark:text-white">Size</h3>
                    <a
                      href="#"
                      className="text-sm uppercase tracking-wider text-black dark:text-white hover:underline underline-offset-4"
                    >
                      Size Guide
                    </a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size, index) => (
                      <button
                        key={size}
                        className={`border py-2 text-xs uppercase tracking-wider ${
                          index === 0 // Select first size by default for demo
                            ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black"
                            : "border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visualization Section */}
              <div className="mb-8 border-t border-b border-gray-200 dark:border-gray-700 py-6">
                <h3 className="text-sm uppercase tracking-wider text-black dark:text-white mb-4">
                  Visualize {getProductType() === "clothing" ? "on You" : "in Your Space"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Selected Products */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs uppercase tracking-wider text-black dark:text-white">
                        Products ({selectedProducts.length}/4)
                      </p>
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
                      {selectedProducts.map((p) => ( // Changed variable name
                        <div
                          key={p.id}
                          className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 aspect-square flex flex-col justify-between" // aspect-square
                        >
                          <div className="flex-grow flex items-center justify-center overflow-hidden mb-1">
                            <img
                              src={p.imageUrl || "/placeholder.svg"}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <p className="text-[10px] text-center truncate text-black dark:text-white leading-tight">{p.name}</p>
                          {/* Remove button */}
                          {p.id !== product.id && ( // Can't remove the main product
                             <button
                                className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-0.5 border border-white dark:border-gray-900"
                                onClick={() => removeProduct(p.id)}
                                title="Remove product"
                              >
                                <X className="h-3 w-3" />
                              </button>
                          )}
                          {/* Color picker button */}
                          <button
                            className="absolute top-1 right-1 bg-white dark:bg-gray-800 text-black dark:text-white p-0.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                            onClick={() => {
                              setSelectedProductForColor(p.id)
                              setShowColorPicker(true)
                            }}
                            title="Change color"
                          >
                            <Palette className="h-3 w-3" />
                          </button>
                          {/* Color indicator */}
                          {getColorIndicator(p.id)}
                        </div>
                      ))}

                      {selectedProducts.length < 4 && (
                        <button
                          className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center hover:border-black dark:hover:border-white transition-colors text-gray-400 hover:text-black dark:hover:text-white"
                          onClick={() => setShowProductSelector(true)}
                        >
                          <Plus className="h-5 w-5 mb-1" />
                          <span className="text-[10px] uppercase tracking-wider text-center">
                            Add Product
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Image Upload */}
                  <div
                    className="bg-gray-100 dark:bg-gray-800 min-h-[10rem] h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors relative p-2" // Added padding
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {userImage ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={userImage} // Removed placeholder fallback
                          alt="User uploaded background"
                          className="max-w-full max-h-full object-contain"
                        />
                         <button
                            className="absolute top-1 right-1 bg-black text-white rounded-full p-0.5 border border-white dark:border-gray-900"
                            onClick={(e) => { e.stopPropagation(); setUserImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} // Clear image
                            title="Remove background"
                          >
                            <X className="h-3 w-3" />
                          </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                          {getProductType() === "clothing"
                            ? "Upload photo of yourself"
                            : getProductType() === "decor"
                              ? "Upload photo of room"
                              : "Upload reference image"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">Click or drag & drop</p>
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

                {/* Visualization Result */}
                <div className="bg-gray-100 dark:bg-gray-800 min-h-[16rem] h-64 flex items-center justify-center overflow-hidden mb-4 relative"> {/* Added relative */}
                  {isLoading ? (
                    <div className="flex flex-col items-center text-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white mb-2" />
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Generating visualization...
                      </p>
                    </div>
                  ) : generatedImage ? (
                     <>
                        <img
                          src={generatedImage} // Removed placeholder fallback
                          alt="Visualization result"
                          className="max-w-full max-h-full object-contain"
                        />
                         <button
                            onClick={handleDownload}
                            className="absolute top-2 right-2 px-2 py-1 border border-black dark:border-white bg-white/80 dark:bg-black/80 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center text-black dark:text-white text-xs uppercase tracking-wider"
                            title="Download image"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                     </>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      <Eye className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Visualization will appear here
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">Upload a background image first</p>
                    </div>
                  )}
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-xs mb-4">{error}</div>}

                {/* Generate Button */}
                <button
                  onClick={handleVisualize}
                  disabled={isLoading || !userImage} // Disable if loading or no user image
                  className="w-full bg-black text-white dark:bg-white dark:text-black py-2.5 text-sm uppercase tracking-wider hover:bg-black/80 dark:hover:bg-white/80 transition-colors flex items-center justify-center disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                     <>
                      <Eye className="mr-2 h-4 w-4" />
                      Generate Visualization
                     </>
                  )}
                </button>

              </div>

              {/* Add to Cart */}
              <div className="mb-8">
                 {/* Simplified Quantity - Add state later if needed */}
                 <div className="flex items-center space-x-4 mb-4 text-gray-900 dark:text-white">
                   <div className="flex items-center border border-black dark:border-white">
                     <button className="px-3 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">-</button>
                     <span className="px-4 py-2 text-gray-900 dark:text-white">1</span>
                     <button className="px-3 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
                   </div>
                   <button className="flex-1 bg-black text-white dark:bg-white dark:text-black py-3 px-6 hover:bg-black/80 dark:hover:bg-white/80 transition uppercase tracking-wider text-sm">
                     Add to Cart
                   </button>
                 </div>
                <button className="w-full border border-black dark:border-white text-black dark:text-white py-3 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition uppercase tracking-wider text-sm flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Add to Wishlist
                </button>
              </div>

              {/* Product Details Accordion (Example) */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                 {/* Basic list for now, replace with Accordion component if available */}
                 <h3 className="text-base uppercase tracking-wider text-black dark:text-white mb-3 font-medium">Product Details</h3>
                 <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                   {product.details?.length ? ( // Check if details array exists and has items
                      product.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))
                    ) : (
                      <li>No details available.</li> // Fallback if details is undefined or empty
                    )}
                 </ul>
              </div>

              {/* Shipping Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 text-sm">
                <div className="flex items-center mb-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center">
                   <Check className="h-4 w-4 text-green-600 dark:text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">30-day easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl uppercase tracking-wider font-normal mb-8 text-center text-black dark:text-white">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products
              .filter((p) => p.category === product.category && p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white dark:bg-gray-900 overflow-hidden group shadow-sm border border-gray-200 dark:border-gray-700">
                  <a href={`/store/product/${relatedProduct.id}`} className="block"> {/* Link wrapper */}
                    <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={relatedProduct.imageUrl || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {relatedProduct.badge && (
                        <div className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase tracking-wider px-2 py-0.5">
                          {relatedProduct.badge}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-normal text-black dark:text-white mb-1 uppercase tracking-wider text-sm truncate">{relatedProduct.name}</h3>
                      {/* <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">{relatedProduct.description}</p> */}
                      <span className="font-medium text-black dark:text-white text-sm">${relatedProduct.price.toFixed(2)}</span>
                    </div>
                  </a>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Product Selector Dialog */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-base uppercase tracking-wider font-medium text-black dark:text-white">
                Select Products ({selectedProducts.length}/4)
              </h3>
              <button
                onClick={() => setShowProductSelector(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 flex-shrink-0">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-black dark:text-white text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <input
                    type="file"
                    id="product-selector-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                  />
                  <label
                    htmlFor="product-selector-upload"
                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white cursor-pointer transition-colors uppercase tracking-wider text-xs text-black dark:text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Product
                  </label>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-4 flex-grow">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map((p) => { // Changed variable name
                  const alreadySelected = isProductSelected(p.id)
                  const canAddMore = selectedProducts.length < 4;
                  return (
                    <div
                      key={p.id}
                      className={`relative border ${
                        alreadySelected
                          ? "border-black dark:border-white bg-gray-100 dark:bg-gray-800 opacity-70" // Style selected
                          : canAddMore
                            ? "border-gray-200 dark:border-gray-700 cursor-pointer hover:border-black dark:hover:border-white" // Style available
                            : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed" // Style disabled
                      } transition-all p-2 text-black dark:text-white aspect-square flex flex-col justify-between`}
                      onClick={() => {
                        if (!alreadySelected && canAddMore) {
                          addProduct(p)
                        } else if (alreadySelected) {
                           // Optional: allow deselecting here?
                           // removeProduct(p.id);
                        }
                      }}
                      title={alreadySelected ? `${p.name} (Selected)` : canAddMore ? `Add ${p.name}` : "Maximum products selected"}
                    >
                      {alreadySelected && (
                        <div className="absolute top-1 right-1 bg-black text-white p-0.5 rounded-full border border-white dark:border-gray-900">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <div className="h-20 flex-grow flex items-center justify-center overflow-hidden mb-1">
                        <img
                          src={p.imageUrl || "/placeholder.svg"}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-center font-medium uppercase tracking-wider truncate leading-tight">{p.name}</p>
                      <p className="text-[9px] text-center text-gray-500 dark:text-gray-400 capitalize truncate">
                        {p.category}
                      </p>
                    </div>
                  )
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    No products found matching your search.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
              <button
                className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black uppercase tracking-wider text-xs font-medium"
                onClick={() => setShowProductSelector(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && selectedProductForColor && ( // Ensure selectedProductForColor is not null
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 max-w-xs w-full shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">Select Color</h3>
              <button
                onClick={() => {
                  setShowColorPicker(false)
                  setSelectedProductForColor(null)
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {colorPalette.map((color) => (
                  <button
                    key={color.hex}
                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleColorSelect(selectedProductForColor!, color.hex, color.name)}
                    title={color.name}
                  >
                    {productColors[selectedProductForColor!]?.hex === color.hex && (
                      <Check
                        className={`h-4 w-4 ${color.hex === "#FFFFFF" || color.hex === "#FFFF00" ? "text-black" : "text-white"}`}
                      />
                    )}
                     {/* Add inner border for white color */}
                     {color.hex === "#FFFFFF" && <span className="absolute inset-0 border border-gray-300 rounded-full"></span>}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-black dark:text-white mb-1 uppercase tracking-wider">Custom Color</label>
                <input
                  type="color"
                  className="w-full h-10 p-0 border border-gray-300 dark:border-gray-700 cursor-pointer" // Basic styling for color input
                  value={productColors[selectedProductForColor!]?.hex || "#ffffff"} // Default to white
                  onChange={(e) => {
                    const hex = e.target.value
                    // Find name or use hex if not in palette
                    const paletteColor = colorPalette.find(c => c.hex.toLowerCase() === hex.toLowerCase());
                    handleColorSelect(selectedProductForColor!, hex, paletteColor ? paletteColor.name : "Custom")
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black uppercase tracking-wider text-xs font-medium"
                onClick={() => {
                  setShowColorPicker(false)
                  setSelectedProductForColor(null)
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl uppercase tracking-wider font-normal mb-4">StyleHub</h3>
              <p className="text-gray-400 text-sm">Your one-stop shop for fashion, accessories, and home decor.</p>
            </div>
            <div>
              <h4 className="uppercase tracking-wider font-normal mb-4 text-sm">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/store#apparel" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Apparel
                  </a>
                </li>
                <li>
                  <a href="/store#footwear" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Footwear
                  </a>
                </li>
                <li>
                  <a href="/store#accessories" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Accessories
                  </a>
                </li>
                <li>
                  <a href="/store#home" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Home
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="uppercase tracking-wider font-normal mb-4 text-sm">Customer Service</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Shipping
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition uppercase tracking-wider text-xs">
                    Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="uppercase tracking-wider font-normal mb-4 text-sm">Stay Connected</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 StyleHub Visualizer. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
