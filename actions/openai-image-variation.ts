"use server";

import OpenAI from "openai";
import { dataURLtoFile } from "@/lib/utils"; // Assuming a utility function exists

// Define the request interface
export interface OpenAIImageVariationRequest {
  image: string; // Data URL of the image to variate
  n?: number | null;
  size?: "1024x1024" | "512x512" | "256x256" | null; // Only DALL-E 2 sizes
  // Add user if needed
}

// Define the response interface (similar to generation/edit)
export interface OpenAIImageVariationResponse {
  success: boolean;
  images?: Array<{ url?: string; b64_json?: string }>; // Array of images (DALL-E 2 can return URL or b64)
  error?: string;
  // No usage field for DALL-E 2 variations
}

// Helper function to initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY environment variable is not set.");
    throw new Error("Server configuration error: Missing OpenAI API Key.");
  }
  return new OpenAI({ apiKey });
}

export async function createOpenAIImageVariation(
  request: OpenAIImageVariationRequest
): Promise<OpenAIImageVariationResponse> {
  const {
    image,
    n = 1,
    size = "1024x1024", // Default DALL-E 2 size
  } = request;

  console.log(`Initiating OpenAI image variation: Size=${size}, N=${n}`);

  try {
    const openai = getOpenAIClient();

    // Prepare image input
    let imageFile: File;
    if (typeof image === "string" && image.startsWith("data:")) {
      const filename = `variation-input-${Date.now()}.png`;
      try {
        imageFile = await dataURLtoFile(image, filename);
      } catch (error) {
        console.error("Error converting Data URL to File for variation:", error);
        throw new Error("Failed to process image data URL for variation.");
      }
    } else {
      throw new Error("Invalid image format for variation. Expected Data URL.");
    }

    // Build API parameters - only DALL-E 2 supported
    const apiParams: OpenAI.Images.ImageCreateVariationParams = {
      image: imageFile,
      model: "dall-e-2", // Explicitly set DALL-E 2
      n: n ?? 1,
      response_format: "b64_json", // Request b64 for consistency
    };

    // Add size if it's valid for DALL-E 2
    if (size && ["1024x1024", "512x512", "256x256"].includes(size)) {
      apiParams.size = size;
    } else if (size) {
      console.warn(`Invalid size "${size}" provided for DALL-E 2 variation. Using API default (1024x1024).`);
      // Let API use default by not setting apiParams.size
    }

     // Remove null/undefined values
    Object.keys(apiParams).forEach(key => {
        const K = key as keyof typeof apiParams;
        if (apiParams[K] === null || apiParams[K] === undefined) {
            delete apiParams[K];
        }
    });


    console.log("Calling OpenAI Variation API with params:", {
        ...apiParams, image: `1 file`
    });

    const response = await openai.images.createVariation(apiParams);
    console.log("OpenAI Variation API response received.");

    if (!response.data || response.data.length === 0) {
      throw new Error("No variation image data received from OpenAI.");
    }

    // Prepend data URI scheme if b64_json is returned
    const processedImages = response.data.map(img => ({
        ...img,
        b64_json: img.b64_json ? `data:image/png;base64,${img.b64_json}` : undefined
    }));

    return {
      success: true,
      images: processedImages,
    };

  } catch (error: unknown) {
    console.error("Error creating OpenAI image variation:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    let detailedError = message;
    if (error instanceof OpenAI.APIError) {
        detailedError = `OpenAI API Error (${error.status}): ${error.message}`;
        console.error("OpenAI Error Details:", error.error);
    }
    return {
      success: false,
      error: detailedError,
    };
  }
}
