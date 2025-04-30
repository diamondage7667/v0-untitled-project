"use server";

// Revert to original import name
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

// Helper to extract Base64 data from data URI (only need data part)
function getBase64FromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:image\/\w+;base64,(.*)$/);
  return match ? match[1] : null;
}

// Helper function to safely get text from Gemini response - Access response.text as property
function safeGetResponseText(response: GenerateContentResponse | undefined): string {
    try {
        if (!response) {
            console.warn("Gemini response object is undefined.");
            return "";
        }
        // Check for safety ratings or block reasons before attempting to get text
        if (response.promptFeedback?.blockReason) {
          console.warn(`Gemini content generation blocked: ${response.promptFeedback.blockReason}`);
          return ""; // Return empty if blocked
        }
        // Access text as a property
        const textContent = response.text;
        if (typeof textContent === 'string') {
            return textContent.trim();
        } else {
            // It seems .text might not always be present or could be undefined/null
            console.warn("Gemini response.text was not a string or was absent. Type:", typeof textContent);
            return "";
        }
    } catch (e) {
        console.error("Error extracting text from Gemini response:", e);
        return "";
    }
}

interface GenerateCaptionRequest {
  imageDataUri: string;
  model?: string; // Optional model override
  style?: 'social media reel caption' | 'product description' | 'general'; // Optional style
}

interface GenerateCaptionResponse {
  success: boolean;
  caption?: string;
  error?: string;
}

const DEFAULT_GEMINI_VISION_MODEL = "gemini-2.0-flash"; // Changed default model

// Function to generate the prompt text based on style
function getPromptForStyle(style?: GenerateCaptionRequest['style']): string {
  switch (style) {
    case 'social media reel caption':
      return "Generate a very short (max 10 words), punchy, and engaging caption for this image, suitable for a fast-paced social media reel. Use emojis if appropriate. Only return the caption text.";
    case 'product description':
      return "Describe the key features or the overall vibe of the product shown in this image in a concise sentence (max 15 words).";
    case 'general':
    default:
      return "Briefly describe this image in a few words (max 10 words).";
  }
}


export async function generateCaption(
  request: GenerateCaptionRequest
): Promise<GenerateCaptionResponse> {
  const { imageDataUri, model, style } = request; // Destructure request
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return { success: false, error: "Server config error: Missing Gemini API Key." };
  }

  const base64Data = getBase64FromDataUri(imageDataUri); // Use destructured variable
  if (!base64Data) {
    return { success: false, error: "Invalid image data URI provided." };
  }

  // Correct instantiation with apiKey in options object
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const imagePart: Part = { inlineData: { mimeType: 'image/png', data: base64Data } }; // Assuming png, add type Part
  const promptText: Part = { text: getPromptForStyle(style) }; // Get prompt based on style, add type Part
  const targetModel = model || DEFAULT_GEMINI_VISION_MODEL; // Use provided model or default

  try {
    console.log(`Generating caption with Gemini model: ${targetModel}, Style: ${style || 'default'}`);
    // Call generateContent directly on the ai instance, specifying the model
    const result = await ai.models.generateContent({
        model: targetModel,
        contents: [{ role: 'user', parts: [promptText, imagePart] }] // Structure contents correctly
    });

    // Access the response object from the result
    const response = result; // The result itself is the response object
    const generatedText = safeGetResponseText(response); // Pass the response object

    // Handle potential lack of text or blocked response more robustly
    if (!generatedText && response?.promptFeedback?.blockReason) {
       console.warn(`Caption generation blocked: ${response.promptFeedback.blockReason}`);
       return { success: false, error: `Caption generation blocked: ${response.promptFeedback.blockReason}` };
    }

    const caption = generatedText || "AI caption generation failed or returned empty."; // More specific fallback
    console.log("Generated Caption:", caption);
    // Only return success true if we actually got a caption text
    return { success: !!generatedText, caption: caption };

  } catch (err) {
    console.error("Error generating caption with Gemini:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to generate caption: ${message}` };
  }
}
