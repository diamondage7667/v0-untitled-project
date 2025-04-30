"use server"

import { GoogleGenAI, Part } from "@google/genai" // Added Part

// Update the ProductInfo interface to include color
interface ProductInfo {
  id: string
  name: string
  imageUrl: string
  type: "clothing" | "decor" | "other"
  color?: {
    hex: string
    name: string
  }
}

interface VisualizeProductRequest {
  products: ProductInfo[]
  userImage?: string
}

interface VisualizeProductResponse {
  visualizationUrl: string
  error?: string
}

// Helper function to prepare image data part from URL or data URI
async function prepareImageDataPart(imageData: string | undefined, sourceDescription: string): Promise<Part | null> {
  if (!imageData) return null;

  let mimeType: string;
  let base64Data: string;

  if (imageData.startsWith("data:image")) {
    const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      throw new Error(`Invalid ${sourceDescription} data URI format`);
    }
  } else if (imageData.startsWith("http")) {
    // Assume it's a URL
    try {
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${sourceDescription} image URL (${imageData}): ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
      mimeType = response.headers.get("content-type") || "image/jpeg"; // Default to jpeg if type not found
    } catch (error) {
      throw new Error(`Error fetching ${sourceDescription} image URL (${imageData}): ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // We could potentially handle direct base64 strings if needed, but for now require prefix
    throw new Error(`Unsupported ${sourceDescription} format. Must be a data URI or a valid http(s) URL.`);
  }

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}


// Update the visualizeProduct function to include color information in the prompt
export async function visualizeProduct(request: VisualizeProductRequest): Promise<VisualizeProductResponse> {
  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })
    // Models will be specified directly in the generateContent calls

    // Prepare image parts using the helper
    const userImagePart = await prepareImageDataPart(request.userImage, "user image");
    const productParts = (await Promise.all(
      request.products.map(p => prepareImageDataPart(p.imageUrl, `product image for ${p.name}`))
    )).filter(part => part !== null) as Part[]; // Filter out nulls and assert type

    const allImageParts = userImagePart ? [userImagePart, ...productParts] : productParts;
    const totalImages = allImageParts.length;

    let finalPrompt = "";
    let generationContentParts: Part[] = [];

    // Determine the dominant product type
    const productTypes = request.products.map((p) => p.type)
    const isMainlyClothing = productTypes.filter((t) => t === "clothing").length > productTypes.length / 2
    const isMainlyDecor = productTypes.filter((t) => t === "decor").length > productTypes.length / 2

    // --- Two-Image Analysis Logic ---
    if (totalImages === 2) {
      console.log("Two images detected, performing analysis step...");
      const analysisPrompt = `Analyze the relationship between these two images. Based on the items shown, generate a concise and effective prompt for an image generation model (like Imagen 2 or Gemini Image Generation) to create a realistic visualization combining or using these items appropriately. For clothing, visualize them worn by a person. For decor, visualize them in a room setting. If one image is clearly a person/scene and the other is an item, visualize the item being used/worn in the context of the first image. If colors are specified for products, mention that the generation should use those colors. Product details: ${request.products.map(p => `${p.name}${p.color ? ` (Color: ${p.color.name} - ${p.color.hex})` : ''}`).join(', ')}.`;

      const analysisParts: Part[] = [
        { text: analysisPrompt },
        ...allImageParts // Add the two image parts
      ];

      try {
        // Use genAI.models.generateContent directly for analysis
        const analysisResult = await genAI.models.generateContent({
          model: "gemini-1.5-flash-latest", // Specify analysis model here
            contents: [{ role: "user", parts: analysisParts }]
          });

          // Extract text by iterating through parts, similar to image extraction
          let generatedPrompt: string | null = null;
          if (analysisResult.candidates && analysisResult.candidates.length > 0) {
            const candidate = analysisResult.candidates[0];
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  generatedPrompt = part.text;
                  break; // Found the text part
                }
              }
            }
          }

          if (!generatedPrompt) {
            console.warn("Analysis step did not return a text part. Using fallback prompt.", JSON.stringify(analysisResult, null, 2));
            // Keep the fallback logic, but maybe don't throw immediately if fallback is acceptable
             finalPrompt = "Create a realistic visualization combining these two images."; // Set fallback directly
             // throw new Error("Analysis step failed to generate a prompt text part.");
          } else {
             console.log("Generated analysis prompt:", generatedPrompt);
             finalPrompt = generatedPrompt; // Use the extracted prompt
          }
        // Removed redundant assignment: finalPrompt = generatedPrompt;
      } catch (analysisError) {
        console.error("Error during image analysis step:", analysisError);
        // Fallback to default prompt if analysis fails
        finalPrompt = "Create a realistic visualization combining these two images.";
      }

      generationContentParts = [
        { text: finalPrompt }, // Use the (potentially generated) prompt
        ...allImageParts // Pass the original images again
      ];

    } else {
      // --- Original Logic for non-two images ---
      console.log(`Total images (${totalImages}) is not 2, using standard prompt generation.`);
      // Determine the dominant product type
      const productTypes = request.products.map((p) => p.type)
      const isMainlyClothing = productTypes.filter((t) => t === "clothing").length > productTypes.length / 2
      const isMainlyDecor = productTypes.filter((t) => t === "decor").length > productTypes.length / 2

      // Create product names list with color information
      const productDescriptions = request.products
        .map((p) => {
          if (p.color) {
            return `${p.name} in ${p.color.name} color (hex: ${p.color.hex})`
          }
          return p.name
        })
        .join(", ")

      if (isMainlyClothing) {
        finalPrompt = userImagePart
          ? `Create a realistic visualization of a person in this photo wearing these items together: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
          : `Create a realistic visualization of a person wearing these items together: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
      } else if (isMainlyDecor) {
        finalPrompt = userImagePart
          ? `Create a realistic visualization of these items placed together in this room, replace the main similar furniture/decor subject/item. If multiple objects, make sense of it's purpose and context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
          : `Create a realistic visualization of these items arranged together in a stylish room setting, replace the main similar subject/decor item. If multiple objects, place them in reasonable ways that make sense to it's purpose and the context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
      } else {
        finalPrompt = userImagePart
          ? `Create a realistic visualization of these items being used together with the reference image: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
          : `Create a realistic visualization of these items being used together in an appropriate context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
      }
       generationContentParts = [
         { text: finalPrompt },
         ...allImageParts // Add all prepared image parts
       ];
    }

    // --- Image Generation Step ---
    console.log("Calling image generation model with prompt:", finalPrompt);
    // Use genAI.models.generateContent directly for image generation
    const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation", // Specify image generation model here
        contents: [{ role: "user", parts: generationContentParts }],
        // Configuration for image generation might differ, adjust if needed
        // config: { // Example config if needed later
        //   responseModalities: ["Image"], // Expecting only image back
        // },
        // Safety settings might be relevant
        // safetySettings: [...]
     });

     // --- Process Generation Response ---
     const generationResponse = response; // Corrected: Access directly

     // Extract the generated image from the response
     let generatedImageBase64: string | null = null;
     let generatedImageMimeType: string = "image/png"; // Default MIME type

     // Check candidates and parts for image data
     // Access candidates directly on the top-level response object
     if (generationResponse.candidates && generationResponse.candidates.length > 0) {
         const candidate = generationResponse.candidates[0];
         if (candidate.content && candidate.content.parts) {
             for (const part of candidate.content.parts) {
                // Check specifically for inlineData which holds the generated image
                if (part.inlineData && typeof part.inlineData.data === 'string') {
                    generatedImageBase64 = part.inlineData.data;
                    generatedImageMimeType = part.inlineData.mimeType ?? "image/png"; // Use provided MIME type or default
                    break; // Found the image data
                }
            }
        }
    }

     if (!generatedImageBase64) {
        // Log the response for debugging if no image is found
        console.error("Image generation response did not contain image data:", JSON.stringify(generationResponse, null, 2));
        throw new Error("No image was generated in the response");
    }

    // Create a data URI from the base64 data
    const dataUri = `data:${generatedImageMimeType};base64,${generatedImageBase64}`

    return {
      visualizationUrl: dataUri,
    }
  } catch (error) {
    console.error("Error in visualizeProduct:", error)
    return {
      visualizationUrl: "/placeholder.svg?height=400&width=400&text=Visualization+Failed",
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
