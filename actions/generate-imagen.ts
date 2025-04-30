"use server";

import { GoogleGenAI } from "@google/genai"; // Removed GenerateContentResponse as it's not directly used here

// Define and export a specific response type for this action
export interface ImagenGenerationResponse {
  success: boolean;
  url?: string; // URL will be a data URI
  error?: string;
  // base64Data is implicit in the data URI, so not needed separately here
}

// Define the structure for the Imagen request matching the frontend needs
interface ImagenRequest {
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "9:16" | "4:3" | "3:4"; // Match supported ratios
  // Add other potential parameters like negativePrompt if needed later
}

// Mapping from frontend aspect ratios to Imagen API aspect ratios
const aspectRatioMap: { [key in ImagenRequest['aspectRatio']]: string } = {
  "16:9": "16:9",
  "1:1": "1:1",
  "9:16": "9:16",
  "4:3": "4:3", // Added 4:3
  "3:4": "3:4"  // Added 3:4
};

export async function generateImagen(
  request: ImagenRequest
): Promise<ImagenGenerationResponse> { // Use the new specific response type
  const geminiApiKey = process.env.GEMINI_API_KEY; // Assuming Imagen uses the same key for now
  if (!geminiApiKey) {
    return { success: false, error: "Server config error: Missing Gemini/Imagen API Key." }; // Matches ImagenGenerationResponse
  }

  const { prompt, aspectRatio } = request;
  const imagenAspectRatio = aspectRatioMap[aspectRatio] || "1:1"; // Default to 1:1 if mapping fails

  try {
    console.log(`Generating image with Imagen 3: Prompt="${prompt}", AspectRatio=${imagenAspectRatio}`);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Note: The example uses ai.models.generateImages, but the SDK might have evolved.
    // Let's try the structure from the example first. If it fails, we might need to adjust.
    // Assuming the SDK structure `ai.models.generateImages` is correct as per the example.
    // If this specific method doesn't exist, the error handling below should catch it.
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002', // Use the specified Imagen 3 model
      prompt: prompt,
      config: {
        numberOfImages: 1, // Generate only one image for the preview
        aspectRatio: imagenAspectRatio,
        // personGeneration: "ALLOW_ADULT" // Default, can be added if needed
      },
    });

    // Check if images were generated and access safely
    const generatedImage = response.generatedImages?.[0];
    const imgBytes = generatedImage?.image?.imageBytes; // Safely access imageBytes

    if (imgBytes) {
      // Convert raw bytes (assuming base64 string) to data URI
      // Determine mime type - Imagen likely returns PNG or JPEG. Let's assume PNG for now.
      // TODO: Check if the response includes the mime type. Defaulting to png.
      const mimeType = "image/png"; // Assuming PNG, adjust if needed
      const dataUri = `data:${mimeType};base64,${imgBytes}`;
      console.log("Imagen 3 generation successful.");
      return { success: true, url: dataUri }; // Matches ImagenGenerationResponse
    } else {
      console.error("Imagen 3 API did not return expected image data:", response);
      // Check for specific feedback if available
      const feedback = (response as any).feedback || "No image data returned."; // Access potential feedback field
      return { success: false, error: `Imagen 3 generation failed: ${feedback}` }; // Matches ImagenGenerationResponse
    }

  } catch (err: unknown) {
    console.error("Error calling Imagen 3 API:", err);
    // Check if the error is about the method not existing
    if (err instanceof Error && (err.message.includes("generateImages is not a function") || err.message.includes("does not exist"))) {
       console.error("It seems 'ai.models.generateImages' might not be the correct SDK method.");
       // TODO: Potentially try an alternative SDK structure if known, or just report the error.
    }
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Imagen 3 API request failed: ${message}` }; // Matches ImagenGenerationResponse
  }
}
