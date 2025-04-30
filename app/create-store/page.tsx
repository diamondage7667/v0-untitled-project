"use client"

import React, { useState, type ChangeEvent, useEffect } from "react"
import { useForm, useFieldArray, type SubmitHandler, type FieldArrayWithId } from "react-hook-form"
import Papa from "papaparse"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, UploadCloud, X, Palette, LayoutGrid, Info, ImageIcon, Plus } from "lucide-react" // Added ImageIcon, Plus
import CreateStoreHeader from '@/components/CreateStoreHeader'; // Import the header

// --- Validation Schema ---
const productSchema = z.object({
  id: z.string().optional(), // Keep track of existing items if needed, useful for field array keys
  title: z.string().min(1, "Product title is required."),
  imageUrl: z.string().url("Please enter a valid image URL.").or(z.string().startsWith("data:image/", "Invalid image data URL")), // Allow data URLs from upload
  description: z.string().min(1, "Product description is required."),
  price: z.preprocess(
    (val: unknown) => (val === "" ? undefined : Number(val)), // Add type for val
    z.number({ required_error: "Price is required.", invalid_type_error: "Price must be a number." })
     .positive("Price must be positive.")
  ),
});

// Define a specific type for the logo file input for better validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const logoFileSchema = z.instanceof(FileList)
  .refine((files: FileList | null | undefined) => {
      // If files exist (FileList), ensure it's not empty. Pass if null/undefined.
      return !files || files.length > 0;
  }, { message: "Please select a logo file if you started choosing one." })
  .refine((files: FileList | null | undefined) => {
    // Check size only if a file is actually present
    return !files?.[0] || files[0].size <= MAX_FILE_SIZE;
  }, `Max file size is 5MB.`)
  .refine((files: FileList | null | undefined) => {
    // Check type only if a file is actually present
    // Added check for files[0] existence before accessing type
    return !files?.[0] || (files[0].type && ACCEPTED_IMAGE_TYPES.includes(files[0].type));
  }, ".jpg, .jpeg, .png, .webp and .gif files are accepted.")
  .optional().nullable(); // Make the field optional overall

const createStoreSchema = z.object({
  storeName: z.string().min(1, "Store name is required."),
  storeDescription: z.string().min(1, "Store description is required."),
  logoFile: logoFileSchema, // Use the refined schema
  themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format."),
  products: z.array(productSchema).min(1, "Please add at least one product."),
  containerStyle: z.enum(["rounded", "straight"]),
  layout: z.enum(["list", "grid-2", "grid-3", "grid-4", "carousel", "masonry"]),
})

type FormValues = z.infer<typeof createStoreSchema>
type Product = z.infer<typeof productSchema>

// --- Component ---
export default function CreateStorePage() {
  // Remove step state - const [step, setStep] = useState(1)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null) // For immediate preview
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null); // For persistent storage

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger, // To manually trigger validation
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      logoFile: null,
      products: [],
      containerStyle: "rounded",
      layout: "grid-3",
      themeColor: "#3b82f6",
    },
    mode: "onChange", // Re-validate on change
  })

  const { fields, append, remove, replace } = useFieldArray({
    name: "products",
    control,
  })

  // Watch logo file changes for preview and data URL generation
  const watchedLogoFile = watch("logoFile")
  useEffect(() => {
    let objectUrl: string | null = null;
    let fileReader: FileReader | null = null;
    const currentFile = watchedLogoFile?.[0];

    if (currentFile) {
      // Create object URL for immediate preview
      objectUrl = URL.createObjectURL(currentFile);
      setLogoPreviewUrl(objectUrl);

      // Read file as Data URL for storage
      fileReader = new FileReader();
      fileReader.onload = (event) => {
        setLogoDataUrl(event.target?.result as string);
      };
      fileReader.onerror = (error) => {
          console.error("Error reading logo file as Data URL:", error);
          setLogoDataUrl(null); // Clear on error
          setLogoPreviewUrl(null); // Also clear preview on read error
      }
      fileReader.readAsDataURL(currentFile);

    } else {
      // Clear both URLs if no file is selected
      setLogoPreviewUrl(null);
      setLogoDataUrl(null);
    }

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      // No need to abort FileReader, it's synchronous after readAsDataURL call returns
    };
  }, [watchedLogoFile]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)

    // Convert logo FileList to something serializable if needed, or handle upload separately
    // For now, just logging the data including the FileList
    console.log("FINAL PAYLOAD (excluding logo file details):", { ...data, logoFile: data.logoFile ? `${data.logoFile.length} file(s)` : 'None' });

    // --- Simulation using localStorage ---
    // TODO: Replace this block with actual backend API calls
    // TODO: Implement proper file upload for the logo instead of saving preview URL
    try {
      // 1. Generate a unique-ish ID for the store (replace with backend ID generation)
      const storeId = `store-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 2. Prepare data for localStorage (excluding the FileList and adding stable product IDs)
      const productsWithIds = data.products.map((p, index) => ({
        ...p,
        id: p.id || `prod-${index}-${storeId}` // Generate ID based on index and storeId for stability
      }));

      const storeDataToSave = {
        ...data,
        products: productsWithIds, // Save products with generated IDs
        logoFile: null, // Don't save the FileList itself
        logoDataUrl: logoDataUrl, // Save the persistent data URL
      };

      // 3. Save to localStorage (replace with API call)
      localStorage.setItem(storeId, JSON.stringify(storeDataToSave));
      console.log(`Store data saved to localStorage with key: ${storeId}`);

      // 4. Redirect to the new store page (should happen after successful API response)
      router.push(`/store/${storeId}`);

      // --- Original API call simulation (commented out) ---
      // await new Promise(resolve => setTimeout(resolve, 1500));
      // console.log("Simulating store creation with:", data);
      // const response = await fetch("/api/stores", {
      //   method: "POST",
      //   body: JSON.stringify(data), // Note: FileList won't serialize directly
      //   headers: { "Content-Type": "application/json" },
      // });
      // if (!response.ok) {
      //   const result = await response.json().catch(() => ({ message: "Failed to create store." }));
      //   throw new Error(result.message || "Failed to create store.");
      // }
      // const result = await response.json();
      // router.push(`/store/${result.storeId}`);

    } catch (error: any) {
      console.error("Error saving store data or redirecting:", error)
      setSubmitError(error.message || "An unexpected error occurred during submission.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- CSV & Image Handling ---
  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Partial<Product>>(file, { // Use Partial<Product> as CSV might miss columns
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const productsFromCsv = results.data
          .map((row) => ({
            // Provide defaults or handle missing data gracefully
            title: row.title || "",
            imageUrl: row.imageUrl || "",
            description: row.description || "",
            price: row.price !== undefined ? Number(row.price) : "", // Keep as string if invalid/missing
          }))
          .filter(
            (p) => p.title || p.imageUrl || p.description || p.price // Filter out completely empty rows
          );

        // Validate each product before replacing
        const validatedProducts: Product[] = [];
        let csvError = false;
        productsFromCsv.forEach((p, i) => {
            const parsed = productSchema.safeParse(p);
            if (parsed.success) {
                validatedProducts.push(parsed.data);
            } else {
                console.warn(`CSV Row ${i+1} validation failed:`, parsed.error.flatten().fieldErrors);
                // Optionally add placeholder or skip row
                 validatedProducts.push({ // Add with errors marked or default values
                    ...p, // Keep original data
                    title: p.title || `INVALID ROW ${i+1}`, // Mark invalid rows
                    price: 0, // Default price
                 });
                 csvError = true;
            }
        });

        replace(validatedProducts); // Replace form array with validated data
        if (csvError) {
             setSubmitError("Some rows in the CSV had validation errors and were added with defaults or marked. Please review.");
        } else {
            setSubmitError(null); // Clear previous errors
        }
        // Reset file input
        if (e.target) e.target.value = "";
      },
      error: (error: Error) => {
        console.error("Error parsing CSV:", error);
        setSubmitError(`Error parsing CSV: ${error.message}`);
        if (e.target) e.target.value = "";
      },
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Validate file size/type here before reading
    if (file.size > MAX_FILE_SIZE) {
        alert(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
        e.target.value = ""; // Reset file input
        return;
    }
     if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert(`Invalid file type. Only ${ACCEPTED_IMAGE_TYPES.join(', ')} are accepted.`);
        e.target.value = ""; // Reset file input
        return;
    }


    const reader = new FileReader();
    reader.onloadend = () => {
      // Set the imageUrl field for the specific product index to the data URL
      setValue(`products.${index}.imageUrl`, reader.result as string, { shouldValidate: true });
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Failed to read image file.");
    }
    reader.readAsDataURL(file);

    // Reset file input value so the same file can be selected again if needed
    e.target.value = "";
  };


  // --- AI Generation ---
  const generateDescription = async () => {
    const storeName = watch("storeName");
    if (!storeName) {
        alert("Please enter a store name first.");
        return;
    }
    setIsGeneratingDescription(true);
    try {
      // TODO: Replace placeholder simulation with actual API call to /api/generate-description
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const generatedDesc = `Welcome to ${storeName}! Discover our amazing collection of curated items. We offer the best quality and style.`;
      setValue("storeDescription", generatedDesc, { shouldValidate: true });
      // Example API call structure:
      // const res = await fetch("/api/generate-description", { method: "POST", body: JSON.stringify({ prompt: storeName }), headers: { "Content-Type": "application/json" } });
      // if (!res.ok) throw new Error("AI description generation failed");
      // const json = await res.json();
      // setValue("storeDescription", json.text, { shouldValidate: true });
    } catch (error) {
      console.error("Error generating description:", error);
      setValue("storeDescription", `Failed to generate description for ${storeName}. Please write one manually.`, { shouldValidate: true });
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  const generateLogo = async () => {
     const storeName = watch("storeName");
    if (!storeName) {
        alert("Please enter a store name first.");
        return;
    }
    setIsGeneratingLogo(true);
    try {
       // TODO: Replace placeholder simulation with actual API call to /api/generate-logo
       await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
       // Create a dummy PNG blob as placeholder
       const canvas = document.createElement('canvas');
       canvas.width = 100;
       canvas.height = 100;
       const ctx = canvas.getContext('2d');
       if (ctx) {
         ctx.fillStyle = '#'+(Math.random()*0xFFFFFF<<0).toString(16); // Random color
         ctx.fillRect(0, 0, 100, 100);
         ctx.fillStyle = 'white';
         ctx.font = '12px Arial';
         ctx.fillText(storeName.substring(0, 10), 10, 50); // Add text
       }
       const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

       if (!blob) throw new Error("Failed to create placeholder logo blob");

       const file = new File([blob], "logo.png", { type: blob.type });
       const dataTransfer = new DataTransfer();
       dataTransfer.items.add(file);
       setValue("logoFile", dataTransfer.files, { shouldValidate: true });

      // Example API call structure:
      // const res = await fetch("/api/generate-logo", { method: "POST", body: JSON.stringify({ prompt: storeName }), headers: { "Content-Type": "application/json" } });
      // if (!res.ok) throw new Error("AI logo generation failed");
      // const blob = await res.blob();
      // const file = new File([blob], "logo.png", { type: blob.type });
      // const dataTransfer = new DataTransfer();
      // dataTransfer.items.add(file);
      // setValue("logoFile", dataTransfer.files, { shouldValidate: true });
    } catch (error) {
      console.error("Error generating logo:", error);
      // TODO: Improve error feedback (e.g., use toast notifications)
      alert("Failed to generate logo."); // Simple alert for now
    } finally {
      setIsGeneratingLogo(false);
    }
  }

  // --- Step Navigation Removed ---
  // const nextStep = ...
  // const prevStep = ...

  // --- Render ---
  return (
    <> {/* Wrap with Fragment */}
      <CreateStoreHeader />
      {/* Use a wider container and more padding */}
      <div className="container mx-auto py-10 px-4 md:px-8 lg:px-16 max-w-6xl">
         {/* Removed Step Indicator */}
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

           {/* --- Section 1: Store Details --- */}
           <Card>
             <CardHeader>
               <CardTitle>Store Details</CardTitle>
               <CardDescription>Tell us about your new store.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                {/* Store Name */}
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    {...register("storeName")}
                    placeholder="e.g., My Awesome Gadgets"
                    className={errors.storeName ? "border-red-500" : ""}
                  />
                  {errors.storeName && <p className="text-sm text-red-600 mt-1">{errors.storeName.message}</p>}
                 </div>

                 {/* Store Description */}
                 <div>
                   <Label htmlFor="storeDescription">Store Description</Label>
                   <Textarea
                     id="storeDescription"
                     {...register("storeDescription")}
                     placeholder="Describe what makes your store unique..."
                     rows={3} // Slightly smaller
                     className={errors.storeDescription ? "border-red-500" : ""}
                   />
                    <div className="flex justify-between items-center mt-1">
                         {errors.storeDescription ?
                             <p className="text-xs text-red-600">{errors.storeDescription.message}</p>
                             : <p></p> // Placeholder for alignment
                         }
                         <Button
                             type="button"
                             variant="link" // Use link style for less emphasis
                             size="sm"
                             onClick={generateDescription}
                             disabled={isGeneratingDescription || !watch("storeName")}
                             className="text-xs h-auto p-0 text-blue-600 hover:text-blue-800"
                         >
                             {isGeneratingDescription ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                             Generate with AI ✨
                         </Button>
                    </div>
                 </div>

                 {/* Logo Upload - Improved Layout */}
                 <div>
                     <Label>Store Logo</Label>
                     <div className="flex items-center gap-4 mt-2">
                         <div className={`flex-shrink-0 w-24 h-24 border-2 ${errors.logoFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-md flex items-center justify-center bg-muted/50`}>
                             {logoPreviewUrl ? (
                                 <Image src={logoPreviewUrl} alt="Logo Preview" width={80} height={80} className="object-contain" />
                             ) : (
                                 <ImageIcon className="h-10 w-10 text-gray-400" />
                             )}
                         </div>
                         <div className="flex-grow space-y-1">
                             <Input id="logoFile" type="file" className="hidden" {...register("logoFile")} accept="image/*" />
                             <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logoFile')?.click()}>
                                 <UploadCloud size={14} className="mr-2"/> Upload Logo
                             </Button>
                             <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 onClick={generateLogo}
                                 disabled={isGeneratingLogo || !watch("storeName")}
                                 className="text-xs"
                             >
                                 {isGeneratingLogo ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                 Generate with AI
                             </Button>
                              {logoPreviewUrl && <Button type="button" variant="link" size="sm" className="text-xs h-auto p-0 text-red-600" onClick={() => setValue('logoFile', null)}>Remove</Button>}
                             <p className="text-xs text-muted-foreground">Recommended: Square image (e.g., 200x200px). Max 5MB.</p>
                             {errors.logoFile && <p className="text-xs text-red-600">{errors.logoFile.message}</p>}
                         </div>
                     </div>
                 </div>
             </CardContent>
           </Card>

           {/* --- Section 2: Products --- */}
           <Card>
              <CardHeader>
                 <CardTitle>Products</CardTitle>
                 <CardDescription>Add the items you want to sell in your store.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                 {/* CSV Upload - Styled Button */}
                 <div className="flex items-center gap-4">
                    <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden" // Hide the default input
                    />
                     <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('csvFile')?.click()}>
                        <UploadCloud size={14} className="mr-2"/> Upload CSV
                     </Button>
                    <p className="text-xs text-muted-foreground">
                        Need a template? <a href="/templates/products-template.csv" download="products-template.csv" className="text-blue-600 hover:underline">Download sample</a>.
                    </p>
                 </div>

                 {/* Products Table - Improved Styling */}
                 <div className="overflow-x-auto border rounded-lg"> {/* Rounded table container */}
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Title</TableHead>
                            <TableHead className="w-[25%]">Image URL</TableHead>
                            <TableHead className="w-[30%]">Description</TableHead>
                            <TableHead className="w-[15%]">Price ($)</TableHead>
                            <TableHead className="w-[5%] text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {fields.map((field: FieldArrayWithId<FormValues, "products", "id">, index: number) => ( // Add types for field and index
                            <TableRow key={field.id}>
                            <TableCell className="align-top">
                                <Input
                                {...register(`products.${index}.title`)}
                                placeholder="Product Name"
                                className={`h-auto ${errors.products?.[index]?.title ? 'border-red-500' : ''}`}
                                />
                                {errors.products?.[index]?.title && <p className="text-xs text-red-600 mt-1">{errors.products?.[index]?.title?.message}</p>}
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="flex items-start space-x-2">
                                    <Input
                                        {...register(`products.${index}.imageUrl`)}
                                        placeholder="https://..."
                                        className={`h-auto flex-grow ${errors.products?.[index]?.imageUrl ? 'border-red-500' : ''}`}
                                    />
                                    <label className="mt-1 cursor-pointer text-blue-600 hover:text-blue-800" title="Upload Image">
                                        <UploadCloud size={18} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleImageUpload(e, index)} // Add type for e
                                        />
                                    </label>
                                </div>
                                 {errors.products?.[index]?.imageUrl && <p className="text-xs text-red-600 mt-1">{errors.products?.[index]?.imageUrl?.message}</p>}
                            </TableCell>
                            <TableCell className="align-top">
                                <Textarea
                                {...register(`products.${index}.description`)}
                                placeholder="Product details..."
                                rows={3}
                                className={`h-auto ${errors.products?.[index]?.description ? 'border-red-500' : ''}`}
                                />
                                {errors.products?.[index]?.description && <p className="text-xs text-red-600 mt-1">{errors.products?.[index]?.description?.message}</p>}
                            </TableCell>
                            <TableCell className="align-top">
                                <Input
                                type="number"
                                step="0.01"
                                {...register(`products.${index}.price`)}
                                placeholder="0.00"
                                className={`h-auto ${errors.products?.[index]?.price ? 'border-red-500' : ''}`}
                                />
                                {errors.products?.[index]?.price && <p className="text-xs text-red-600 mt-1">{errors.products?.[index]?.price?.message}</p>}
                            </TableCell>
                            <TableCell className="align-top text-right">
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => remove(index)}
                                title="Remove Product"
                                >
                                <X size={14} /> {/* Slightly smaller icon */}
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </div>
                 {errors.products?.root && <p className="text-sm text-red-600 mt-1">{errors.products.root.message}</p>}
                 {errors.products?.message && <p className="text-sm text-red-600 mt-1">{errors.products.message}</p>}


                 <Button
                    type="button"
                    variant="secondary" // Use secondary style
                    size="sm"
                    onClick={() => append({ title: "", imageUrl: "", description: "", price: 0 })} // Use price: 0
                 >
                    <Plus size={16} className="mr-2"/> Add Product Row
                 </Button>
              </CardContent>
           </Card>

            {/* --- Section 3: Appearance & Layout --- */}
           <Card>
              <CardHeader>
                 <CardTitle>Appearance & Layout</CardTitle>
                 <CardDescription>Choose how your store looks and how products are displayed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                    {/* Theme Color */}
                    <div>
                        <Label htmlFor="themeColor">Theme Color</Label>
                        <div className="flex items-center space-x-2 mt-1">
                            <Input
                                id="themeColor"
                                type="color"
                                {...register("themeColor")}
                                className="h-10 w-16 p-1 border-gray-300 rounded cursor-pointer" // Basic styling for color input
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{watch("themeColor")}</span>
                        </div>
                        {errors.themeColor && <p className="text-sm text-red-600 mt-1">{errors.themeColor.message}</p>}
                    </div>

                    {/* Container Style */}
                    <div>
                        <Label>Container Style</Label>
                        <RadioGroup
                            defaultValue={watch("containerStyle")}
                            onValueChange={(value: "rounded" | "straight") => setValue("containerStyle", value, { shouldValidate: true })}
                            className="flex items-center space-x-4 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="rounded" id="style-rounded" />
                                <Label htmlFor="style-rounded" className="font-normal cursor-pointer">Rounded Corners</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="straight" id="style-straight" />
                                <Label htmlFor="style-straight" className="font-normal cursor-pointer">Straight Corners</Label>
                            </div>
                        </RadioGroup>
                         {errors.containerStyle && <p className="text-sm text-red-600 mt-1">{errors.containerStyle.message}</p>}
                    </div>

                    {/* Container Style */}
                    <div>
                        <Label>Container Style</Label>
                        <RadioGroup
                            defaultValue={watch("containerStyle")}
                            onValueChange={(value: "rounded" | "straight") => setValue("containerStyle", value, { shouldValidate: true })}
                            className="flex items-center space-x-4 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="rounded" id="style-rounded" />
                                <Label htmlFor="style-rounded" className="font-normal cursor-pointer">Rounded Corners</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="straight" id="style-straight" />
                                <Label htmlFor="style-straight" className="font-normal cursor-pointer">Straight Corners</Label>
                            </div>
                        </RadioGroup>
                         {errors.containerStyle && <p className="text-sm text-red-600 mt-1">{errors.containerStyle.message}</p>}
                    </div>
                    {/* Layout Selection - More Visual */}
                    <div>
                        <Label>Product Layout</Label>
                        <RadioGroup
                            defaultValue={watch("layout")}
                            onValueChange={(value: FormValues['layout']) => setValue("layout", value, { shouldValidate: true })}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2" // Adjusted gap
                        >
                            {[
                                { value: "list", label: "List View", icon: <LayoutGrid size={20}/> }, // Placeholder icon
                                { value: "grid-2", label: "2 Columns", icon: <LayoutGrid size={20}/> },
                                { value: "grid-3", label: "3 Columns", icon: <LayoutGrid size={20}/> },
                                { value: "grid-4", label: "4 Columns", icon: <LayoutGrid size={20}/> },
                                { value: "carousel", label: "Carousel", icon: <LayoutGrid size={20}/> },
                                { value: "masonry", label: "Masonry", icon: <LayoutGrid size={20}/> },
                            ].map((opt) => (
                                <Label
                                    key={opt.value}
                                    htmlFor={`layout-${opt.value}`}
                                    className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors duration-150 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 ${watch("layout") === opt.value ? 'border-blue-600 ring-2 ring-blue-300 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <RadioGroupItem value={opt.value} id={`layout-${opt.value}`} className="sr-only" />
                                    {/* TODO: Replace with better visual icons for each layout */}
                                    <div className="w-12 h-8 bg-gray-200 dark:bg-gray-600 rounded-sm mb-2 flex items-center justify-center text-gray-400">
                                        {opt.icon}
                                    </div>
                                    <span className="text-xs text-center">{opt.label}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                        {errors.layout && <p className="text-sm text-red-600 mt-1">{errors.layout.message}</p>}
                    </div>
              </CardContent>
           </Card>

            {/* Submission Error */}
            {submitError && (
                <Alert variant="destructive" className="mt-6"> {/* Add margin */}
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            )}

            {/* Submit Button - Moved outside cards */}
            <div className="flex justify-end pt-8 mt-8 border-t"> {/* Added margin top */}
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Store
                </Button>
            </div>
          </form>
      </div>
    </>
  )
}
