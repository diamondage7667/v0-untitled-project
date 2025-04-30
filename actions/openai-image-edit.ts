"use server";

import OpenAI from "openai";
import { toFile } from "openai/uploads"; // Helper for converting various inputs to File objects
import { dataURLtoFile } from "@/lib/utils"; // Assuming a utility function exists

// Define the request interface
export interface OpenAIImageEditRequest {
  image: string | string[]; // Data URL(s) or File object(s) - will be converted server-side
  prompt: string;
  mask?: string | null; // Data URL for the mask image
  model?: "gpt-image-1" | "dall-e-2";
  n?: number | null;
  quality?: "auto" | "high" | "medium" | "low" | "standard" | null; // Combined qualities
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "512x512" | "256x256" | "auto" | null; // Combined sizes
  // Add user if needed
}

// Define the response interface (similar to generation)
export interface OpenAIImageEditResponse {
  success: boolean;
  images?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>; // Array of images
  error?: string;
  usage?: OpenAI.Images.ImagesResponse["usage"]; // Include usage if available (gpt-image-1)
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

// Helper to convert input images (Data URLs or potentially other formats) to File objects
async function prepareImageInput(
  input: string | string[] | File | File[]
): Promise<File[]> {
  const files: File[] = [];
  const inputs = Array.isArray(input) ? input : [input];

  for (const item of inputs) {
    if (typeof item === "string" && item.startsWith("data:")) {
      // Convert Data URL to File
      const filename = `image-${Date.now()}-${Math.random().toString(16).substring(2, 8)}.png`; // Generate unique filename
      try {
        const file = await dataURLtoFile(item, filename); // Use utility function
        files.push(file);
      } catch (error) {
        console.error("Error converting Data URL to File:", error);
        throw new Error(`Failed to process image data URL: ${filename}`);
      }
    } else if (item instanceof File) {
      files.push(item);
    } else {
      console.warn("Unsupported image input type:", typeof item);
      // Handle other cases or throw error if necessary
    }
  }
  return files;
}

export async function editOpenAIImage(
  request: OpenAIImageEditRequest
): Promise<OpenAIImageEditResponse> {
  const {
    image,
    prompt,
    mask = null,
    model = "gpt-image-1", // Default to gpt-image-1
    n = 1,
    quality = "auto",
    size = "auto",
  } = request;

  console.log(`Initiating OpenAI image edit: Model=${model}, Prompt="${prompt.substring(0, 50)}..."`);

  try {
    const openai = getOpenAIClient();

    // Prepare image input(s)
    const imageFiles = await prepareImageInput(image);
    if (imageFiles.length === 0) {
      throw new Error("No valid image provided for editing.");
    }
    console.log(`Prepared ${imageFiles.length} image file(s) for upload.`);

    // Prepare mask input if provided
    let maskFile: File | undefined = undefined;
    if (mask && typeof mask === "string" && mask.startsWith("data:")) {
      try {
        maskFile = await dataURLtoFile(mask, `mask-${Date.now()}.png`);
        console.log("Prepared mask file for upload.");
      } catch (error) {
        console.error("Error converting mask Data URL to File:", error);
        // Decide whether to proceed without mask or throw error
        throw new Error("Failed to process mask image data URL.");
      }
    }

    let response: OpenAI.Images.ImagesResponse;

    // Construct parameters and call API based on model
    if (model === "gpt-image-1") {
        // Define params specifically for gpt-image-1
        let apiParams: OpenAI.Images.ImageEditParams = {
            image: imageFiles, // gpt-image-1 accepts array
            prompt,
            model: "gpt-image-1",
            n: n ?? 1,
        };
        if (maskFile) apiParams.mask = maskFile;
        if (quality && ["high", "medium", "low", "auto"].includes(quality)) {
            apiParams.quality = quality as "high" | "medium" | "low" | "auto";
        }
        if (size && ["1024x1024", "1536x1024", "1024x1536", "auto"].includes(size)) {
             // Assign validated size, casting apiParams to any to bypass incorrect type inference
            (apiParams as any).size = size;
        }

        // Remove null/undefined/auto values specifically for gpt-image-1 params
        Object.keys(apiParams).forEach(key => {
            const K = key as keyof typeof apiParams;
            if (apiParams[K] === null || apiParams[K] === undefined || apiParams[K] === "auto") {
                 if (K !== 'image' && K !== 'mask') delete apiParams[K];
                 else if (apiParams[K] === null || apiParams[K] === undefined) delete apiParams[K];
            }
        });

        console.log("Calling OpenAI Edit API (gpt-image-1) with params:", {
            ...apiParams, image: `${imageFiles.length} file(s)`, mask: maskFile ? 'mask file present' : 'no mask'
        });
        response = await openai.images.edit(apiParams);

    } else { // dall-e-2
        if (imageFiles.length > 1) {
            console.warn("DALL-E 2 only supports editing one image. Using the first image provided.");
        }
        const imageToEdit = imageFiles[0]; // DALL-E 2 requires a single File

        // Initialize with base parameters valid for DALL-E 2 edit, excluding size initially
        let apiParams: OpenAI.Images.ImageEditParams = {
            image: imageToEdit,
            prompt,
            model: "dall-e-2",
            n: n ?? 1,
            response_format: "b64_json",
            // quality: "standard", // Default for DALL-E 2
        };

        // Conditionally add mask
        if (maskFile) {
            apiParams.mask = maskFile;
        }

        // Validate and conditionally add size specifically for DALL-E 2
        if (size && ["1024x1024", "512x512", "256x256"].includes(size)) {
            // Assign the validated size. The type checker should accept this direct assignment
            // because the property 'size' exists on ImageEditParams with the correct union type.
            apiParams.size = size as "1024x1024" | "512x512" | "256x256";
        } else if (size && size !== "auto") {
            // Log warning if an invalid size (other than 'auto') was provided
            console.warn(`Invalid size "${size}" provided for DALL-E 2 edit. Using API default (1024x1024).`);
        }
        // If size is 'auto' or null/undefined, we don't add the property, letting the API default.


        // Remove any remaining null/undefined values (like n if it was null)
        Object.keys(apiParams).forEach(key => {
            const K = key as keyof typeof apiParams;
            if (apiParams[K] === null || apiParams[K] === undefined) {
                delete apiParams[K];
            }
        });

        console.log("Calling OpenAI Edit API (dall-e-2) with params:", {
             ...apiParams, image: `1 file`, mask: maskFile ? 'mask file present' : 'no mask'
        });
        // Call the API with the constructed parameters, using 'as any' as a workaround for the persistent TS type error.
        response = await openai.images.edit(apiParams as any);
    }

    console.log("OpenAI Edit API response received.");

    if (!response.data || response.data.length === 0) {
      throw new Error("No edited image data received from OpenAI.");
    }

     // Prepend data URI scheme if b64_json is returned
    const processedImages = response.data.map(img => ({
        ...img,
        b64_json: img.b64_json ? `data:image/png;base64,${img.b64_json}` : undefined
    }));

    return {
      success: true,
      images: processedImages,
      usage: response.usage,
    };

  } catch (error: unknown) {
    console.error("Error editing OpenAI image:", error);
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
