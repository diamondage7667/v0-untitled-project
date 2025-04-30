import OpenAI from "openai";
import type {
  OpenAIModel,
  OpenAIQuality,
  OpenAIGenerationSize,
  OpenAIStyle,
  OpenAIOutputFormat,
  OpenAIBackground,
} from "@/types/image-generator-types";

const openai = new OpenAI();

type GenerateOpenAIImageParams = {
  prompt: string;
  model: OpenAIModel;
  n: number;
  quality: OpenAIQuality | null;
  size: OpenAIGenerationSize | null;
  style: OpenAIStyle | null;
  output_format: OpenAIOutputFormat | null;
  background: OpenAIBackground | null;
};

type GenerateOpenAIImageResponse = {
  success: boolean;
  images?: { b64_json: string; url: string }[];
  error?: string;
};

export const generateOpenAIImage = async ({
  prompt,
  model,
  n,
  quality,
  size,
  style,
  output_format,
  background,
}: GenerateOpenAIImageParams): Promise<GenerateOpenAIImageResponse> => {
  try {
    const response = await openai.images.generate({
      prompt,
      model,
      n,
      quality,
      size,
      style,
      response_format: "b64_json",
      output_format,
      background,
    });

    const images = response.data.map((image) => ({
      b64_json: image.b64_json || "",
      url: image.url || "",
    }));

    return { success: true, images };
  } catch (error: any) {
    console.error("Error generating image:", error);
    return { success: false, error: error.message };
  }
};
