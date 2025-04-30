"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StoredStoreData, ProductData } from '@/types/store'; // Import updated types
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
// Import more icons for new sections
import { Loader2, ArrowLeft, Save, BarChart, PackagePlus, Palette, Image as ImageIcon, Megaphone, ShoppingCart, Users, FileText, Tag, Truck, CreditCard, UserCog, Settings, PlugZap, Globe } from 'lucide-react';


// --- Placeholder Components for Dashboard Sections ---

const DashboardOverview = ({ storeData }: { storeData: StoredStoreData | null }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><BarChart size={18} /> Dashboard & KPIs</CardTitle>
      <CardDescription>At-a-glance summary and visual analytics (placeholders).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">Real analytics require a backend data source.</p>
      {/* Example Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div><p className="text-xs uppercase text-muted-foreground">Total Visits</p><p className="text-xl font-semibold">1,234</p></div>
        <div><p className="text-xs uppercase text-muted-foreground">Total Sales</p><p className="text-xl font-semibold">$5,678</p></div>
        <div><p className="text-xs uppercase text-muted-foreground">Conversion Rate</p><p className="text-xl font-semibold">2.1%</p></div>
        <div><p className="text-xs uppercase text-muted-foreground">New Customers</p><p className="text-xl font-semibold">56</p></div>
      </div>
       {/* Placeholder for charts */}
       <div className="mt-6 h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Chart Area Placeholder
      </div>
    </CardContent>
  </Card>
);

const OrderManagement = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><ShoppingCart size={18} /> Order Management</CardTitle>
      <CardDescription>View, manage, and fulfill orders (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Order list, filtering, status updates, and fulfillment actions require a backend database and logic.</p>
      <div className="mt-4 h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Order List Placeholder
      </div>
    </CardContent>
  </Card>
);

const InventoryControl = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><PackagePlus size={18} /> Inventory Control</CardTitle> {/* Reusing icon, consider Box or similar */}
      <CardDescription>Track stock levels and manage inventory (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Real-time stock tracking, low-stock alerts, and reorder management need backend integration.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Inventory Placeholder
      </div>
    </CardContent>
  </Card>
);


const CustomerManagement = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Users size={18} /> Customer Management</CardTitle>
      <CardDescription>View customer profiles and order history (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Storing customer data, segmentation, and communication tools require a backend.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Customer List Placeholder
      </div>
    </CardContent>
  </Card>
);

const ReportingAnalytics = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><FileText size={18} /> Reporting & Analytics</CardTitle>
      <CardDescription>Analyze sales, customer, and marketing data (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Generating detailed reports requires processing backend order and traffic data.</p>
       <div className="mt-4 h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Reports Placeholder
      </div>
    </CardContent>
  </Card>
);

const PromotionsMarketing = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Tag size={18} /> Promotions & Marketing</CardTitle>
      <CardDescription>Create discounts and manage marketing campaigns (requires backend logic).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Discount code generation, validation, and campaign tracking need server-side implementation.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Promotions Placeholder
      </div>
    </CardContent>
  </Card>
);

const ShippingFulfillment = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Truck size={18} /> Shipping & Fulfillment</CardTitle>
      <CardDescription>Configure shipping rates and manage fulfillment (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Carrier integration, real-time rates, and label generation require backend services.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Shipping Settings Placeholder
      </div>
    </CardContent>
  </Card>
);

const PaymentsTaxes = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><CreditCard size={18} /> Payments & Taxes</CardTitle>
      <CardDescription>Set up payment gateways and tax rules (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Payment processing and tax calculation require secure backend integrations.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Payments & Tax Placeholder
      </div>
    </CardContent>
  </Card>
);

const UserRolesSecurity = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><UserCog size={18} /> User Roles & Security</CardTitle>
      <CardDescription>Manage admin permissions and security settings (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">User authentication, role management, and audit logs require a backend system.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Users & Security Placeholder
      </div>
    </CardContent>
  </Card>
);

const IntegrationsApi = () => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><PlugZap size={18} /> Integrations & API</CardTitle>
      <CardDescription>Connect third-party apps and manage API access (requires backend).</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">App marketplace integration and API key management require backend infrastructure.</p>
       <div className="mt-4 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
        Integrations Placeholder
      </div>
    </CardContent>
  </Card>
);

const StoreSettingsLocalization = ({ storeData, onUpdate }: { storeData: StoredStoreData | null, onUpdate: (data: Partial<StoredStoreData>) => void }) => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Settings size={18} /> Store Settings & Localization</CardTitle>
      <CardDescription>Manage general store information and regional settings.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
       <div>
         <Label htmlFor="store-name">Store Name</Label>
         <Input id="store-name" value={storeData?.storeName || ''} onChange={(e) => onUpdate({ storeName: e.target.value })} />
       </div>
        <div>
         <Label htmlFor="store-desc">Store Description</Label>
         <Textarea id="store-desc" value={storeData?.storeDescription || ''} onChange={(e) => onUpdate({ storeDescription: e.target.value })} />
       </div>
        <div>
         <Label htmlFor="logo-url">Logo URL</Label>
         <Input id="logo-url" value={storeData?.logoPreviewUrl || ''} onChange={(e) => onUpdate({ logoPreviewUrl: e.target.value || null })} />
          {/* Preview */}
          {storeData?.logoPreviewUrl && (
            <div className="mt-2 border rounded-md p-2 inline-block">
               <img src={storeData.logoPreviewUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
            </div>
          )}
       </div>
       {/* Add placeholders for language/localization if needed */}
       <p className="text-sm text-muted-foreground">Language and localization settings require more complex implementation.</p>
    </CardContent>
  </Card>
);


// --- Product Management Component (Existing, slightly updated) ---
const ProductManagement = ({ storeData, onUpdate }: { storeData: StoredStoreData | null, onUpdate: (data: Partial<StoredStoreData>) => void }) => {
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', imageUrl: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    const priceNumber = parseFloat(newProduct.price);
    if (!newProduct.title || !newProduct.imageUrl || isNaN(priceNumber) || priceNumber < 0) {
      alert("Please provide a valid title, image URL, and non-negative price.");
      return;
    }

    const newProductData: ProductData = {
      // Generate a simple unique ID (consider a more robust method like UUID later)
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: newProduct.title,
      description: newProduct.description,
      price: priceNumber,
      imageUrl: newProduct.imageUrl,
    };

    const updatedProducts = [...(storeData?.products || []), newProductData];
    onUpdate({ products: updatedProducts });

    // Clear form
    setNewProduct({ title: '', description: '', price: '', imageUrl: '' });
  };

  const handleDeleteProduct = (productIdToDelete: string) => {
    if (!storeData) return;
    const updatedProducts = storeData.products.filter(p => p.id !== productIdToDelete);
    onUpdate({ products: updatedProducts });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PackagePlus size={18} /> Product Management</CardTitle>
        <CardDescription>Add and manage products for your store.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Product List */}
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm uppercase text-muted-foreground">Existing Products ({storeData?.products?.length || 0})</h4>
          <ScrollArea className="h-48 border rounded-md p-2">
            {storeData?.products && storeData.products.length > 0 ? (
              <ul className="space-y-2">
                {storeData.products.map(p => (
                  <li key={p.id} className="flex items-center justify-between text-sm p-1 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-2 truncate">
                       <img src={p.imageUrl || '/placeholder.svg'} alt={p.title} className="h-6 w-6 object-cover rounded-sm flex-shrink-0" />
                       <span className="truncate">{p.title}</span>
                       <span className="text-muted-foreground text-xs">(${p.price.toFixed(2)})</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-6 px-1" onClick={() => handleDeleteProduct(p.id!)}>
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
            )}
          </ScrollArea>
        </div>

        <Separator className="my-4" />

        {/* Add Product Form */}
        <div>
          <h4 className="font-medium mb-3">Add New Product</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-title">Title</Label>
              <Input id="new-title" name="title" placeholder="Product Title" value={newProduct.title} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="new-desc">Description</Label>
              <Textarea id="new-desc" name="description" placeholder="Product Description" value={newProduct.description} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-price">Price</Label>
                <Input id="new-price" name="price" type="number" placeholder="9.99" value={newProduct.price} onChange={handleInputChange} min="0" step="0.01" />
              </div>
               <div>
                <Label htmlFor="new-imageUrl">Image URL</Label>
                <Input id="new-imageUrl" name="imageUrl" placeholder="https://..." value={newProduct.imageUrl} onChange={handleInputChange} />
               </div>
            </div>
            <Button size="sm" onClick={handleAddProduct}>Add Product</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Theme Customization Component (Includes Banner & Announcement) ---
const ThemeCustomization = ({ storeData, onUpdate }: { storeData: StoredStoreData | null, onUpdate: (data: Partial<StoredStoreData>) => void }) => (
 <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Palette size={18} /> Appearance & Theme</CardTitle>
      <CardDescription>Customize colors, fonts, layout, banner, and announcements.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
       {/* Theme Options */}
       <div>
         <h4 className="font-medium mb-3 text-sm uppercase text-muted-foreground">Theme Settings</h4>
         <div className="space-y-4">
          <div>
            <Label htmlFor="theme-color">Primary Color</Label>
            <Input
              id="theme-color"
              type="color"
              value={storeData?.themeColor || '#000000'} // Use value for controlled component
              onChange={(e) => onUpdate({ themeColor: e.target.value })}
            />
          </div>
           <div>
            <Label htmlFor="font-style">Font Style</Label>
            <Input
              id="font-style"
              placeholder="e.g., Inter, Roboto"
              value={storeData?.fontStyle || ''} // Use value
              onChange={(e) => onUpdate({ fontStyle: e.target.value })}
             />
          </div>
           <div>
            <Label htmlFor="layout-style">Product Layout</Label>
            <Input
              id="layout-style"
              placeholder="e.g., grid-cols-3"
              value={storeData?.layoutStyle || ''} // Use value
              onChange={(e) => onUpdate({ layoutStyle: e.target.value })}
            />
          </div>
         </div>
       </div>

       <Separator />

        {/* Banner */}
       <div>
          <h4 className="font-medium mb-3 text-sm uppercase text-muted-foreground">Feature Banner</h4>
          <Label htmlFor="banner-url">Banner Image URL</Label>
          <Input
            id="banner-url"
            placeholder="https://..."
            value={storeData?.bannerImageUrl || ''} // Use value
            onChange={(e) => onUpdate({ bannerImageUrl: e.target.value || null })} // Update state, allow null
          />
          {/* Preview */}
          {storeData?.bannerImageUrl && (
            <div className="mt-2 border rounded-md overflow-hidden aspect-video max-w-sm">
               <img src={storeData.bannerImageUrl} alt="Banner preview" className="w-full h-full object-cover" />
            </div>
          )}
          {/* TODO: Add file upload component later */}
       </div>

       <Separator />

        {/* Announcement Bar */}
       <div>
         <h4 className="font-medium mb-3 text-sm uppercase text-muted-foreground">Announcement Bar</h4>
         <Label htmlFor="announcement-text">Announcement Text</Label>
         <Input
           id="announcement-text"
           placeholder="e.g., Free shipping on orders over $50!"
           value={storeData?.announcementText || ''} // Use value
           onChange={(e) => onUpdate({ announcementText: e.target.value })}
         />
       </div>

    </CardContent>
  </Card>
);

// Remove BannerManagement and AnnouncementBar as separate components
// const BannerManagement = ...
// const AnnouncementBar = ...


export default function StoreAdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [storeData, setStoreData] = useState<StoredStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load store data on mount
  useEffect(() => {
    if (!storeId) {
      setError("Store ID not found in URL.");
      setLoading(false);
      return;
    }

    try {
      const dataString = localStorage.getItem(storeId);
      if (!dataString) {
        setError(`No store data found for ID: ${storeId}. Cannot load admin dashboard.`);
        setLoading(false);
        // Optionally redirect or show a specific "not found" state
        // router.push('/create-store'); // Example redirect
        return;
      }
      const parsedData: StoredStoreData = JSON.parse(dataString);
      setStoreData(parsedData);
    } catch (err: any) {
      console.error("Failed to load or parse store data:", err);
      setError(`Failed to load store data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [storeId, router]);

  // Function to update parts of the store data state
  const handleUpdateStoreData = useCallback((updates: Partial<StoredStoreData>) => {
    setStoreData(prevData => {
      if (!prevData) return null;
      return { ...prevData, ...updates };
    });
  }, []);

  // Function to save all changes back to localStorage
  const handleSaveChanges = useCallback(async () => {
    if (!storeId || !storeData) {
      alert("No store data to save.");
      return;
    }
    setIsSaving(true);
    try {
      localStorage.setItem(storeId, JSON.stringify(storeData));
      // Consider adding a success toast/message here
      alert("Changes saved successfully!");
    } catch (err: any) {
      console.error("Failed to save store data:", err);
      alert(`Error saving changes: ${err.message}`);
      // Optionally revert state or handle error more gracefully
    } finally {
      setIsSaving(false);
    }
  }, [storeId, storeData]);

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
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/create-store')} variant="outline" className="mt-4">
           <ArrowLeft size={16} className="mr-2"/> Back to Store Creator
        </Button>
      </div>
    );
  }

  if (!storeData) {
     // This case might be hit if localStorage fails or data is invalid after loading=false
     return (
       <div className="container mx-auto py-12 px-4 max-w-4xl">
         <Alert>
           <AlertTitle>Store Data Not Available</AlertTitle>
           <AlertDescription>Could not load the necessary store data for the dashboard.</AlertDescription>
         </Alert>
          <Button onClick={() => router.push('/create-store')} variant="outline" className="mt-4">
             <ArrowLeft size={16} className="mr-2"/> Back to Store Creator
         </Button>
       </div>
     );
   }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard: {storeData.storeName}</h1>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.push(`/store/${storeId}`)}>
             View Store
           </Button>
           <Button onClick={handleSaveChanges} disabled={isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save Changes
           </Button>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Replace simple grid with Tabs layout */}
      <Tabs defaultValue="dashboard" className="w-full">
        {/* Make TabsList scrollable on smaller screens */}
        <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-6">
           <TabsList className="inline-flex h-auto justify-start w-max p-1">
              <TabsTrigger value="dashboard"><BarChart size={14} className="mr-1.5"/>Dashboard</TabsTrigger>
              <TabsTrigger value="orders"><ShoppingCart size={14} className="mr-1.5"/>Orders</TabsTrigger>
              <TabsTrigger value="products"><PackagePlus size={14} className="mr-1.5"/>Products</TabsTrigger>
              <TabsTrigger value="customers"><Users size={14} className="mr-1.5"/>Customers</TabsTrigger>
              <TabsTrigger value="analytics"><FileText size={14} className="mr-1.5"/>Analytics</TabsTrigger>
              <TabsTrigger value="marketing"><Tag size={14} className="mr-1.5"/>Marketing</TabsTrigger>
              <TabsTrigger value="shipping"><Truck size={14} className="mr-1.5"/>Shipping</TabsTrigger>
              <TabsTrigger value="payments"><CreditCard size={14} className="mr-1.5"/>Payments</TabsTrigger>
              <TabsTrigger value="appearance"><Palette size={14} className="mr-1.5"/>Appearance</TabsTrigger>
              <TabsTrigger value="settings"><Settings size={14} className="mr-1.5"/>Settings</TabsTrigger>
              <TabsTrigger value="integrations"><PlugZap size={14} className="mr-1.5"/>Integrations</TabsTrigger>
              <TabsTrigger value="users"><UserCog size={14} className="mr-1.5"/>Users</TabsTrigger>
           </TabsList>
        </ScrollArea>

        <TabsContent value="dashboard" className="mt-0">
           <DashboardOverview storeData={storeData} />
        </TabsContent>
         <TabsContent value="orders" className="mt-0">
           <OrderManagement />
        </TabsContent>
         <TabsContent value="products" className="mt-0 space-y-6"> {/* Added space-y */}
           <ProductManagement storeData={storeData} onUpdate={handleUpdateStoreData} />
           <InventoryControl /> {/* Add Inventory here? Or separate tab? */}
        </TabsContent>
         <TabsContent value="customers" className="mt-0">
           <CustomerManagement />
        </TabsContent>
         <TabsContent value="analytics" className="mt-0">
           <ReportingAnalytics />
        </TabsContent>
         <TabsContent value="marketing" className="mt-0">
           <PromotionsMarketing />
        </TabsContent>
         <TabsContent value="shipping" className="mt-0">
           <ShippingFulfillment />
        </TabsContent>
         <TabsContent value="payments" className="mt-0">
           <PaymentsTaxes />
        </TabsContent>
         <TabsContent value="appearance" className="mt-0">
           {/* Combined Theme, Banner, Announcement */}
           <ThemeCustomization storeData={storeData} onUpdate={handleUpdateStoreData} />
        </TabsContent>
         <TabsContent value="settings" className="mt-0">
           <StoreSettingsLocalization storeData={storeData} onUpdate={handleUpdateStoreData} />
        </TabsContent>
         <TabsContent value="integrations" className="mt-0">
           <IntegrationsApi />
        </TabsContent>
         <TabsContent value="users" className="mt-0">
           <UserRolesSecurity />
        </TabsContent>
      </Tabs>

      {/* Old Grid Layout - Remove this */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> ... </div> */}
    </div>
  );
}
