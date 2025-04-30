// types/image-generator-types.ts

// Core Types
export type ApiProvider = "gemini" | "openai";
export type Mode = "generate" | "edit";

// OpenAI Types
export type OpenAIProviderOperation = "generate" | "edit" | "variation";
export type OpenAIModel = "gpt-image-1" | "dall-e-3" | "dall-e-2";
export type OpenAIQuality = "auto" | "high" | "medium" | "low" | "hd" | "standard";
export type OpenAIGenerationSize =
  | "auto"
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "512x512"
  | "256x256";
export type OpenAIEditSize = "auto" | "1024x1024" | "512x512" | "256x256";
export type OpenAIVariationSize = "256x256" | "512x512" | "1024x1024";
export type OpenAIStyle = "vivid" | "natural";
export type OpenAIOutputFormat = "png" | "jpeg" | "webp";
export type OpenAIBackground = "auto" | "transparent" | "opaque";

// Ideogram Types
export type IdeogramStyle =
  | "AUTO"
  | "REALISTIC"
  | "GENERAL"
  | "ANIME"
  | "DESIGN"
  | "RENDER_3D";
export type IdeogramAspectRatio =
  | "ASPECT_1_1"
  | "ASPECT_16_9"
  | "ASPECT_9_16"
  | "ASPECT_4_3"
  | "ASPECT_3_4";

// Video Types
export type VideoModel = "segmind-video";

// Constants
export const MAX_UPLOAD_IMAGES = 4;

export const IDEOGRAM_STYLE_OPTIONS: { id: IdeogramStyle; name: string }[] = [
  { id: "AUTO", name: "Auto" },
  { id: "REALISTIC", name: "Realistic" },
  { id: "GENERAL", name: "General" },
  { id: "ANIME", name: "Anime" },
  { id: "DESIGN", name: "Design" },
  { id: "RENDER_3D", name: "3D Render" },
];

export const IDEOGRAM_ASPECT_RATIO_OPTIONS: { id: IdeogramAspectRatio; name: string }[] = [
  { id: "ASPECT_1_1", name: "Square (1:1)" },
  { id: "ASPECT_16_9", name: "Landscape (16:9)" },
  { id: "ASPECT_9_16", name: "Portrait (9:16)" },
  { id: "ASPECT_4_3", name: "Standard (4:3)" },
  { id: "ASPECT_3_4", name: "Portrait (3:4)" },
];

export const OPENAI_MODELS: { id: OpenAIModel; name: string }[] = [
  { id: "gpt-image-1", name: "GPT Image 1" },
  { id: "dall-e-3", name: "DALL-E 3" },
  { id: "dall-e-2", name: "DALL-E 2" },
];

export const OPENAI_QUALITY_OPTIONS: Record<OpenAIModel, { id: string; name: string }[]> = {
  "gpt-image-1": [
    { id: "auto", name: "Auto" },
    { id: "high", name: "High" },
    { id: "medium", name: "Medium" },
    { id: "low", name: "Low" },
  ],
  "dall-e-3": [
    { id: "auto", name: "Auto" },
    { id: "hd", name: "HD" },
    { id: "standard", name: "Standard" },
  ],
  "dall-e-2": [{ id: "standard", name: "Standard" }],
};

export const OPENAI_GENERATE_SIZE_OPTIONS: Record<OpenAIModel, { id: string; name: string }[]> = {
  "gpt-image-1": [
    { id: "auto", name: "Auto" },
    { id: "1024x1024", name: "1024x1024" },
    { id: "1536x1024", name: "1536×1024 (Landscape)" },
    { id: "1024x1536", name: "1024×1536 (Portrait)" },
  ],
  "dall-e-3": [
    { id: "1024x1024", name: "1024x1024" },
    { id: "1792x1024", name: "1792×1024 (Landscape)" },
    { id: "1024x1792", name: "1024×1792 (Portrait)" },
  ],
  "dall-e-2": [
    { id: "1024x1024", name: "1024x1024" },
    { id: "512x512", name: "512x512" },
    { id: "256x256", name: "256x256" },
  ],
};

export const OPENAI_EDIT_VARIATION_SIZE_OPTIONS: { id: string; name: string }[] = [
  { id: "auto", name: "Auto" },
  { id: "1024x1024", name: "1024x1024" },
  { id: "512x512", name: "512x512" },
  { id: "256x256", name: "256x256" },
];

export const OPENAI_STYLE_OPTIONS: { id: OpenAIStyle; name: string }[] = [
  { id: "vivid", name: "Vivid" },
  { id: "natural", name: "Natural" },
];

export const OPENAI_OUTPUT_FORMAT_OPTIONS: { id: OpenAIOutputFormat; name: string }[] = [
  { id: "png", name: "PNG" },
  { id: "jpeg", name: "JPEG" },
  { id: "webp", name: "WEBP" },
];

export const OPENAI_BACKGROUND_OPTIONS: { id: OpenAIBackground; name: string }[] = [
  { id: "auto", name: "Auto" },
  { id: "transparent", name: "Transparent" },
  { id: "opaque", name: "Opaque" },
];

export const VIDEO_MODEL_OPTIONS: { id: VideoModel; name: string }[] = [
  { id: "segmind-video", name: "Segmind" },
];
