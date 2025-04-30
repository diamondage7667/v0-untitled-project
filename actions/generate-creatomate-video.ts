"use server";

import crypto from 'crypto';
import { Storage } from '@google-cloud/storage'; // Import GCS client

// Define the structure for each slide/image input
interface SlideInput {
  frameUrl: string; // Image data URI
  caption?: string; // Optional manual caption
}

// Define the possible Creatomate template types this action handles
export type CreatomateTemplate = 'social-reel' | 'product-showcase';

// Define the structure for product showcase specific data
export interface ProductShowcaseData {
  productName: string;
  productDescription: string;
  normalPrice: string;
  discountedPrice: string;
  cta: string;
  website: string;
  logoUrl: string | null; // Data URI or null
}

// Define the input structure for this action
interface CreatomateRequest {
  slides: SlideInput[];
  aspectRatio: "16:9" | "1:1" | "9:16"; // Keep aspect ratio if needed by template/UI
  template: CreatomateTemplate; // Template selection
  productData?: ProductShowcaseData; // Optional product data for showcase theme
}

// Define the response structure for this action
interface CreatomateResponse {
  success: boolean;
  renders?: Array<{ id: string; status: string; url?: string }>; // url might not be present initially
  error?: string;
}

const API_ENDPOINT = "https://api.creatomate.com/v1/renders";
const GCS_BUCKET_NAME = "siphonhf"; // GCS Bucket Name

// Define Template IDs for Creatomate templates
const TEMPLATE_IDS: Record<CreatomateTemplate, string> = {
  'social-reel': "543a4dfc-2286-45f1-acf5-86070a961708",
  'product-showcase': "4cc27f0e-4641-44c2-a768-6b757225e11f",
};

// Initialize GCS Client
const storage = new Storage({ projectId: "intelarts" });
const bucket = storage.bucket(GCS_BUCKET_NAME);

// Helper to extract Base64 data and format from data URI
function getBase64FromDataUri(dataUri: string): { format: string; data: string } | null {
  const match = dataUri.match(/^data:image\/(\w+);base64,(.*)$/);
  return match ? { format: match[1] || 'png', data: match[2] } : null;
}

export async function generateCreatomateVideo(
  request: CreatomateRequest
): Promise<CreatomateResponse> {
  const creatomateApiKey = process.env.CREATOMATE_API_KEY;

  if (!creatomateApiKey) { return { success: false, error: "Server config error: Missing Creatomate API Key." }; }

  const { slides, template, productData } = request;
  if (!slides || slides.length === 0) { return { success: false, error: "No slides provided." }; }
  if (!template || !TEMPLATE_IDS[template]) { return { success: false, error: "Invalid or missing Creatomate template specified." }; }
  if (template === 'product-showcase' && !productData) { return { success: false, error: "Product data is required for the product-showcase template." }; }

  const gcsUploadPrefix = `tmp-creatomate-images/${crypto.randomBytes(16).toString("hex")}`;
  console.log(`Uploading images to GCS bucket '${GCS_BUCKET_NAME}' with prefix '${gcsUploadPrefix}' for template '${template}'`);

  const maxSlides = template === 'social-reel' ? 4 : 1; // Adjust max slides based on template
  let uploadedLogoGcsUrl: string | null = null;
  let sceneProcessingResults: { imageUrl: string; caption?: string }[] = [];

  try {
      // --- Upload Logo (if product showcase and logo provided) ---
      if (template === 'product-showcase' && productData?.logoUrl) {
          const logoData = getBase64FromDataUri(productData.logoUrl);
          if (logoData) {
              const logoFileName = `logo.${logoData.format}`;
              const logoGcsPath = `${gcsUploadPrefix}/${logoFileName}`;
              const logoFile = bucket.file(logoGcsPath);
              const logoBuffer = Buffer.from(logoData.data, "base64");
              await logoFile.save(logoBuffer, { metadata: { contentType: `image/${logoData.format}` }, public: true });
              uploadedLogoGcsUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${logoGcsPath}`;
              console.log(`Uploaded logo to GCS: ${uploadedLogoGcsUrl}`);
          } else {
              console.warn("Could not extract image data from provided logoUrl.");
          }
      }

      // --- Upload Scene Images ---
      const processingPromises = slides.slice(0, maxSlides).map(async (slide: SlideInput, i: number) => {
          const imageData = getBase64FromDataUri(slide.frameUrl);
          if (!imageData) {
              console.warn(`Could not extract image data from slide ${i}`);
              return { imageUrl: "", caption: slide.caption || `Default caption ${i + 1}` };
          }
          const imageFileName = `scene-image-${i + 1}.${imageData.format}`;
          const gcsPath = `${gcsUploadPrefix}/${imageFileName}`;
          const file = bucket.file(gcsPath);
          const imageBuffer = Buffer.from(imageData.data, "base64");
          await file.save(imageBuffer, { metadata: { contentType: `image/${imageData.format}` }, public: true });
          const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${gcsPath}`;
          console.log(`Uploaded image ${i + 1} to GCS: ${publicUrl}`);
          return { imageUrl: publicUrl, caption: slide.caption };
      });

      sceneProcessingResults = await Promise.all(processingPromises);
      console.log("GCS uploads complete.");

  } catch (uploadError) {
      console.error("Error during GCS upload:", uploadError);
      return { success: false, error: `Failed during file upload to storage. ${uploadError instanceof Error ? uploadError.message : String(uploadError)}` };
  }

  // --- Creatomate Template Call ---
  const templateId = TEMPLATE_IDS[template];
  const modifications: { [key: string]: string } = {};

  // Build modifications based on the selected template
  if (template === 'social-reel') {
      for (let i = 0; i < Math.min(sceneProcessingResults.length, 4); i++) {
          const result = sceneProcessingResults[i];
          if (result.imageUrl) modifications[`Image-${i + 1}.source`] = result.imageUrl;
          if (result.caption) modifications[`Voiceover-${i + 1}.source`] = result.caption; // Assuming caption maps to voiceover
      }
  } else if (template === 'product-showcase' && productData) {
      if (sceneProcessingResults.length > 0 && sceneProcessingResults[0].imageUrl) {
          modifications["Product-Image.source"] = sceneProcessingResults[0].imageUrl;
          modifications["Product-Name.text"] = productData.productName || "Amazing Product";
          modifications["Product-Description.text"] = productData.productDescription || "Check out this fantastic item!";
          modifications["Normal-Price.text"] = productData.normalPrice || "$109.99";
          modifications["Discounted-Price.text"] = productData.discountedPrice || "$89.99";
          modifications["CTA.text"] = productData.cta || "Shop Now!";
          modifications["Website.text"] = productData.website || "www.yourstore.com";
          if (uploadedLogoGcsUrl) modifications["Logo.source"] = uploadedLogoGcsUrl;
      } else {
          console.warn("Skipping product-showcase modifications as the first scene image URL is missing.");
          // Don't proceed if the main image is missing
          return { success: false, error: "First scene image is required for product showcase but was not processed correctly." };
      }
  }

  if (Object.keys(modifications).length === 0) {
      return { success: false, error: "No valid modifications could be generated for the Creatomate template." };
  }

  const payload = { template_id: templateId, modifications };
  console.log("Final payload being sent to Creatomate:", JSON.stringify(payload, null, 2));

  try {
      const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Authorization": `Bearer ${creatomateApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      });

      console.log(`Creatomate API Response Status: ${response.status} ${response.statusText}`);
      const responseBodyText = await response.text(); // Read body once

      if (!response.ok) {
          let errorDetails = responseBodyText;
          try { if (errorDetails.startsWith('{') || errorDetails.startsWith('[')) errorDetails = JSON.parse(errorDetails).message || JSON.stringify(JSON.parse(errorDetails)); }
          catch (parseError) { console.warn("Could not parse non-OK Creatomate response as JSON."); }
          console.error(`Creatomate API Error (${response.status}): ${errorDetails}`);
          return { success: false, error: `API request failed: ${response.status}. ${errorDetails}` };
      }

      const renders = JSON.parse(responseBodyText);
      console.log("Parsed Creatomate API Success Response:", renders);
      if (!Array.isArray(renders) || renders.length === 0) {
          return { success: false, error: "Creatomate API did not return valid render information." };
      }
      return { success: true, renders: renders };

  } catch (error: unknown) {
      console.error("Error calling Creatomate API:", error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to initiate Creatomate render: ${message}` };
  } finally {
      // Optional GCS cleanup
      console.log(`GCS cleanup for prefix '${gcsUploadPrefix}' can be implemented here.`);
  }
}
