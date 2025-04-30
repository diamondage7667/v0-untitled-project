"use server";

// Define the expected response structure from Creatomate API
interface CreatomateRenderStatus {
    id: string;
    status: 'planned' | 'waiting' | 'rendering' | 'succeeded' | 'failed' | string; // Allow other statuses
    url?: string; // URL is present on success
    error_message?: string; // Present on failure
    // Add other fields if needed based on Creatomate docs
}

// Define the response structure for this action
interface GetCreatomateStatusResponse {
    success: boolean;
    status?: string;
    url?: string;
    errorMessage?: string;
    error?: string; // For internal errors in this action
}

const API_ENDPOINT_BASE = "https://api.creatomate.com/v1/renders";

export async function getCreatomateRenderStatus(renderId: string): Promise<GetCreatomateStatusResponse> {
    const apiKey = process.env.CREATOMATE_API_KEY;

    if (!apiKey) {
        return { success: false, error: "Server config error: Missing Creatomate API Key." };
    }
    if (!renderId) {
        return { success: false, error: "Render ID is required to check status." };
    }

    const url = `${API_ENDPOINT_BASE}/${renderId}`;
    console.log(`Checking Creatomate render status for ID: ${renderId}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
            },
             // Add cache: 'no-store' to prevent caching issues during polling
            cache: 'no-store',
        });

        console.log(`Creatomate Status API Response: ${response.status} ${response.statusText}`);

        if (response.status === 404) {
             console.warn(`Creatomate render ${renderId} not found (404).`);
             return { success: false, error: `Render ${renderId} not found.` };
        }

        const data: CreatomateRenderStatus = await response.json();
        console.log("Parsed Creatomate Status Response:", data);


        if (!response.ok) {
            const errorDetails = data.error_message || JSON.stringify(data);
            console.error(`Creatomate Status API Error (${response.status}): ${errorDetails}`);
            return { success: false, error: `API request failed: ${response.status}. ${errorDetails}` };
        }

        return {
            success: true,
            status: data.status,
            url: data.url,
            errorMessage: data.error_message,
        };

    } catch (error: unknown) {
        console.error(`Error checking Creatomate render status for ${renderId}:`, error);
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Failed to check render status: ${message}` };
    }
}
