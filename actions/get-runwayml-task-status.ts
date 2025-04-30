"use server";

// Define the expected response structure from the RunwayML /v1/tasks/{id} endpoint
// Based on the documentation provided in the feedback
interface RunwayMLTaskStatus {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "THROTTLED" | string; // Allow for other potential statuses
  createdAt: string;
  // Add fields that might appear on completion, based on typical patterns
  // The documentation doesn't explicitly show the success response structure,
  // so we assume common fields like 'url' or 'outputs'. Adjust as needed.
  url?: string; // Common field for output URL
  outputs?: { url?: string; [key: string]: any }; // Another common pattern
  error?: { message?: string; code?: string }; // Structure for errors if status is FAILED
  errorMessage?: string; // Alternative error message field
}

// Define the response structure for this action
interface GetRunwayMLStatusResponse {
  success: boolean;
  status?: string; // The status string from the API
  videoUrl?: string; // The final video URL if succeeded
  error?: string; // Error message if polling failed or task failed
}

const API_ENDPOINT_BASE = "https://api.runwayml.com/v1/tasks";
const API_VERSION = "2024-11-06"; // Required header value

export async function getRunwaymlTaskStatus(
  taskId: string
): Promise<GetRunwayMLStatusResponse> {
  const apiKey = process.env.RUNWAYML_API_SECRET; // Use correct env var name

  if (!apiKey) {
    return { success: false, error: "Server config error: Missing RunwayML API Key (RUNWAYML_API_SECRET)." };
  }
  if (!taskId) {
    return { success: false, error: "Task ID is required to check status." };
  }

  const url = `${API_ENDPOINT_BASE}/${taskId}`;
  console.log(`Checking RunwayML task status for ID: ${taskId} at URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': API_VERSION,
        'Accept': 'application/json',
      },
      // Add cache: 'no-store' to prevent caching issues during polling
      cache: 'no-store',
    });

    console.log(`RunwayML Task Status API Response Status: ${response.status} ${response.statusText}`);

    if (response.status === 404) {
        console.warn(`RunwayML task ${taskId} not found (404). It might be deleted, canceled, or invalid.`);
        return { success: false, error: `Task ${taskId} not found. It may have been canceled or deleted.` };
    }

    const responseData: RunwayMLTaskStatus = await response.json();
    console.log("Raw RunwayML Task Status API Response Body:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      // Handle other non-404 errors
      const errorDetails = responseData.error?.message || responseData.errorMessage || JSON.stringify(responseData);
      console.error(`RunwayML Task Status API Error (${response.status}): ${errorDetails}`);
      return { success: false, error: `API request failed: ${response.status}. ${errorDetails}` };
    }

    // Process the status
    const status = responseData.status;
    let videoUrl: string | undefined = undefined;
    let errorMessage: string | undefined = undefined;

    if (status === "SUCCEEDED") {
      // Extract the video URL - adjust based on actual API response structure
      // Checking common possibilities: responseData.url, responseData.outputs.url
      videoUrl = responseData.url || responseData.outputs?.url;
      if (!videoUrl) {
        console.error("Task succeeded but could not find video URL in response:", responseData);
        errorMessage = "Task succeeded, but the video URL was not found in the response.";
      } else {
        console.log(`RunwayML task ${taskId} succeeded. Video URL: ${videoUrl}`);
      }
    } else if (status === "FAILED" || status === "ABORTED") {
      errorMessage = responseData.error?.message || responseData.errorMessage || `Task ${status.toLowerCase()}.`;
      console.error(`RunwayML task ${taskId} ${status.toLowerCase()}: ${errorMessage}`);
    } else {
      console.log(`RunwayML task ${taskId} status: ${status}`);
    }

    return {
      success: !errorMessage, // Success is true only if no error message was set
      status: status,
      videoUrl: videoUrl,
      error: errorMessage,
    };

  } catch (error: unknown) {
    console.error(`Error checking RunwayML task status for ${taskId}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to check task status: ${message}` };
  }
}
