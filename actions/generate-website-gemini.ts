"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from "@google/generative-ai"; // Added Part type
import { v4 as uuidv4 } from "uuid";
// Assuming memoryStore setup is similar or adapt as needed
// import { memoryStore } from "@/lib/memory-store"; // Adjust path if needed

// --- Types (Define or import necessary types) ---
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  textLight: string;
  textDark: string;
}

interface FileAttachmentData {
  data: string; // Base64 encoded data
  mimeType: string;
}

interface CodeBundle {
  html: string;
  css: string;
  js: string;
}

// This will be the return type upon successful generation
// interface GenerationProcessResult {
//     generationId: string;
// }
// We will return the CodeBundle directly or an error object
interface ActionResult {
    code?: CodeBundle;
    error?: string;
    generationId: string; // Still useful for logging/tracking
}


// --- Gemini Client Initialization ---
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Helper to push status updates (Adapt if not using memoryStore) ---
async function pushStatus(id: string, message: string) {
  console.log(`[${id}] Status: ${message}`);
  // await memoryStore.rpush(`generation:${id}:status`, message);
}
async function pushThinking(id: string, message: string) {
    console.log(`[${id}] Thinking: ${message.substring(0, 100)}...`);
   // await memoryStore.rpush(`generation:${id}:thinking`, message);
}
async function pushCode(id: string, type: 'html' | 'css' | 'js', code: string) {
    console.log(`[${id}] Code (${type}): ${code.substring(0, 100)}...`);
   // await memoryStore.rpush(`generation:${id}:code:${type}`, code);
}
async function setComplete(id: string, result: CodeBundle) { // Expect CodeBundle here
    console.log(`[${id}] Complete.`);
   // await memoryStore.set(`generation:${id}`, JSON.stringify({ status: "completed", result }), { ex: 3600 });
}
async function setErrorStatus(id: string, error: string) {
    console.error(`[${id}] Error: ${error}`);
   // await memoryStore.set(`generation:${id}`, JSON.stringify({ status: "failed", error }), { ex: 3600 });
}

// Default Theme Colors (Example - adjust as needed)
const defaultTheme: ThemeColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#17a2b8',
  background: '#ffffff',
  textLight: '#f8f9fa',
  textDark: '#212529',
};

// --- Main Generation Function ---
export async function generateWebsiteGemini(
  prompt: string,
  attachments: FileAttachmentData[] = [], // Default to empty array
  theme: ThemeColors = defaultTheme,      // Default theme
  features: string[] = [],                // Default to empty array
): Promise<ActionResult> { // Return type updated to ActionResult
  let generationId = uuidv4(); // Define generationId at the start of the function scope
  await pushStatus(generationId, "🚀 Starting Gemini website generation...");

  try {
    const genAI = getGeminiClient();
    // Use latest stable model versions and include safetySettings
    const planningModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest", safetySettings });
    const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });

    await pushStatus(generationId, "📝 Constructing master prompt for Gemini...");

    const featuresListString = features.map((f: string) => `- ${f}`).join('\\n');

    const masterPrompt = `
You are an expert web developer tasked with creating a complete, functional, and visually appealing website based on the user's request.

**User Request:**
"${prompt}"

**Theme Colors:**
- Primary: ${theme.primary}
- Secondary: ${theme.secondary}
- Accent: ${theme.accent}
- Background (Light): ${theme.background}
- Text (Light): ${theme.textDark}
- Background (Dark): ${theme.textDark}
- Text (Dark): ${theme.textLight}

**Requested Features:**
${featuresListString}
- Dark/Light Mode Toggle (Mandatory)
- Blurred Header (Mandatory)
- Responsive Design (Mandatory)

**Logo:**
${attachments.length > 0 ? "A logo has been provided." : "No logo provided. Create a text-based logo or a placeholder."}

**Task:**
Generate the complete HTML, CSS, and JavaScript code for this website.

**Instructions & Requirements:**
1.  **Structure (HTML):** Create a semantic HTML5 structure. If "Multi-page structure" is requested, generate at least 3 distinct HTML files/sections (e.g., index.html, about.html, contact.html or equivalent single-page structure with JS routing/sections). Use descriptive IDs for elements that might need styling or JS interaction.
2.  **Styling (CSS):** Write modern, clean CSS. Use CSS variables extensively for colors, fonts, and spacing to facilitate theme changes and dark/light mode. Implement the provided theme colors. Ensure responsiveness using media queries, flexbox, and grid. Implement the blurred header effect.
3.  **Interactivity (JS):** Add JavaScript for any requested interactive features (e.g., modals, expandable content, form handling - client-side validation only, image gallery logic). Implement the Dark/Light mode toggle functionality:
    *   Add a toggle button/switch (usually in the header).
    *   Use JS to toggle a class (e.g., 'dark-mode') on the \`<body>\` element.
    *   Use CSS variables to define light and dark theme colors, and switch them based on the body class.
    *   Use \`localStorage\` to remember the user's preference.
4.  **Content:** Use the text generation model (gemini-1.5-flash) to generate relevant placeholder text content for sections based on the user prompt. Integrate this text naturally.
5.  **Images:** Use placeholder images (\`https://via.placeholder.com/WIDTHxHEIGHT/COLOR/TEXT?text=Description\`) with appropriate dimensions and descriptive text based on the section's purpose. If a logo was provided, use the data URI in the appropriate place. If not, create a simple text logo or placeholder.
6.  **Code Format:** Return the code ONLY in the following format, with NO other text before or after the blocks:

\`\`\`html
<!-- HTML code goes here -->
\`\`\`

\`\`\`css
/* CSS code goes here */
\`\`\`

\`\`\`javascript
// JavaScript code goes here
\`\`\`
`; // End of masterPrompt template literal

    await pushStatus(generationId, "✍️ Generating placeholder text content with Gemini Flash...");
    let placeholderText = "";
    let updatedMasterPrompt = masterPrompt;
    try {
        const textPrompt = `Generate engaging placeholder text content suitable for a website about: "${prompt}". Create distinct content for typical sections like hero, about, services/features, contact, etc. Keep it concise and relevant.`;
        const textResult = await textModel.generateContent({
            contents: [{ role: "user", parts: [{ text: textPrompt }] }]
        });
        placeholderText = textResult.response.text();
        await pushStatus(generationId, "✅ Placeholder text generated.");
        updatedMasterPrompt += `\n\n**Placeholder Content Suggestions:**\n${placeholderText}`;
    } catch (textGenError) {
        console.warn("Gemini Flash text generation failed:", textGenError);
        await pushStatus(generationId, "⚠️ Failed to generate placeholder text, using generic placeholders.");
        updatedMasterPrompt += `\n\n**Placeholder Content Suggestions:**\nUse generic "Lorem Ipsum" or context-appropriate placeholders.`;
    }


    await pushStatus(generationId, "💻 Generating website code with Gemini Pro...");
    await pushThinking(generationId, "Starting code generation process...");

    const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
         maxOutputTokens: 8192,
     };

    const promptParts: Part[] = [
        { text: updatedMasterPrompt }
    ];

    if (attachments.length > 0 && attachments[0].data && attachments[0].mimeType) {
        try {
            const base64Data = attachments[0].data.split(',')[1] || attachments[0].data;
             promptParts.push({
                inlineData: {
                    mimeType: attachments[0].mimeType,
                    data: base64Data
                }
            });
             await pushStatus(generationId, "🖼️ Logo image included in prompt.");
        } catch (e) {
             console.error("Error processing logo data URI:", e);
             await pushStatus(generationId, "⚠️ Error processing logo, proceeding without it.");
        }
    }

    // *** Use non-streaming generateContent instead of generateContentStream ***
    const result = await planningModel.generateContent({
        contents: [{ role: "user", parts: promptParts }],
        generationConfig: generationConfig,
        // safetySettings are implicitly included from planningModel initialization
    });

    await pushStatus(generationId, "⚙️ Processing response...");

    // Process the full response text
    const response = result.response;
    const fullResponseText = response.text(); // Get text from the complete response

    // Extract code blocks from the full response
    const htmlMatch = fullResponseText.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = fullResponseText.match(/```css\s*([\s\S]*?)\s*```/);
    const jsMatch = fullResponseText.match(/```javascript\s*([\s\S]*?)\s*```/);

    let htmlCode = htmlMatch?.[1]?.trim() || "";
    let cssCode = cssMatch?.[1]?.trim() || "";
    let jsCode = jsMatch?.[1]?.trim() || "";

    // Push final extracted code if found
    if (htmlCode) await pushCode(generationId, 'html', htmlCode);
    if (cssCode) await pushCode(generationId, 'css', cssCode);
    if (jsCode) await pushCode(generationId, 'js', jsCode);


    if (!htmlCode || !cssCode) {
        console.error("Failed to extract code blocks from Gemini response.");
        console.error("Full Response Text (first 1000 chars):", fullResponseText.substring(0, 1000));
        await setErrorStatus(generationId, "Code generation failed: Could not extract necessary code blocks.");
        throw new Error("Code generation failed: Could not extract necessary code blocks.");
    }

    const finalCode: CodeBundle = { html: htmlCode, css: cssCode, js: jsCode };
    // Don't call setComplete here as we return the code directly
    // await setComplete(generationId, finalCode);
    await pushStatus(generationId, "✅ Gemini website generation complete!");

    // Return the generated code bundle and generationId
    return { code: finalCode, generationId };

  } catch (error: any) {
    // Ensure generationId is defined in the catch block as well
    const currentGenerationId = generationId || 'unknown-id-on-error'; // Use defined generationId or fallback
    const errorMessage = error instanceof Error ? error.message : "Unknown error during Gemini generation";
    console.error(`Error in generateWebsiteGemini (ID: ${currentGenerationId}):`, error);
    await pushStatus(currentGenerationId, `❌ Critical Error: ${errorMessage}`);
    await setErrorStatus(currentGenerationId, errorMessage);
    // Return an error object instead of throwing
    return { error: errorMessage, generationId: currentGenerationId };
     // throw new Error(errorMessage); // Don't re-throw, return error object
  }
}

// Note: Refinement action (refineWebsiteGemini) would follow a similar pattern,
// taking existing code and plan as input and using Gemini to modify them.
// Implementation omitted for brevity but would involve:
// 1. Constructing a refinement prompt including original request, plan, current code, and refinement request.
// 2. Calling Gemini (likely 1.5 Pro) with the refinement prompt.
// 3. Streaming/processing the response to get updated code blocks.
// 4. Returning a new generationId for the refinement stream.

