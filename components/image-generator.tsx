// ImageGenerator.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { editImage } from "@/actions/generate-images" // Gemini Standard Edit remains
import { remixIdeogramImage } from "@/actions/ideogram-api"
import { analyzeImages } from "@/actions/analyze-images"
import { generateSegmindVideo } from "@/actions/generate-segmind-video"
// --- OpenAI Imports ---
import { generateOpenAIImage } from "@/actions/openai-image-generation"
import { editOpenAIImage } from "@/actions/openai-image-edit"
import { createOpenAIImageVariation } from "@/actions/openai-image-variation"
// --- Type Imports ---
import type {
  ApiProvider,
  Mode,
  OpenAIProviderOperation,
  OpenAIModel,
  OpenAIQuality,
  OpenAIGenerationSize,
  OpenAIEditSize,
  OpenAIVariationSize,
  OpenAIStyle,
  OpenAIOutputFormat,
  OpenAIBackground,
  IdeogramStyle,
  IdeogramAspectRatio,
  VideoModel,
} from "@/types/image-generator-types"
import {
  MAX_UPLOAD_IMAGES,
  IDEOGRAM_STYLE_OPTIONS,
  IDEOGRAM_ASPECT_RATIO_OPTIONS,
  OPENAI_MODELS,
  OPENAI_QUALITY_OPTIONS,
  OPENAI_GENERATE_SIZE_OPTIONS,
  OPENAI_EDIT_VARIATION_SIZE_OPTIONS,
  OPENAI_STYLE_OPTIONS,
  OPENAI_OUTPUT_FORMAT_OPTIONS,
  OPENAI_BACKGROUND_OPTIONS,
  VIDEO_MODEL_OPTIONS,
} from "@/types/image-generator-types"
// --- UI Imports ---
import { Loader2, Download, RefreshCw, ImageIcon, Wand2, Sparkles, X, Lightbulb, Zap, Film, BrainCircuit, Bot } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch" // Added Switch import

// Helper to convert Data URL to File
const dataURLtoFile = async (dataurl: string, filename: string): Promise<File> => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/)!;
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) { u8arr[n] = bstr.charCodeAt(n) }
  return new File([u8arr], filename, { type: mime });
}

export function ImageGenerator() {
  // ... (other state variables remain the same)
  const [images, setImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("generate")
  const [useIdeogramEdit, setUseIdeogramEdit] = useState(false)
  const [selectedApiProvider, setSelectedApiProvider] = useState<ApiProvider>("openai")

  // Handler: API Provider Selection
  const handleApiProviderChange = (value: string) => { // Changed type to string
    setSelectedApiProvider(value as ApiProvider); // Cast to ApiProvider
  };

  // OpenAI-specific
  const [openaiOperation, setOpenaiOperation] = useState<OpenAIProviderOperation>("generate")
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>("gpt-image-1")
  const [openaiN, setOpenaiN] = useState(1)
  const [openaiQuality, setOpenaiQuality] = useState<string>("auto")
  const [openaiSize, setOpenaiSize] = useState<string>("auto")
  const [openaiStyle, setOpenaiStyle] = useState<OpenAIStyle | null>("vivid")
  const [openaiOutputFormat, setOpenaiOutputFormat] = useState<OpenAIOutputFormat | null>("png")
  const [openaiBackground, setOpenaiBackground] = useState<OpenAIBackground | null>("auto")
  const [maskImage, setMaskImage] = useState<string | null>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

  // Video
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState("")
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>("segmind-video")

  // Analysis
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])

  // Prompts
  const [generatePrompt, setGeneratePrompt] = useState("")
  const [editPrompt, setEditPrompt] = useState("")

  // Ideogram Edit
  const [ideogramImageWeight, setIdeogramImageWeight] = useState(50)
  const [ideogramSelectedStyle, setIdeogramSelectedStyle] = useState<IdeogramStyle>("REALISTIC")
  const [ideogramSelectedAspectRatio, setIdeogramSelectedAspectRatio] = useState<IdeogramAspectRatio>("ASPECT_1_1")

  // Handler: Generate
  const handleGenerate = async () => {
    if (!generatePrompt.trim() || isLoading || isGeneratingVideo || mode !== 'generate') return;
    setIsLoading(true); setError(null);
    try {
      let imgs: string[] = [];
      if (selectedApiProvider === "openai") {
        const res = await generateOpenAIImage({
          prompt: generatePrompt,
          model: openaiModel,
          n: openaiN,
          quality: openaiQuality === 'auto' ? null : openaiQuality as OpenAIQuality,
          size: openaiSize === 'auto' ? null : openaiSize as OpenAIGenerationSize,
          style: openaiModel === 'dall-e-3' ? openaiStyle : null,
          output_format: openaiModel === 'gpt-image-1' ? openaiOutputFormat : null,
          background: openaiModel === 'gpt-image-1' ? openaiBackground : null,
        });
        if (!res.success || !res.images) throw new Error(res.error || 'Gen failed');
        imgs = res.images.map(i => i.b64_json || i.url || '').filter(Boolean);
      } else if (selectedApiProvider === "gemini") {
        const r = await editImage({ imageUrl: '', prompt: generatePrompt, isExternalUrl: false }); // Assuming editImage can handle initial generation
        if (!r || !r.url) throw new Error(r?.url || 'Gem Gen fail');
        imgs = [r.url];
      }
      if (!imgs.length) throw new Error('No imgs');
      setImages(imgs); setSelectedImageIndex(0); setMode('edit');
    } catch (e) { setError((e as Error).message || 'Error'); setMode('generate'); setImages([]) }
    finally { setIsLoading(false) }
  };

  // --- Placeholder Handlers ---
  const handleGenerateVideo = async () => {
    console.log("handleGenerateVideo called");
    // Placeholder: Implement video generation logic here
    setVideoError("Video generation not yet implemented.");
  };

  const handleAnalyzeImages = async () => {
    console.log("handleAnalyzeImages called");
    // Placeholder: Implement image analysis logic here
    setImageAnalysis("Image analysis not yet implemented.");
  };
  // --- End Placeholder Handlers ---


  // Handler: Modify (OpenAI edit/variation + Gemini edit)
  const handleModify = async () => {
    const img = images[selectedImageIndex];
    if (!img || isLoading || isGeneratingVideo || mode !== 'edit') return;
    setIsLoading(true); setError(null);
    try {
      let urls: string[] = [];
      if (selectedApiProvider === 'openai') {
        if (openaiOperation === 'edit') {
          const r = await editOpenAIImage({
            image: img, prompt: editPrompt, mask: maskImage,
            model: openaiModel === 'gpt-image-1' ? 'gpt-image-1' : 'dall-e-2', n: openaiN,
            quality: openaiQuality === 'auto' ? null : openaiQuality as any,
            size: openaiSize === 'auto' ? null : openaiSize as OpenAIEditSize
          });
          if (!r.success || !r.images) throw new Error(r.error || 'Edit fail');
          urls = r.images.map(i => i.b64_json || i.url || '').filter(Boolean);
        } else {
          const r = await createOpenAIImageVariation({
            image: img, n: openaiN,
            size: openaiSize === 'auto' ? null : openaiSize as OpenAIVariationSize
          });
          if (!r.success || !r.images) throw new Error(r.error || 'Var fail');
          urls = r.images.map(i => i.b64_json || i.url || '').filter(Boolean);
        }
      } else {
        if (useIdeogramEdit) {
          const url = await remixIdeogramImage({
            prompt: editPrompt, imageFile: img,
            aspectRatio: ideogramSelectedAspectRatio, imageWeight: ideogramImageWeight,
            styleType: ideogramSelectedStyle
          }); if (!url) throw new Error('Remix fail'); urls = [url];
        } else {
          const r = await editImage({
            imageUrl: img, prompt: editPrompt,
            isExternalUrl: !img.startsWith('data:')
          }); if (!r || !r.url) throw new Error(r?.url || 'Gem Edit fail'); urls = [r.url];
        }
      }
      if (!urls.length) throw new Error('No imgs');
      setImages(prev => { const a = [...prev]; a[selectedImageIndex] = urls[0]; return a });
      setEditPrompt(''); setMaskImage(null);
    } catch (e) { setError((e as Error).message || 'Error') } finally { setIsLoading(false) }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Mode Toggle */}
      <RadioGroup defaultValue={mode} className="space-x-2" onValueChange={(value: string) => setMode(value as Mode)}>
        <RadioGroupItem value="generate" id="generate" />
        <Label htmlFor="generate">Generate</Label>
        <RadioGroupItem value="edit" id="edit" />
        <Label htmlFor="edit">Edit</Label>
      </RadioGroup>

      {/* Generate Mode */}
      {mode === "generate" && (
        <>
          {/* Image Generation Model Selection */}
          <RadioGroup defaultValue={selectedApiProvider} className="space-x-2" onValueChange={handleApiProviderChange}>
            <RadioGroupItem value="openai" id="openai-generate" />
            <Label htmlFor="openai-generate">OpenAI</Label>
            <RadioGroupItem value="gemini" id="gemini-generate" />
            <Label htmlFor="gemini-generate">Google</Label> 
          </RadioGroup>

          <Textarea
            placeholder="Enter your prompt here..."
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </>
      )}

      {/* Edit Mode */}
      {mode === "edit" && (
        <>
          {images.length === 0 ? (
            <p>No images generated yet. Switch to Generate mode to create some!</p>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))} disabled={selectedImageIndex === 0}>
                  Prev
                </Button>
                <img src={images[selectedImageIndex]} alt="Generated Image" className="max-h-64 max-w-64 rounded-md object-contain" />
                <Button onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))} disabled={selectedImageIndex === images.length - 1}>
                  Next
                </Button>
              </div>

              {/* API Provider Selection (Moved Here) */}
              <RadioGroup defaultValue={selectedApiProvider} className="space-x-2" onValueChange={handleApiProviderChange}>
                <RadioGroupItem value="openai" id="openai-edit" />
                <Label htmlFor="openai-edit">OpenAI</Label>
                <RadioGroupItem value="gemini" id="gemini-edit" />
                <Label htmlFor="gemini-edit">Google</Label> 
              </RadioGroup>

              {/* OpenAI Edit/Variation Options */}
              {selectedApiProvider === "openai" && (
                <>
                  <RadioGroup defaultValue={openaiOperation} className="space-x-2" onValueChange={(value: string) => setOpenaiOperation(value as OpenAIProviderOperation)}>
                    <RadioGroupItem value="edit" id="edit-openai" />
                    <Label htmlFor="edit-openai">Edit</Label>
                    <RadioGroupItem value="variation" id="variation-openai" />
                    <Label htmlFor="variation-openai">Variation</Label>
                  </RadioGroup>

                  {openaiOperation === "edit" && (
                    <>
                      <Textarea
                        placeholder="Describe the changes you'd like to make..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                      />

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => maskInputRef.current?.click()}>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {maskImage ? "Mask Image Added!" : "Add Mask Image"}
                        </Button>
                        <input
                          type="file"
                          accept="image/png"
                          className="hidden"
                          ref={maskInputRef}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setMaskImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        {maskImage && (
                          <Button variant="destructive" size="sm" onClick={() => setMaskImage(null)}>
                            <X className="mr-2 h-4 w-4" />
                            Remove Mask
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Common OpenAI Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="openai-model">Model</Label>
                      <Select value={openaiModel} onValueChange={(value: string) => setOpenaiModel(value as OpenAIModel)}>
                        <SelectTrigger id="openai-model">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPENAI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="openai-n">Number of Images</Label>
                      <Input
                        type="number"
                        id="openai-n"
                        value={openaiN}
                        onChange={(e) => setOpenaiN(Number(e.target.value))}
                        min="1"
                        max="10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="openai-size">Size</Label>
                      {/* Use OPENAI_EDIT_VARIATION_SIZE_OPTIONS for edit/variation */}
                      <Select value={openaiSize} onValueChange={(value: string) => setOpenaiSize(value as OpenAIEditSize)}>
                        <SelectTrigger id="openai-size">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* DALL-E 2 uses different sizes for edit/variation */}
                          {(openaiModel === 'dall-e-2' ? OPENAI_EDIT_VARIATION_SIZE_OPTIONS : OPENAI_GENERATE_SIZE_OPTIONS[openaiModel] || []).map((size) => (
                            <SelectItem key={size.id} value={size.id}>
                              {size.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {openaiModel === "gpt-image-1" && (
                      <>
                        <div>
                          <Label htmlFor="openai-quality">Quality</Label>
                          <Select value={openaiQuality} onValueChange={(value: string) => setOpenaiQuality(value as OpenAIQuality)}>
                            <SelectTrigger id="openai-quality">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(OPENAI_QUALITY_OPTIONS[openaiModel] || []).map((quality) => (
                                <SelectItem key={quality.id} value={quality.id}>
                                  {quality.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="openai-output-format">Output Format</Label>
                          <Select value={openaiOutputFormat ?? ""} onValueChange={(value: string) => setOpenaiOutputFormat(value as OpenAIOutputFormat)}>
                            <SelectTrigger id="openai-output-format">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPENAI_OUTPUT_FORMAT_OPTIONS.map((format) => (
                                <SelectItem key={format.id} value={format.id}>
                                  {format.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="openai-background">Background</Label>
                          <Select value={openaiBackground ?? ""} onValueChange={(value: string) => setOpenaiBackground(value as OpenAIBackground)}>
                            <SelectTrigger id="openai-background">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPENAI_BACKGROUND_OPTIONS.map((background) => (
                                <SelectItem key={background.id} value={background.id}>
                                  {background.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {openaiModel === "dall-e-3" && (
                      <div>
                        <Label htmlFor="openai-style">Style</Label>
                        <Select value={openaiStyle ?? ""} onValueChange={(value: string) => setOpenaiStyle(value as OpenAIStyle)}>
                          <SelectTrigger id="openai-style">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPENAI_STYLE_OPTIONS.map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                {style.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Ideogram Edit Options */}
              {selectedApiProvider === "gemini" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="use-ideogram-edit">Use Ideogram Edit</Label>
                    <Switch id="use-ideogram-edit" checked={useIdeogramEdit} onCheckedChange={(checked: boolean) => setUseIdeogramEdit(checked)} />
                  </div>

                  <Textarea
                    placeholder="Describe the changes you'd like to make..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                  />

                  {useIdeogramEdit && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="ideogram-style">Style</Label>
                          <Select value={ideogramSelectedStyle} onValueChange={(value: string) => setIdeogramSelectedStyle(value as IdeogramStyle)}>
                            <SelectTrigger id="ideogram-style">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {IDEOGRAM_STYLE_OPTIONS.map((style) => (
                                <SelectItem key={style.id} value={style.id}>
                                  {style.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="ideogram-aspect-ratio">Aspect Ratio</Label>
                          <Select value={ideogramSelectedAspectRatio} onValueChange={(value: string) => setIdeogramSelectedAspectRatio(value as IdeogramAspectRatio)}>
                            <SelectTrigger id="ideogram-aspect-ratio">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {IDEOGRAM_ASPECT_RATIO_OPTIONS.map((ratio) => (
                                <SelectItem key={ratio.id} value={ratio.id}>
                                  {ratio.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="ideogram-image-weight">Image Weight</Label>
                        <Slider
                          defaultValue={[ideogramImageWeight]}
                          max={100}
                          min={0}
                          step={1}
                          onValueChange={(value) => setIdeogramImageWeight(value[0])}
                        />
                        <span>{ideogramImageWeight}%</span>
                      </div>
                    </>
                  )}
                </>
              )}

              <Button onClick={handleModify} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modifying...
                  </>
                ) : (
                  "Modify"
                )}
              </Button>
            </>
          )}
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {/* Video Generation */}
      {selectedApiProvider === "openai" && mode === "generate" && (
        <>
          <Textarea
            placeholder="Enter a prompt to generate a video..."
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
          />
          <Select value={selectedVideoModel} onValueChange={(value: string) => setSelectedVideoModel(value as VideoModel)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a video model" />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_MODEL_OPTIONS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo}>
            {isGeneratingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Film className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
            </a>
          )}
          {videoError && <p className="text-red-500">{videoError}</p>}
        </>
      )}

      {/* Analysis Section */}
      {images.length > 0 && (
        <>
          <Button onClick={handleAnalyzeImages} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Analyze Image
              </>
            )}
          </Button>
          {imageAnalysis && (
            <>
              <p>Analysis: {imageAnalysis}</p>
              {suggestedPrompts.length > 0 && (
                <>
                  <p>Suggested Prompts:</p>
                  <ul>
                    {suggestedPrompts.map((prompt, index) => (
                      <li key={index}>{prompt}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
