import { ImageGenerator } from "@/components/image-generator"

export default function ImageGeneratorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <ImageGenerator apiKey={process.env.GEMINI_API_KEY} />
    </main>
  )
}
