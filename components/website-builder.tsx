"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { generateWebsiteGemini } from '@/actions/generate-website-gemini'; // Assuming this action exists and is correctly typed
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Interfaces matching the action's return type
interface CodeBundle {
  html: string;
  css: string;
  js: string;
}
interface ActionResult {
    code?: CodeBundle;
    error?: string;
    generationId: string; // Still useful for logging/tracking
}

// Interface for potential errors during the action call (client-side)
interface ActionError {
    message: string;
}


export function WebsiteBuilder() {
  const [prompt, setPrompt] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  // State to store the generation ID returned by the action
  const [generationId, setGenerationId] = useState<string | null>(null);
  // State to store errors encountered when calling the action
  const [actionError, setActionError] = useState<ActionError | null>(null);
  // State to store the successfully generated code bundle
  const [generatedCode, setGeneratedCode] = useState<CodeBundle | null>(null);


  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the website.');
      return;
    }

    startTransition(async () => {
      setGenerationId(null); // Clear previous ID
      setActionError(null); // Clear previous errors
      setGeneratedCode(null); // Clear previous code

      try {
        // Call the action which now returns ActionResult { code?, error?, generationId }
        const result: ActionResult = await generateWebsiteGemini(prompt);

        setGenerationId(result.generationId); // Store the generation ID

        if (result.error) {
          // Handle error returned by the action
          toast.error(`Generation failed: ${result.error}`);
          setActionError({ message: result.error });
        } else if (result.code) {
          // Handle successful generation
          toast.success(`Website generated successfully! ID: ${result.generationId}`);
          setGeneratedCode(result.code); // Store the generated code
        } else {
          // Handle unexpected case where there's no error and no code
          const unexpectedError = "Generation finished with no code and no error.";
          toast.error(unexpectedError);
          setActionError({ message: unexpectedError });
        }

      } catch (error) {
        // Handle errors caught during the action call itself (e.g., network issues)
        console.error('Error calling generateWebsiteGemini action:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during the call.';
        toast.error(`Failed to call generation action: ${errorMessage}`);
        setActionError({ message: errorMessage });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Website Builder (Gemini)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="website-prompt">Describe the website you want to create:</Label>
          <Textarea
            id="website-prompt"
            placeholder="e.g., A modern portfolio website for a photographer specializing in nature..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            disabled={isPending}
          />
        </div>
        <Button onClick={handleGenerate} disabled={isPending || !prompt.trim()} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Website'
          )}
        </Button>

        {/* Display Generation ID if available */}
        {generationId && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-green-800">
            <p>Generation process started successfully.</p>
            <p className="font-mono text-sm">Generation ID: {generationId}</p>
            <p className="text-xs mt-1">(You'll need to implement status monitoring)</p>
          </div>
        )}

        {/* Display Action Error if it occurred */}
        {actionError && (
          <div className="text-red-600 mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p>Error: {actionError.message}</p> {/* Simplified error message display */}
          </div>
        )}

        {/* Display Generated Website Preview in an iframe */}
        {generatedCode && (
          <div className="mt-6 border rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Generated Website Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                title="Generated Website Preview"
                srcDoc={`
                  <html>
                    <head>
                      <style>${generatedCode.css}</style>
                    </head>
                    <body>
                      ${generatedCode.html}
                      <script>${generatedCode.js}</script>
                    </body>
                  </html>
                `}
                className="w-full h-[600px] border-0" // Adjust height as needed
                sandbox="allow-scripts allow-same-origin" // Basic sandbox for security
              />
            </CardContent>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// Export the component as default if it's the main export of the file
export default WebsiteBuilder;

