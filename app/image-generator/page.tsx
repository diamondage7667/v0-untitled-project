"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanvasMaskEditor } from "@/components/canvas-mask-editor";
import { Paintbrush, Film, Plus, ArrowLeft, ArrowRight, Trash2, Wand2, Check, Loader2, Video, Gem } from 'lucide-react';
import { editImage, ImageGenerationResponse } from '@/actions/generate-images';
import { generateImagen, ImagenGenerationResponse } from '@/actions/generate-imagen';
// Import Creatomate actions and types
import { generateCreatomateVideo, CreatomateTemplate, ProductShowcaseData } from '@/actions/generate-creatomate-video';
import { getCreatomateRenderStatus } from '@/actions/get-creatomate-render-status';
// Import RunwayML actions and types
import { generateRunwaymlVideo, RunwayMLErrorResponse } from '@/actions/generate-runwayml-video';
import { getRunwaymlTaskStatus } from '@/actions/get-runwayml-task-status';
import { generateCaption } from '@/actions/generate-caption';
import { Pencil, Upload, BrainCircuit } from 'lucide-react';

// Slide type
type Slide = {
  id: string;
  frameUrl: string;
  caption?: string;
  originalUrl?: string;
}

// Aspect ratios
const ASPECT_RATIOS = ['16:9', '1:1', '9:16'] as const;
type AspectRatio = typeof ASPECT_RATIOS[number];

// Video themes - Combine Creatomate and Runway types
type VideoThemeId = CreatomateTemplate | 'runway-video';
const VIDEO_THEMES: { id: VideoThemeId; name: string; icon: React.ElementType }[] = [
  { id: 'social-reel', name: 'Social Reel', icon: Film },
  { id: 'product-showcase', name: 'Product Showcase', icon: Video },
  { id: 'runway-video', name: 'Runway Video', icon: BrainCircuit },
];

const VideoEditorPage = () => {
  // --- State Variables ---
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [ratio, setRatio] = useState<AspectRatio>('16:9');
  const [selectedTheme, setSelectedTheme] = useState<VideoThemeId>(VIDEO_THEMES[0].id); // Re-add theme selection state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [isCaptionLoading, setIsCaptionLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isVideoRendering, setIsVideoRendering] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isTextEditing, setIsTextEditing] = useState<boolean>(false);

  // Creatomate State
  const [creatomateRenderId, setCreatomateRenderId] = useState<string | null>(null);
  const [creatomateRenderStatus, setCreatomateRenderStatus] = useState<string | null>(null);
  const [finalCreatomateVideoUrl, setFinalCreatomateVideoUrl] = useState<string | null>(null);
  // RunwayML State
  const [runwayTaskId, setRunwayTaskId] = useState<string | null>(null);
  const [runwayTaskStatus, setRunwayTaskStatus] = useState<string | null>(null);
  const [finalRunwayVideoUrl, setFinalRunwayVideoUrl] = useState<string | null>(null);
  const [runwayError, setRunwayError] = useState<string | null>(null);

  // Caption Editing State
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingCaptionValue, setEditingCaptionValue] = useState<string>('');

  // Product Showcase State (Re-added)
  const [productShowcaseData, setProductShowcaseData] = useState<ProductShowcaseData>({
    productName: '', productDescription: '', normalPrice: '', discountedPrice: '', cta: '', website: '', logoUrl: null,
  });

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const creatomatePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runwayPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null); // Re-added

  // --- Callbacks & Effects ---

  const resetGenerationState = useCallback(() => {
    setPrompt(''); setNegativePrompt(''); setPreviewUrl(null); setEditedPreviewUrl(null);
    setCurrentCaption(''); setIsEditing(false); setMaskDataUrl(null); setEditPrompt('');
    setProductShowcaseData({ productName: '', productDescription: '', normalPrice: '', discountedPrice: '', cta: '', website: '', logoUrl: null }); // Reset product data
    setCreatomateRenderId(null); setCreatomateRenderStatus(null); setFinalCreatomateVideoUrl(null);
    setRunwayTaskId(null); setRunwayTaskStatus(null); setFinalRunwayVideoUrl(null); setRunwayError(null);
    if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
    if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
    setIsVideoRendering(false); setLoading(false); setIsTextEditing(false); setIsCaptionLoading(false);
  }, []);

  const EDIT_CHIPS = ["Place in", "change the", "zoom out", "create a variation with", "remove the"];

  const getPlaceholderUrl = useCallback((currentPrompt: string, currentRatio: AspectRatio) => {
     const dimensions = currentRatio === '16:9' ? '1280x720' : currentRatio === '1:1' ? '1080x1080' : '720x1280';
     return `https://via.placeholder.com/${dimensions}?text=${encodeURIComponent(currentPrompt || 'Preview')}`;
  }, []);

  const triggerCaptionGeneration = useCallback(async (imageDataUri: string) => {
    if (!imageDataUri) return;
    setIsCaptionLoading(true); setCurrentCaption('');
    try {
      const captionResult = await generateCaption({ imageDataUri, model: 'gemini-2.0-flash', style: 'social media reel caption' });
      if (captionResult.success && captionResult.caption) setCurrentCaption(captionResult.caption);
      else console.error("Failed to generate caption:", captionResult.error);
    } catch (err) { console.error("Error calling generateCaption action:", err); }
    finally { setIsCaptionLoading(false); }
  }, []);

  const generatePreview = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true); setIsEditing(false); setPreviewUrl(null); setEditedPreviewUrl(null); setMaskDataUrl(null); setCurrentCaption('');
    try {
      const result = await generateImagen({ prompt: prompt, aspectRatio: ratio });
      if (result.success && result.url?.startsWith('data:image/')) {
        setPreviewUrl(result.url);
        triggerCaptionGeneration(result.url);
      } else {
        alert(`Image generation failed: ${result.error || 'Invalid response'}`);
        console.error(`Imagen generation failed:`, result.error);
      }
    } catch (err) { alert(`An unexpected error occurred during image generation.`); console.error('Error calling generateImagen:', err); }
    finally { setLoading(false); }
  }, [prompt, ratio, triggerCaptionGeneration]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (typeof loadEvent.target?.result === 'string') {
          setPreviewUrl(loadEvent.target.result);
          setEditedPreviewUrl(null); setIsEditing(false); setCurrentCaption('');
          triggerCaptionGeneration(loadEvent.target.result);
        } else alert("Failed to read image file.");
      };
      reader.onerror = () => alert("Error reading file.");
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMultipleImageUploads = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target?.files?.length) return;
    const files = Array.from(event.target.files);
    setLoading(true);
    const newSlidesPromises = files.map(file =>
      (async (): Promise<Slide | null> => {
        try {
          const imageDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => typeof e.target?.result === 'string' ? resolve(e.target.result) : reject(new Error('Read failed'));
            reader.onerror = () => reject(new Error('Read error'));
            reader.readAsDataURL(file);
          });
          let generatedCaption: string | undefined;
          try {
            const capRes = await generateCaption({ imageDataUri, model: 'gemini-2.0-flash', style: 'social media reel caption' });
            if (capRes.success) generatedCaption = capRes.caption;
          } catch (capErr) { console.error(`Caption error for ${file.name}:`, capErr); }
          return { id: `${Date.now()}-${Math.random()}`, frameUrl: imageDataUri, caption: generatedCaption };
        } catch (error) { console.error(`File processing error ${file.name}:`, error); return null; }
      })()
    );
    Promise.all(newSlidesPromises).then(results => {
      const validSlides = results.filter((s): s is Slide => s !== null);
      if (validSlides.length > 0) setSlides(prev => [...prev, ...validSlides]);
      if (validSlides.length < files.length) alert(`Could not read ${files.length - validSlides.length} files.`);
      setLoading(false);
    });
    if (multiFileInputRef.current) multiFileInputRef.current.value = "";
  };

  const handleTextEdit = useCallback(async () => {
    if (!previewUrl || !editPrompt.trim()) return;
    setIsTextEditing(true); setLoading(true); setEditedPreviewUrl(null);
    try {
      const result = await editImage({ imageUrl: previewUrl, prompt: editPrompt, isExternalUrl: false });
      if (result.url?.startsWith('data:image/')) setEditedPreviewUrl(result.url);
      else { alert('Text-based image edit failed.'); console.error('Text edit failed:', result.url); }
    } catch (err) { alert('An unexpected error during text editing.'); console.error('Error calling editImage:', err); }
    finally { setIsTextEditing(false); setLoading(false); }
  }, [previewUrl, editPrompt]);

  const handleChipClick = (chipText: string) => setEditPrompt(prev => `${chipText} ${prev}`.trim());

  const handleMaskGenerated = useCallback(async (generatedMaskDataUrl: string) => {
    setMaskDataUrl(generatedMaskDataUrl); setLoading(true);
    console.log("Mask generated, applying edit...");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Placeholder
    setEditedPreviewUrl(getPlaceholderUrl(prompt + " (edited with mask)", ratio));
    setIsEditing(false); setLoading(false);
  }, [prompt, ratio, getPlaceholderUrl]);

  // --- Polling Logic ---
  const checkCreatomateStatus = useCallback(async (idToCheck: string) => {
    if (!idToCheck) return;
    console.log(`Polling Creatomate status for ID: ${idToCheck}`);
    try {
      const result = await getCreatomateRenderStatus(idToCheck);
      if (result.success) {
        setCreatomateRenderStatus(result.status ?? 'unknown');
        if (result.status === 'succeeded' || result.status === 'failed') {
          if (result.status === 'succeeded') setFinalCreatomateVideoUrl(result.url ?? null);
          else alert(`Creatomate rendering failed: ${result.errorMessage || result.error || 'Unknown error'}`);
          if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
          creatomatePollingIntervalRef.current = null;
          setIsVideoRendering(false); setCreatomateRenderId(null);
        }
      } else {
          alert(`Error checking Creatomate status: ${result.error}`);
          console.error(`Failed to get Creatomate status: ${result.error}`);
          if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
          creatomatePollingIntervalRef.current = null;
          setIsVideoRendering(false); setCreatomateRenderId(null);
      }
    } catch (error) {
      console.error(`Error polling Creatomate status:`, error);
      if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
      creatomatePollingIntervalRef.current = null;
      setIsVideoRendering(false); setCreatomateRenderId(null); setCreatomateRenderStatus('error');
      alert('Error checking Creatomate status.');
    }
  }, []);

  const checkRunwayStatus = useCallback(async (idToCheck: string) => {
    if (!idToCheck) return;
    console.log(`Polling RunwayML status for task ID: ${idToCheck}`);
    try {
      const result = await getRunwaymlTaskStatus(idToCheck);
      if (result.success) {
        setRunwayTaskStatus(result.status ?? 'unknown');
        if (result.status === 'SUCCEEDED') {
          setFinalRunwayVideoUrl(result.videoUrl ?? null);
          if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
          runwayPollingIntervalRef.current = null;
          setIsVideoRendering(false); setRunwayTaskId(null);
        } else if (result.status === 'FAILED' || result.status === 'ABORTED') {
          const errorMsg = result.error || `Task ${result.status?.toLowerCase()}.`;
          setRunwayError(errorMsg);
          alert(`RunwayML video generation failed: ${errorMsg}`);
          if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
          runwayPollingIntervalRef.current = null;
          setIsVideoRendering(false); setRunwayTaskId(null);
        }
      } else {
        const errorMsg = result.error ?? 'Unknown error during status check.';
        setRunwayError(errorMsg);
        alert(`Error checking RunwayML task status: ${errorMsg}`);
        if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
        runwayPollingIntervalRef.current = null;
        setIsVideoRendering(false); setRunwayTaskId(null);
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while checking task status.';
      setRunwayError(errorMessage);
      alert(errorMessage);
      if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
      runwayPollingIntervalRef.current = null;
      setIsVideoRendering(false); setRunwayTaskId(null);
    }
  }, []);

  useEffect(() => { // Cleanup polling
    return () => {
      if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
      if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
    };
  }, []);

  useEffect(() => { // Start/stop Creatomate polling
    if (creatomateRenderId && !creatomatePollingIntervalRef.current) {
      setIsVideoRendering(true); setFinalCreatomateVideoUrl(null);
      checkCreatomateStatus(creatomateRenderId);
      creatomatePollingIntervalRef.current = setInterval(() => checkCreatomateStatus(creatomateRenderId), 5000);
    } else if (!creatomateRenderId && creatomatePollingIntervalRef.current) {
      clearInterval(creatomatePollingIntervalRef.current);
      creatomatePollingIntervalRef.current = null;
    }
  }, [creatomateRenderId, checkCreatomateStatus]);

  useEffect(() => { // Start/stop Runway polling
    if (runwayTaskId && !runwayPollingIntervalRef.current) {
      setIsVideoRendering(true); setFinalRunwayVideoUrl(null); setRunwayError(null);
      checkRunwayStatus(runwayTaskId);
      runwayPollingIntervalRef.current = setInterval(() => checkRunwayStatus(runwayTaskId), 5000);
    } else if (!runwayTaskId && runwayPollingIntervalRef.current) {
      clearInterval(runwayPollingIntervalRef.current);
      runwayPollingIntervalRef.current = null;
    }
  }, [runwayTaskId, checkRunwayStatus]);
  // --- End Polling Logic ---

  const addToTimeline = () => {
    const urlToAdd = editedPreviewUrl || previewUrl;
    if (!urlToAdd) return;
    setSlides(prev => [...prev, { id: Date.now().toString(), frameUrl: urlToAdd, caption: currentCaption || undefined, originalUrl: previewUrl ?? undefined }]);
    setPreviewUrl(null); setEditedPreviewUrl(null); setCurrentCaption(''); setIsEditing(false); setMaskDataUrl(null);
  };

  const moveSlide = (index: number, direction: 'left' | 'right') => {
    setSlides(prev => {
      const arr = [...prev];
      const target = direction === 'left' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const removeSlide = (idToRemove: string) => setSlides(prev => prev.filter(slide => slide.id !== idToRemove));

  // --- Caption Editing Handlers ---
  const handleEditCaptionStart = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setEditingCaptionValue(slide.caption || '');
  };

  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setEditingCaptionValue('');
  };

  const handleSaveCaption = () => {
    if (editingSlideId === null) return;
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === editingSlideId ? { ...slide, caption: editingCaptionValue.trim() || undefined } : slide
      )
    );
    handleCancelEdit();
  };
  // --- End Caption Editing Handlers ---

  // --- Product Showcase Handlers (Re-added) ---
  const handleProductShowcaseChange = (field: keyof ProductShowcaseData, value: string) => {
    setProductShowcaseData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (typeof loadEvent.target?.result === 'string') {
          setProductShowcaseData(prev => ({ ...prev, logoUrl: loadEvent.target?.result as string }));
        } else alert("Failed to read logo file.");
      };
      reader.onerror = () => alert("Error reading logo file.");
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  };
  // --- End Product Showcase Handlers ---

  const generateVideo = async () => {
     if (slides.length === 0) {
        alert("Please add at least one scene image to the timeline."); return;
     }
    // Reset states
    setCreatomateRenderId(null); setCreatomateRenderStatus(null); setFinalCreatomateVideoUrl(null);
    setRunwayTaskId(null); setRunwayTaskStatus(null); setFinalRunwayVideoUrl(null); setRunwayError(null);
    if (creatomatePollingIntervalRef.current) clearInterval(creatomatePollingIntervalRef.current);
    if (runwayPollingIntervalRef.current) clearInterval(runwayPollingIntervalRef.current);
    setLoading(true); setIsVideoRendering(true);

    const slidesPayload = slides.map((s: Slide) => ({ frameUrl: s.frameUrl, caption: s.caption }));

    // --- Conditional API Call based on selectedTheme ---
    if (selectedTheme === 'runway-video') {
      console.log('Initiating Runway Video generation for slides:', slidesPayload);
      try {
        const result = await generateRunwaymlVideo({ slides: slidesPayload, aspectRatio: ratio });
        if (result.success) {
          setRunwayTaskId(result.taskId); // Start polling
          setRunwayTaskStatus('PENDING');
        } else {
          setRunwayError(result.error || 'Unknown error submitting task.');
          alert(`Failed to submit RunwayML video task: ${result.error || 'Unknown error'}`);
          setIsVideoRendering(false); setLoading(false);
        }
      } catch (error) {
        setRunwayError('An unexpected error occurred during task submission.');
        alert('An unexpected error occurred during task submission.');
        setIsVideoRendering(false); setLoading(false);
        console.error("Error calling generateRunwaymlVideo action:", error);
      }
    } else { // Handle Creatomate themes ('social-reel', 'product-showcase')
      console.log(`Initiating ${selectedTheme} video generation with Creatomate for slides:`, slidesPayload);
      try {
        const payload: any = { slides: slidesPayload, aspectRatio: ratio, template: selectedTheme as CreatomateTemplate };
        if (selectedTheme === 'product-showcase') {
            if (!productShowcaseData.productName) {
                 alert("Product Name is required for Product Showcase theme.");
                 setIsVideoRendering(false); setLoading(false);
                 return;
            }
            payload.productData = productShowcaseData;
        }

        const result = await generateCreatomateVideo(payload);
        if (result.success && result.renders?.length) {
          setCreatomateRenderId(result.renders[0].id);
          setCreatomateRenderStatus(result.renders[0].status);
        } else {
          alert(`Failed to start Creatomate video generation: ${result.error || 'Unknown error'}`);
          setIsVideoRendering(false); setLoading(false);
          console.error("Creatomate video generation failed:", result.error);
        }
      } catch (error) {
        alert("An unexpected error occurred while trying to generate the Creatomate video.");
        setIsVideoRendering(false); setLoading(false);
        console.error("Error calling generateCreatomateVideo action:", error);
      }
    }
    // Don't set loading/rendering false here for polling cases
  };


  const ratioPadding = ratio === '16:9' ? '56.25%' : ratio === '1:1' ? '100%' : '177.78%';
  const editorWidth = 512;
  const editorHeight = ratio === '16:9' ? Math.round(editorWidth * 9 / 16) : ratio === '1:1' ? editorWidth : Math.round(editorWidth * 16 / 9);

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2"><Film className="w-6 h-6" /> AI Video Scene Generator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Wand2 className="w-5 h-5" /> 1. Generate or Upload Scene Image</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="prompt">Prompt</Label><Input id="prompt" placeholder="Describe the scene..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={loading || isVideoRendering} /></div>
              <div><Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label><Input id="negative-prompt" placeholder="Things to avoid..." value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} disabled={loading || isVideoRendering} /></div>
            </div>
            <div><Label>Aspect Ratio</Label><Tabs defaultValue={ratio} onValueChange={(value) => setRatio(value as AspectRatio)}><TabsList className="grid w-full grid-cols-3">{ASPECT_RATIOS.map((ar) => (<TabsTrigger key={ar} value={ar} disabled={loading || isVideoRendering}>{ar}</TabsTrigger>))}</TabsList></Tabs></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={generatePreview} disabled={loading || isVideoRendering || !prompt.trim()} className="w-full">{loading && !isVideoRendering && !isEditing && !isTextEditing ? 'Generating...' : 'Generate Scene from Text'}{loading && (isEditing || isTextEditing) && 'Processing...'}{!loading && !isVideoRendering && <Wand2 className="ml-2 h-4 w-4" />}</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading || isVideoRendering} className="w-full">Upload Image as Base<input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /></Button>
              <Button variant="secondary" onClick={() => multiFileInputRef.current?.click()} disabled={loading || isVideoRendering} className="w-full">Add Multiple Images to Timeline<input type="file" ref={multiFileInputRef} onChange={handleMultipleImageUploads} accept="image/*" multiple className="hidden" /></Button>
            </div>
          </div>
          {/* Step 2 */}
          {(previewUrl || (loading && !isVideoRendering && !isEditing && !isTextEditing)) && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Paintbrush className="w-5 h-5" /> 2. Preview & Edit Scene Image</h3>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-md border border-gray-300 dark:border-gray-600"><div style={{ paddingTop: ratioPadding }} /><div className="absolute inset-0 flex items-center justify-center">{loading && !isVideoRendering && !previewUrl && <p>Processing...</p>}{(previewUrl && !isEditing) && (<Image src={editedPreviewUrl || previewUrl} alt="Generated Preview" layout="fill" objectFit="contain" unoptimized className="rounded-md" key={editedPreviewUrl || previewUrl} />)}{isEditing && previewUrl && (<p className="text-center p-4">Editing mode active below...</p>)}</div></div>
              {previewUrl && !isEditing && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-end gap-2"><div className="flex-grow"><Label htmlFor="edit-prompt">Edit with Text</Label><Input id="edit-prompt" placeholder="e.g., 'make the sky blue', 'add a cat'" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} disabled={loading || isVideoRendering} /></div><Button onClick={handleTextEdit} disabled={loading || isVideoRendering || !editPrompt.trim()} variant="outline">{isTextEditing ? 'Applying...' : 'Apply Text Edit'}{!isTextEditing && <Wand2 className="ml-2 h-4 w-4" />}</Button></div>
                  <div className="flex flex-wrap gap-2 justify-start pt-2">{EDIT_CHIPS.map((chip) => (<Button key={chip} variant="outline" size="sm" onClick={() => handleChipClick(chip)} disabled={loading || isVideoRendering} className="text-xs">{chip}...</Button>))}</div>
                  <div className="mt-4"><Label htmlFor="manual-caption">Caption for this Scene</Label><div className="flex items-center gap-2"><Input id="manual-caption" placeholder={isCaptionLoading ? "Generating AI caption..." : "Edit AI caption or enter your own"} value={currentCaption} onChange={(e) => setCurrentCaption(e.target.value)} disabled={loading || isVideoRendering || isCaptionLoading} className="flex-grow" />{isCaptionLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div><p className="text-xs text-muted-foreground mt-1">Edit the AI-generated caption or enter your own.</p></div>
                  <div className="flex justify-center gap-2 pt-4"><Button variant="outline" onClick={() => setIsEditing(true)} disabled={loading || isVideoRendering}><Paintbrush className="mr-2 h-4 w-4" /> Edit with Mask</Button><Button onClick={addToTimeline} disabled={loading || isVideoRendering || (!previewUrl && !editedPreviewUrl)} className="bg-green-600 hover:bg-green-700"><Plus className="mr-2 h-4 w-4" /> Add to Timeline</Button></div>
                </div>
              )}
              {previewUrl && isEditing && (<div className="border p-4 rounded-md bg-white dark:bg-gray-900 mt-4"><CanvasMaskEditor key={previewUrl} imageUrl={previewUrl} onMaskGenerated={handleMaskGenerated} width={editorWidth} height={editorHeight} /><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading || isVideoRendering}>Cancel Mask Edit</Button></div></div>)}
              {editedPreviewUrl && !isEditing && (<div className="text-center mt-2 flex justify-center gap-2 items-center"><p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="w-4 h-4"/> Scene edited.</p><Button onClick={addToTimeline} disabled={loading || isVideoRendering} className="bg-green-600 hover:bg-green-700" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Edited Scene</Button></div>)}
            </div>
          )}
          {/* Step 3 */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Film className="w-5 h-5" /> 3. Timeline ({slides.length} scenes)</h3>
            {slides.length === 0 ? (<p className="text-center text-gray-500 dark:text-gray-400 py-4">Add generated scenes to the timeline.</p>) : (<div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">{slides.map((slide, idx) => (<div key={slide.id} className="flex-shrink-0 w-40 flex flex-col items-center space-y-1 p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 shadow"><div className="w-full h-20 relative border border-gray-400 dark:border-gray-500 rounded overflow-hidden mb-1"><Image src={slide.frameUrl} alt={`Slide ${idx + 1}`} layout="fill" objectFit="cover" unoptimized /><span className="absolute top-0 left-0 bg-black bg-opacity-60 text-white text-xs px-1 rounded-br-md">{idx + 1}</span><Button variant="destructive" size="icon" onClick={() => removeSlide(slide.id)} className="absolute top-0 right-0 h-5 w-5 rounded-bl-md rounded-tr-none" aria-label="Remove slide" disabled={isVideoRendering}><Trash2 className="h-3 w-3" /></Button></div><div className="flex space-x-1 w-full justify-center"><Button size="icon" variant="outline" onClick={() => moveSlide(idx, 'left')} disabled={idx === 0 || isVideoRendering} className="h-6 w-6" aria-label="Move slide left"><ArrowLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => moveSlide(idx, 'right')} disabled={idx === slides.length - 1 || isVideoRendering} className="h-6 w-6" aria-label="Move slide right"><ArrowRight className="h-4 w-4" /></Button></div><div className="w-full mt-1 text-center">{editingSlideId === slide.id ? (<div className="space-y-1"><Input type="text" value={editingCaptionValue} onChange={(e) => setEditingCaptionValue(e.target.value)} placeholder="Enter caption..." className="h-8 text-xs" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCaption(); if (e.key === 'Escape') handleCancelEdit(); }} /><div className="flex justify-center gap-1"><Button size="sm" onClick={handleSaveCaption} className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700">Save</Button><Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 px-2 text-xs">Cancel</Button></div></div>) : (<div className="flex items-center justify-center gap-1 group">{slide.caption ? (<p className="text-xs text-gray-600 dark:text-gray-300 w-full truncate flex-grow" title={slide.caption}>"{slide.caption}"</p>) : (<p className="text-xs text-gray-400 dark:text-gray-500 italic w-full truncate flex-grow">No caption</p>)}<Button size="icon" variant="ghost" onClick={() => handleEditCaptionStart(slide)} disabled={isVideoRendering} className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Edit caption"><Pencil className="h-3 w-3" /></Button></div>)}</div></div>))}</div>)}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center p-4 border-t space-y-6">
          {/* Step 4: Re-add Theme Selection & Product Details */}
          <div className="w-full max-w-md space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5" /> 4. Select Theme & Details</h3>
            <div className="w-full"><Label>Video Theme</Label><Tabs value={selectedTheme} onValueChange={(value) => setSelectedTheme(value as VideoThemeId)}><TabsList className="grid w-full grid-cols-3">{VIDEO_THEMES.map((theme) => (<TabsTrigger key={theme.id} value={theme.id} disabled={loading || isVideoRendering}><theme.icon className="w-4 h-4 mr-2" /> {theme.name}</TabsTrigger>))}</TabsList></Tabs></div>
            {selectedTheme === 'product-showcase' && (<div className="space-y-4 pt-4 border-t"><h4 className="text-md font-semibold text-center">Product Showcase Details</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="product-name">Product Name</Label><Input id="product-name" value={productShowcaseData.productName} onChange={(e) => handleProductShowcaseChange('productName', e.target.value)} disabled={loading || isVideoRendering} /></div><div><Label htmlFor="product-desc">Product Description</Label><Input id="product-desc" value={productShowcaseData.productDescription} onChange={(e) => handleProductShowcaseChange('productDescription', e.target.value)} disabled={loading || isVideoRendering} /></div><div><Label htmlFor="normal-price">Normal Price</Label><Input id="normal-price" placeholder="$ 109.99" value={productShowcaseData.normalPrice} onChange={(e) => handleProductShowcaseChange('normalPrice', e.target.value)} disabled={loading || isVideoRendering} /></div><div><Label htmlFor="discount-price">Discounted Price</Label><Input id="discount-price" placeholder="$ 89.99" value={productShowcaseData.discountedPrice} onChange={(e) => handleProductShowcaseChange('discountedPrice', e.target.value)} disabled={loading || isVideoRendering} /></div><div><Label htmlFor="cta-text">Call to Action Text</Label><Input id="cta-text" placeholder="Follow us!" value={productShowcaseData.cta} onChange={(e) => handleProductShowcaseChange('cta', e.target.value)} disabled={loading || isVideoRendering} /></div><div><Label htmlFor="website-text">Website URL</Label><Input id="website-text" placeholder="www.mywebsite.com" value={productShowcaseData.website} onChange={(e) => handleProductShowcaseChange('website', e.target.value)} disabled={loading || isVideoRendering} /></div></div><div><Label>Logo Image (Optional)</Label><div className="flex items-center gap-4"><Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={loading || isVideoRendering} className="flex-grow"><Upload className="mr-2 h-4 w-4" /> Upload Logo<input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden" /></Button>{productShowcaseData.logoUrl && (<div className="w-16 h-16 border rounded flex items-center justify-center p-1 bg-white"><Image src={productShowcaseData.logoUrl} alt="Logo Preview" width={60} height={60} objectFit="contain" unoptimized /></div>)}</div></div></div>)}
          </div>
          {/* Step 5: Generate Video Button */}
          <div className="w-full max-w-xs text-center">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2 mb-2"><Gem className="w-5 h-5" /> 5. Generate Final Video</h3>
            <Button size="lg" onClick={generateVideo} disabled={slides.length === 0 || loading || isVideoRendering || (selectedTheme === 'product-showcase' && !productShowcaseData.productName)} className="bg-red-600 hover:bg-red-700 w-full">
              {isVideoRendering ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span>{selectedTheme === 'runway-video' ? `Generating (RunwayML - ${runwayTaskStatus || 'starting'})...` : `Rendering (Creatomate - ${creatomateRenderStatus || 'starting'})...`}</span></>) : (`Generate Video (${slides.length} scene${slides.length !== 1 ? 's' : ''})`)}
              {!isVideoRendering && <Film className="ml-2 h-5 w-5" />}
            </Button>
             {slides.length === 0 && <p className="text-xs text-red-500 mt-1">Add at least one scene image to the timeline.</p>}
             {selectedTheme === 'product-showcase' && !productShowcaseData.productName && slides.length > 0 && <p className="text-xs text-red-500 mt-1">Product Name is required for Product Showcase.</p>}
          </div>
          {/* Status Display */}
          {isVideoRendering && selectedTheme !== 'runway-video' && creatomateRenderStatus && creatomateRenderStatus !== 'succeeded' && creatomateRenderStatus !== 'failed' && (<p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Creatomate Status: {creatomateRenderStatus}...</span></p>)}
          {isVideoRendering && selectedTheme === 'runway-video' && runwayTaskStatus && runwayTaskStatus !== 'SUCCEEDED' && runwayTaskStatus !== 'FAILED' && runwayTaskStatus !== 'ABORTED' && (<p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>RunwayML Status: {runwayTaskStatus}...</span></p>)}
          {creatomateRenderStatus === 'failed' && !isVideoRendering && selectedTheme !== 'runway-video' && (<p className="text-sm text-red-600">Creatomate render failed. Check console/alerts for details.</p>)}
          {runwayError && !isVideoRendering && selectedTheme === 'runway-video' && (<p className="text-sm text-red-600">RunwayML generation failed: {runwayError}</p>)}
          {/* Final Video Display */}
          {finalCreatomateVideoUrl && (<div className="w-full max-w-md mt-4 border rounded-lg overflow-hidden"><h4 className="text-center font-semibold p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Creatomate Video Ready!</h4><video controls src={finalCreatomateVideoUrl} className="w-full aspect-video">Your browser does not support the video tag.</video><div className="p-2 text-center bg-gray-100 dark:bg-gray-800"><a href={finalCreatomateVideoUrl} download target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download Creatomate Video</a></div></div>)}
          {finalRunwayVideoUrl && (<div className="w-full max-w-md mt-4 border rounded-lg overflow-hidden"><h4 className="text-center font-semibold p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">RunwayML Video Ready!</h4><video controls src={finalRunwayVideoUrl} className="w-full aspect-video">Your browser does not support the video tag.</video><div className="p-2 text-center bg-gray-100 dark:bg-gray-800"><a href={finalRunwayVideoUrl} download target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download RunwayML Video</a></div></div>)}
        </CardFooter>
      </Card>
    </div>
  );
}

export default VideoEditorPage;
