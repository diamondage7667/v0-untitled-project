"use server";

import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from "@google/generative-ai";

// Define input/output types
interface SlideInput {
  frameUrl: string; // Image data URI
  caption?: string; // Optional manual caption
}

interface SegmindRequest {
  slides: SlideInput[];
  aspectRatio: "16:9" | "1:1" | "9:16"; // Although not directly used by Segmind API example, keep for consistency?
}

interface SegmindResponse {
  success: boolean;
  videoUrl?: string; // URL of the generated video if successful
  error?: string;
}

// Helper to extract Base64 data and format from data URI
function getBase64FromDataUri(dataUri: string): { format: string; data: string } | null {
  const match = dataUri.match(/^data:image\/(\w+);base64,(.*)$/);
  return match ? { format: match[1] || 'png', data: match[2] } : null;
}

// Helper function to safely get text from Gemini response
function safeGetResponseText(response: any): string {
    try {
        if (!response || !response.candidates || response.candidates.length === 0) {
            console.warn("Gemini response is invalid or empty.");
            return "";
        }
        if (response.promptFeedback?.blockReason) {
          console.warn(`Gemini content generation blocked: ${response.promptFeedback.blockReason}`);
          return "";
        }
        const textPart = response.candidates[0]?.content?.parts?.find((part: Part) => 'text' in part);
        if (textPart && typeof textPart.text === 'string') {
            return textPart.text.trim();
        } else {
            console.warn("Gemini response did not contain valid text part.");
            return "";
        }
    } catch (e) {
        console.error("Error extracting text from Gemini response:", e);
        return "";
    }
}

const SEGMIND_API_URL = "https://api.segmind.com/v1/wan2.1-i2v-720p";

export async function generateSegmindVideo(
  request: SegmindRequest
): Promise<SegmindResponse> {
  const segmindApiKey = process.env.SEGMIND_API_KEY; // Ensure SEGMIND_API_KEY is set in .env
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!segmindApiKey) {
    return { success: false, error: "Server config error: Missing Segmind API Key." };
  }
  if (!geminiApiKey) {
    return { success: false, error: "Server config error: Missing Gemini API Key (for prompt generation)." };
  }
  if (!request.slides || request.slides.length === 0) {
    return { success: false, error: "No slides provided for Segmind generation." };
  }

  const firstSlide = request.slides[0];
  const imageData = getBase64FromDataUri(firstSlide.frameUrl);

  if (!imageData) {
    return { success: false, error: "Could not extract image data from the first slide." };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let videoPrompt = "A short video based on the provided image."; // Default prompt

  // --- Generate Prompt using Gemini Vision ---
  try {
    console.log("Generating video prompt based on first image for Segmind...");
    const imagePart = { inlineData: { data: imageData.data, mimeType: `image/${imageData.format}` } };
    const promptParts: Part[] = [
        { text: "Describe this image in detail for a video generation prompt. Focus on the main subject, action (or implied action), setting, and overall mood. Be concise but descriptive." },
        imagePart,
    ];
    if (firstSlide.caption) {
        promptParts.push({ text: `Consider this user-provided caption as well: "${firstSlide.caption}"` });
    }

    const result = await visionModel.generateContent({ contents: [{ role: "user", parts: promptParts }] });
    const generatedText = safeGetResponseText(result.response);

    if (generatedText) {
      videoPrompt = generatedText;
      console.log("Generated Segmind Prompt:", videoPrompt);
    } else {
      console.warn("Could not generate a specific prompt from Gemini Vision, using default.");
      if (firstSlide.caption) {
        videoPrompt = `A short video about: ${firstSlide.caption}`; // Fallback using caption
      }
    }
  } catch (error) {
    console.error("Error generating prompt with Gemini Vision:", error);
     if (firstSlide.caption) {
        videoPrompt = `A short video about: ${firstSlide.caption}`;
     }
     console.warn("Using fallback prompt for Segmind due to Gemini Vision error.");
  }

  // --- Call Segmind API ---
  const payload = {
    prompt: videoPrompt,
    negative_prompt: "blurry, bad quality, camera shake, distortion, poor composition, low resolution, artifact, watermark", // Default negative prompt
    image: imageData.data, // Base64 image data
    seed: Math.floor(Math.random() * 100000000), // Random seed
    video_length: 3, // Default length from example
    resolution: 720, // Default resolution from example
    steps: 30, // Default steps from example
    base64: false // Request URL instead of base64 video data
  };

  console.log("Sending request to Segmind API...");

  try {
    const response = await axios.post(SEGMIND_API_URL, payload, {
      headers: { 'x-api-key': segmindApiKey }
    });

    console.log("Segmind API Response Status:", response.status);
    // console.log("Segmind API Response Data:", response.data); // Log raw data if needed

    // Assuming the API returns the video URL directly when base64 is false
    // Adjust based on actual API response structure
    if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
       return { success: true, videoUrl: response.data };
    } else if (response.data?.video_url) { // Check for a common alternative structure
        return { success: true, videoUrl: response.data.video_url };
    } else if (response.data?.url) { // Another common alternative
        return { success: true, videoUrl: response.data.url };
    } else {
       console.error("Segmind API response did not contain a valid video URL:", response.data);
       return { success: false, error: "Segmind API did not return a valid video URL." };
    }

  } catch (error: unknown) {
    console.error('Error calling Segmind API:', error instanceof axios.AxiosError ? error.response?.data || error.message : error);
    const message = error instanceof axios.AxiosError
      ? error.response?.data?.message || error.response?.data || error.message
      : String(error);
    return { success: false, error: `Segmind API request failed: ${message}` };
  }
}
