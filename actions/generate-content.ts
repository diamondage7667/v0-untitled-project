"use server"

import { GoogleGenAI, Modality } from "@google/genai" // Added Modality
import { HarmCategory, HarmBlockThreshold } from "@google/genai"
import * as fs from "node:fs"; // Added fs for potential saving (though we'll return data)


// Helper to get API Client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
    throw new Error("Server configuration error: Missing Gemini API Key.")
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Extracts JSON from text response
 */
export async function extractJsonFromText(text: string): Promise<any> {
  try {
    // Look for JSON in code blocks first
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch (e) {
        console.warn("Failed to parse JSON from code block, trying full text.")
      }
    }

    // Try parsing the whole text (or the first likely JSON object)
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (e) {
        console.warn("Failed to parse JSON from object match, trying direct parse.")
      }
    }

    // Try parsing the entire text directly
    try {
      return JSON.parse(text)
    } catch (e) {
      console.warn("Failed to parse direct JSON, attempting to extract structured data from text.")
      // Return a simple object with the text for fallback
      return { content: text }
    }
  } catch (error) {
    console.error("JSON extraction failed:", error)
    return { content: text, error: "Failed to parse as JSON" }
  }
}


/**
 * Generate image content using Gemini API
 */
export async function generateImage(prompt: string): Promise<{ text?: string; imageData?: string; error?: string }> {
  try {
    const genAI = getGenAIClient();
    // Use the specific image generation model from the example
    // Note: Ensure this model identifier is current and supported.
    // Available models might change. Consider making this configurable.
    // Corrected model access and request structure
    const requestPayload = {
      model: "gemini-2.0-flash-exp-image-generation", // Specify model here
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // Explicitly request IMAGE modality along with TEXT
      generationConfig: {
        // Request JSON structure to easily parse parts if needed, though direct access is often fine
        // responseMimeType: "application/json",
        responseModalities: [Modality.IMAGE, Modality.TEXT], // Request both image and text
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    };

    // Generate content using the correct method
    const result = await genAI.models.generateContent(requestPayload);

    // Check response structure carefully (accessing properties directly on result)
    if (!result || !result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts) {
      console.error("Invalid response structure from Gemini Image API:", JSON.stringify(result, null, 2));
      throw new Error("Received invalid response structure from Gemini Image API");
    }

    let responseText: string | undefined = undefined;
    let responseImageData: string | undefined = undefined;

    // Process parts to find text and image data (accessing properties directly on result)
    for (const part of result.candidates[0].content.parts) {
      if (part.text) {
        responseText = (responseText ? responseText + "\n" : "") + part.text; // Concatenate if multiple text parts
      } else if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) { // Added optional chaining for safety
        // Assuming only one image part is expected per call based on typical usage
        if (responseImageData) {
            console.warn("Multiple image parts received, using the first one.");
        } else {
            responseImageData = part.inlineData.data; // Base64 encoded image data
        }
      }
    }

    // It's possible to get a response with only text or only image, or neither if blocked/error
    if (!responseImageData && !responseText) {
        // Check for safety blocks or other reasons for empty content (accessing properties directly on result)
        if (result.promptFeedback?.blockReason) {
            console.warn(`Image generation blocked: ${result.promptFeedback.blockReason}`);
            return { error: `Image generation blocked: ${result.promptFeedback.blockReason}` };
        } else {
            console.warn("No text or image data found in the response parts:", JSON.stringify(result.candidates[0].content.parts, null, 2));
            return { error: "No content generated." };
        }
    }


    return { text: responseText, imageData: responseImageData };

  } catch (error) {
    console.error("Error in generateImage:", error);
    // Ensure the error object structure is consistent
    const errorMessage = error instanceof Error ? error.message : "Unknown error generating image";
    return {
      error: errorMessage,
      text: `Failed to generate image content: ${errorMessage}`, // Include error in text for user feedback
    };
  }
}

/**
 * Generate content using Gemini API
 */
export async function generateContent(prompt: string, systemInstruction?: string): Promise<any> {
  try {
    const genAI = getGenAIClient()
    // Corrected: Specify model directly in the request payload

    const generationConfig = {
      temperature: 0.7, // Keep existing text generation config
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }

    // Prepare the request payload
    const requestPayload = systemInstruction
      ? {
          model: "gemini-2.5-flash", // Specify model here
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        }
      : {
          model: "gemini-2.5-flash", // Specify model here
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        }

    // Generate content using the correct method
    const result = await genAI.models.generateContent(requestPayload)

    // Check if response has the expected structure (accessing properties directly on result)
    if (!result) { // Simpler check, rely on text() method presence
      console.error("Invalid response structure from Gemini API (result is null/undefined):", result)
      throw new Error("Received invalid response structure from Gemini API")
    }

    // Extract text from response (accessing property directly on result)
    // Add a check for result existence although line 195 should cover it
    if (!result) {
        console.error("Result object is unexpectedly null/undefined after check.");
        throw new Error("Internal error: Result became null unexpectedly.");
    }
    // Access text as a property, not a method
    const responseText = result.text;

    // Check if responseText is actually a string before proceeding
    if (typeof responseText !== 'string') {
        console.warn("Response text is not a string:", responseText);
        // Handle cases where text might be missing or not a string
        // If JSON extraction is the goal, maybe check candidates/parts directly?
        // For now, return an empty content object if text is not usable.
        try {
            // Attempt to extract from parts if text property is missing/wrong type
             const textPart = result.candidates?.[0]?.content?.parts?.find(p => p.text);
             if (textPart?.text) {
                 console.warn("Using text from parts as result.text was not a string.");
                 const extractedText = textPart.text;
                 if (extractedText.includes("{") && extractedText.includes("}")) {
                    return await extractJsonFromText(extractedText);
                 }
                 return { content: extractedText };
             }
        } catch (e) {
             console.error("Error trying to extract text from parts:", e);
        }
        return { content: "" }; // Fallback if text cannot be retrieved
    }

    // Try to parse as JSON if needed
    if (responseText.includes("{") && responseText.includes("}")) {
      try {
        return await extractJsonFromText(responseText)
      } catch (error) {
        console.warn("Failed to parse response as JSON, returning raw text")
        return { content: responseText }
      }
    }

    return { content: responseText }
  } catch (error) {
    console.error("Error in generateContent:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      content: "Failed to generate content. Please try again.",
    }
  }
}
