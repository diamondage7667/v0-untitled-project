// Type for individual product data within a store
export interface ProductData {
  id: string; // Keep ID optional for creation? No, generate on creation.
  title: string;
  imageUrl: string;
  // imageUrls?: string[]; // Keep single image for now based on usage
  description: string;
  price: number; // Changed to number
  // Add category if needed for visualizer/filtering later
  // category?: string;
}

// Type for the data structure stored in localStorage for each store
export interface StoredStoreData {
  storeName: string;
  storeDescription: string;
  logoDataUrl: string | null; // Use persistent data URL name
  themeColor: string; // From selected theme or custom
  products: ProductData[]; // Use the updated ProductData type
  containerStyle?: "rounded" | "straight"; // Restore this field
  layout?: "list" | "grid-2" | "grid-3" | "grid-4" | "carousel" | "masonry"; // Restore this field with possible values

  // New fields for Admin Dashboard
  announcementText?: string;
  bannerImageUrl?: string | null;
  fontStyle?: string; // e.g., 'inter', 'roboto', 'serif'
  layoutStyle?: string; // e.g., 'grid-cols-3', 'grid-cols-4'
}


// Type for the initial store creation form (might differ slightly from stored data)
export interface StoreFormData {
  storeName: string;
  storeDescription: string;
  logoUrl: string; // This might be temporary for upload, stored as logoPreviewUrl
  // bannerUrl?: string; // Removed, will be handled in dashboard
  theme: string; // Theme name, e.g., 'modern'
  products: ProductData[]; // Use ProductData here too
}


// Existing theme definitions (can be expanded for advanced customization)
export const availableThemes = [
  {
    name: "modern",
    label: "Modern",
    styles: {
      primaryColor: "#3498db",
      secondaryColor: "#e74c3c",
      borderRadius: "0.5rem",
      textGlow: false,
    },
  },
  {
    name: "classic",
    label: "Classic",
    styles: {
      primaryColor: "#2c3e50",
      secondaryColor: "#d35400",
      borderRadius: "0",
      textGlow: false,
    },
  },
  {
    name: "elegant",
    label: "Elegant",
    styles: {
      primaryColor: "#8e44ad",
      secondaryColor: "#f39c12",
      borderRadius: "1rem",
      textGlow: true,
    },
  },
]
