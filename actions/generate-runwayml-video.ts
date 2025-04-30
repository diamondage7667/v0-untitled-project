"use server";

import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';

// Define the structure for each slide input (matching frontend)
interface SlideInput {
  frameUrl: string; // Image data URI
  caption?: string; // Optional manual caption
}

// Define the input parameters for the RunwayML action
interface RunwayMLVideoParams {
  slides: SlideInput[];
  aspectRatio: "16:9" | "1:1" | "9:16"; // Match frontend options
  seed?: number;
  duration?: number; // Optional duration, defaults to 10 in API call
  promptTextOverride?: string; // Optional override for prompt text
  model?: "gen4_turbo" | "gen3a_turbo"; // Optional model selection
}

// Define the response structure for this action (success returns task ID)
interface RunwayMLSubmitResponse {
  success: true;
  taskId: string;
}
export interface RunwayMLErrorResponse { // Add export
  success: false;
  error: string;
}

const API_ENDPOINT = "https://api.runwayml.com/v1/image_to_video"; // Corrected endpoint
const API_VERSION = "2024-11-06"; // Required header value
const GCS_BUCKET_NAME = "siphonhf"; // Reusing GCS Bucket Name

// Initialize GCS Client
const storage = new Storage({ projectId: "intelarts" });
const bucket = storage.bucket(GCS_BUCKET_NAME);

// Helper to extract Base64 data and format from data URI
function getBase64FromDataUri(dataUri: string): { format: string; data: string } | null {
  const match = dataUri.match(/^data:image\/(\w+);base64,(.*)$/);
  return match ? { format: match[1] || 'png', data: match[2] } : null;
}

// Helper function to map aspect ratio string to API format
// Note: gen4_turbo and gen3a_turbo support different ratios
function mapRatioToRunway(ratio: "16:9" | "1:1" | "9:16", model: string): string {
    // Defaults for gen4_turbo
    let mappedRatio = "1280:720"; // Default 16:9 for gen4
    if (model === "gen3a_turbo") {
        mappedRatio = "1280:768"; // Default for gen3a
    }

    switch (ratio) {
        case '16:9':
            mappedRatio = model === "gen3a_turbo" ? "1280:768" : "1280:720"; // Adjust based on model
            break;
        case '1:1':
             mappedRatio = model === "gen4_turbo" ? "960:960" : "1024:1024"; // gen3a doesn't officially list 1:1, using common square
             if (model === "gen3a_turbo") console.warn("1:1 ratio might not be optimal for gen3a_turbo");
            break;
        case '9:16':
            mappedRatio = model === "gen3a_turbo" ? "768:1280" : "720:1280"; // Adjust based on model
            break;
    }
     // Add other supported ratios if needed, e.g., "1104:832", "1584:672" for gen4_turbo
    console.log(`Mapping frontend ratio ${ratio} to Runway ratio ${mappedRatio} for model ${model}`);
    return mappedRatio;
}


export async function generateRunwaymlVideo(
  params: RunwayMLVideoParams
): Promise<RunwayMLSubmitResponse | RunwayMLErrorResponse> {
  const apiKey = process.env.RUNWAYML_API_SECRET; // Use correct env var name
  const { slides, aspectRatio, seed, duration, promptTextOverride, model = "gen4_turbo" } = params; // Default to gen4_turbo

  if (!apiKey) {
    return { success: false, error: "Server config error: Missing RunwayML API Key (RUNWAYML_API_SECRET)." };
  }
  if (!slides || slides.length === 0) {
    return { success: false, error: "No slides provided for video generation." };
  }

  // --- Prepare Inputs ---
  const firstSlide = slides[0];
  const imageData = getBase64FromDataUri(firstSlide.frameUrl);

  if (!imageData) {
    return { success: false, error: "Could not extract image data from the first slide." };
  }

  // --- Upload First Image to GCS ---
  const gcsUploadPrefix = `tmp-runwayml-images/${crypto.randomBytes(16).toString("hex")}`;
  const imageFileName = `prompt-image.${imageData.format}`;
  const gcsPath = `${gcsUploadPrefix}/${imageFileName}`;
  const file = bucket.file(gcsPath);
  const imageBuffer = Buffer.from(imageData.data, "base64");
  let promptImageUrl = "";

  console.log(`Uploading prompt image to GCS bucket '${GCS_BUCKET_NAME}' at '${gcsPath}'`);
  try {
    await file.save(imageBuffer, {
      metadata: { contentType: `image/${imageData.format}` },
      public: true,
    });
    promptImageUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${gcsPath}`;
    console.log(`Uploaded prompt image to GCS: ${promptImageUrl}`);
  } catch (error) {
    console.error(`Error uploading prompt image to GCS:`, error);
    return { success: false, error: `Failed to upload prompt image to storage. ${error instanceof Error ? error.message : String(error)}` };
  }

  // --- Construct Payload ---
  const promptText = promptTextOverride || slides.map(s => s.caption || '').filter(Boolean).join('. ') || "Animate this image."; // Use override or concatenate captions
  const ratioString = mapRatioToRunway(aspectRatio, model);

  const payload: Record<string, any> = {
    promptImage: promptImageUrl,
    model: model, // gen4_turbo or gen3a_turbo
    promptText: promptText.substring(0, 1000), // Ensure max length
    ratio: ratioString,
    duration: duration ?? 10, // Default to 10 seconds for RunwayML
  };

  if (seed !== undefined) {
    payload.seed = seed;
  }

  console.log("Sending payload to RunwayML API:", JSON.stringify(payload, null, 2));

  // --- API Call ---
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, // Correct header scheme
        'X-Runway-Version': API_VERSION, // Required version header
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Explicitly accept JSON
      },
      body: JSON.stringify(payload),
    });

    console.log(`RunwayML API Response Status: ${response.status} ${response.statusText}`);

    const responseData = await response.json(); // RunwayML returns JSON
    console.log("Raw RunwayML API Response Body:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      const errorDetails = responseData.message || responseData.error || JSON.stringify(responseData);
      console.error(`RunwayML API Error (${response.status}): ${errorDetails}`);
      return { success: false, error: `API request failed: ${response.status}. ${errorDetails}` };
    }

    // On success (200 OK), expect a task ID
    if (!responseData.id || typeof responseData.id !== 'string') {
        console.error("Could not find task ID in RunwayML response:", responseData);
        return { success: false, error: "API response did not contain a valid task ID." };
    }

    console.log("RunwayML task submission succeeded! Task ID:", responseData.id);
    return { success: true, taskId: responseData.id };

  } catch (error: unknown) {
    console.error("Error calling RunwayML API:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to submit video generation task: ${message}` };
  } finally {
      // Optional: Add GCS cleanup logic here
      console.log(`GCS cleanup for prefix '${gcsUploadPrefix}' can be implemented here if needed.`);
  }
}
