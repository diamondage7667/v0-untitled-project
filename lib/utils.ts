import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Data URL string into a File object.
 * @param dataurl The Data URL string.
 * @param filename The desired filename for the output File object.
 * @returns A Promise that resolves with the File object.
 */
export async function dataURLtoFile(dataurl: string, filename: string): Promise<File> {
  // Check if the input is a valid data URL
  if (!dataurl || !dataurl.startsWith('data:')) {
    throw new Error('Invalid data URL provided.');
  }

  try {
    const res = await fetch(dataurl);
    if (!res.ok) {
      throw new Error(`Failed to fetch data URL: ${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    if (!blob) {
        throw new Error('Failed to convert data URL to Blob.');
    }
    // Use blob.type if available, otherwise try to infer or default
    const mimeType = blob.type || dataurl.split(':')[1]?.split(';')[0] || 'application/octet-stream';
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Error converting data URL to File:", error);
    // Re-throw a more specific error or handle as needed
    throw new Error(`Could not convert data URL to File: ${error instanceof Error ? error.message : String(error)}`);
  }
}
