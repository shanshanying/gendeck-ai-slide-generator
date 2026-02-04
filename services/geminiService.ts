
import { GoogleGenAI, Type } from "@google/genai";
import { OutlineItem, ApiSettings, ServiceResponse, ModelSelection, ApiProvider } from "../types";
import { PROVIDERS } from "../constants";

// Helper to clean JSON string from Markdown
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Helper to clean HTML string from Markdown
const cleanHtml = (text: string): string => {
  return text.replace(/```html/g, '').replace(/```/g, '').trim();
};

// Helper to estimate cost
const calculateEstimatedCost = (
  providerId: string,
  modelId: string,
  inputChars: number,
  outputChars: number
): number => {
  const provider = PROVIDERS.find(p => p.id === providerId);
  const model = provider?.models.find(m => m.id === modelId);

  if (!model) return 0;

  // Rough estimation: 1 token ~= 4 chars
  const inputTokens = inputChars / 4;
  const outputTokens = outputChars / 4;

  const cost = (inputTokens / 1_000_000 * model.inputPrice) +
               (outputTokens / 1_000_000 * model.outputPrice);

  return cost;
};

// --- Generic LLM Caller ---
const callLLM = async (
  prompt: string,
  modelSelection: ModelSelection,
  apiKeys: Partial<Record<ApiProvider, string>>,
  jsonMode: boolean = false,
  signal?: AbortSignal
): Promise<{ text: string; cost: number }> => {

  const { provider, modelId, baseUrl } = modelSelection;
  const apiKey = apiKeys[provider] || '';

  let outputText = "";

  // 1. Google Gemini Strategy
  if (provider === 'google') {
    if (!apiKey) throw new Error("Missing Google API Key");

    const ai = new GoogleGenAI({ apiKey });

    // Note: The Google GenAI SDK might not fully support AbortSignal in all environments yet,
    // but we check the signal before making the request.
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    let response;
    if (jsonMode) {
       response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
           responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                contentPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                layoutSuggestion: { type: Type.STRING },
                // notes removed from strict schema to save tokens/time
              },
              required: ["title", "contentPoints", "layoutSuggestion"],
            },
          },
        },
      });
      outputText = response.text || "[]";
    } else {
      response = await ai.models.generateContent({
        model: modelId,
        contents: prompt
      });
      outputText = response.text || "";
    }
  }

  // 2. OpenAI Compatible Strategy (OpenAI, DeepSeek, Moonshot)
  else if (['openai', 'deepseek', 'moonshot'].includes(provider)) {
    if (!apiKey) throw new Error(`Missing API Key for ${provider}`);

    const url = `${baseUrl?.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        ...(jsonMode && provider === 'openai' ? { response_format: { type: "json_object" } } : {})
      }),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error (${provider}): ${err}`);
    }

    const data = await response.json();
    outputText = data.choices?.[0]?.message?.content || "";
  }

  // 3. Anthropic Strategy
  else if (provider === 'anthropic') {
    if (!apiKey) throw new Error("Missing Anthropic API Key");

    const response = await fetch(`${baseUrl?.replace(/\/+$/, '')}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error (Anthropic): ${err}`);
    }

    const data = await response.json();
    outputText = data.content?.[0]?.text || "";
  }
  else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const cost = calculateEstimatedCost(provider, modelId, prompt.length, outputText.length);
  return { text: outputText, cost };
};


export const generateOutline = async (
  content: string,
  topic: string,
  audience: string,
  purpose: string,
  slideCount: number,
  apiSettings: ApiSettings,
  signal?: AbortSignal
): Promise<ServiceResponse<OutlineItem[]>> => {
  try {
    const prompt = `
      Role Definition:
      You are a Presentation Outline Copilot. You excel at:
      - Understanding messy, unstructured user input.
      - Identifying the target audience.
      - Restructuring content from an "Executive Perspective".
      - Outputting a professional, restrained, conclusion-first presentation outline.
      - Visualizing how content should be presented on a slide (Layout Strategy).

      Goal:
      Convert the user's unstructured input into a structured outline suitable for a PPT, tailored to the target audience and logic.

      Input Context:
      - User Input: ${content.substring(0, 30000)}
      - Topic: ${topic}
      - Target Audience: ${audience}
      - Presentation Purpose: ${purpose}
      - Target Slide Count: ${slideCount} (Strict adherence)

      Audience Identification Rules (if not specified, default to "Tech Executive/CTO"):
      - Tech Executive / CTO: Focus on Architecture, Systemic view, Long-term evolution, Risks.
      - Management / Decision Makers: Focus on Value, ROI, Cost, Certainty.
      - Tech Team: Focus on Principles, Implementation, Toolchains.

      Content Rules:
      - Titles must be "Viewpoint / Judgment / Conclusion" (No noun piling, Conclusion first). Avoid using the word "Slide" in titles.
      - Bullet points: Concise, Executive-friendly, Value/Capability focused (not just implementation details). Use sentence fragments, not full sentences.
      - Information Density: Max 1 core conclusion per slide, 3-5 content points maximum per slide.
      - Language: The output language MUST match the language of the 'User Input'.

      Layout Strategy (Crucial - Must map to Renderer capabilities):
      - 'Cover': Only for Slide 1.
      - 'Ending': Only for the last Slide.
      - 'Compare': Use for pros/cons, before/after, or 2-column text.
      - 'Grid': Use for list of equal items, features, 3-4 pillars.
      - 'Timeline': Use for roadmaps, history, steps, or evolution.
      - 'Data': Use when a statistic, metric, or chart concept is the focus.
      - 'Center': Use for a single powerful statement or quote.
      - 'Standard': Use for standard title + bullet points (default).

      Structure Requirements (MANDATORY):
      1. **Slide 1 (Cover Page)**:
         - Title: Generate a compelling, professional title based on the input content (do NOT just use the provided 'Topic', make it descriptive).
         - ContentPoints: Use the first point for a subtitle/summary.
         - Layout: 'Cover'
      2. **Slides 2 to ${slideCount - 1} (Main Content)**: Logical flow. Vary layouts ('Compare', 'Grid', 'Timeline', 'Data', 'Standard').
      3. **Slide ${slideCount} (Ending Page)**: One powerful summary sentence, Call to Action, "Thank You", or company contact info.
         - Layout: 'Ending'

      Output Format:
      - Return a RAW JSON array of slides.
      - JSON Structure:
        [
          {
            "title": "Slide Title",
            "contentPoints": ["Point 1", "Point 2"],
            "layoutSuggestion": "Layout Name"
          }
        ]
    `;

    // Use Outline settings
    const { text, cost } = await callLLM(prompt, apiSettings.outline, apiSettings.apiKeys, true, signal);
    const jsonString = cleanJson(text);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      // Last ditch effort to fix common JSON errors
      parsed = [];
    }

    let items: OutlineItem[] = [];
    if (Array.isArray(parsed)) items = parsed as OutlineItem[];
    else if (parsed.slides && Array.isArray(parsed.slides)) items = parsed.slides as OutlineItem[];
    else items = [parsed] as OutlineItem[];

    // Ensure notes field exists but is empty
    items = items.map(i => ({ ...i, notes: "" }));

    return { data: items, cost };

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
       throw error;
    }
    // Error will be propagated to caller
    throw error;
  }
};

export const generateSpeakerNotes = async (
  slides: OutlineItem[],
  topic: string,
  audience: string,
  apiSettings: ApiSettings
): Promise<ServiceResponse<string[]>> => {
  try {
    const prompt = `
      You are an expert presentation coach.
      Write engaging speaker notes for the following presentation slides.

      Context:
      - Topic: ${topic}
      - Audience: ${audience}
      - Tone: Professional but conversational

      Speaker Notes Requirements:
      - Write 2-4 sentences per slide
      - Include: (1) Key message to emphasize, (2) Transition from previous slide (except Slide 1), (3) Suggested delivery tip
      - Write in first person ("I", "we") as if the speaker is talking
      - Do NOT read bullet points verbatim - add context, insights, and stories instead
      - Match the language of the slide content

      Slides Content:
      ${JSON.stringify(slides.map((s, i) => ({ index: i, title: s.title, points: s.contentPoints })))}

      Output:
      - Return ONLY a JSON array of strings
      - Each string is the speaker notes for the corresponding slide
      - Array length MUST match the number of slides exactly
      - Ensure smooth transitions between slides
      - Example format: ["Notes for slide 1", "Notes for slide 2", ...]
    `;

    // We use the Outline model settings for logic/writing tasks like notes
    const { text, cost } = await callLLM(prompt, apiSettings.outline, apiSettings.apiKeys, true);
    const jsonString = cleanJson(text);

    let notes: string[] = [];
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        notes = parsed.map(String);
      } else if (parsed.notes && Array.isArray(parsed.notes)) {
        notes = parsed.notes.map(String);
      }
    } catch (e) {
      // Parse error handled by fallback
      // Fallback: return empty strings if parse fails
      notes = slides.map(() => "");
    }

    return { data: notes, cost };
  } catch (error) {
    // Error will be propagated to caller
    throw error;
  }
}

export const generateSlideHtml = async (
  slide: OutlineItem,
  // style removed, replaced by colorPalette
  colorPalette: string,
  audience: string,
  apiSettings: ApiSettings,
  deckTitle: string,
  pageNumber: number,
  totalPages: number,
  customInstruction?: string
): Promise<ServiceResponse<string>> => {
  try {
    const prompt = `
      Role: Enterprise HTML Presentation Deck Renderer.
      Goal: Create a SINGLE, modern, print-ready HTML slide fragment using Tailwind CSS based on the provided content.

      ## 🔴 HARD RULES (NON-NEGOTIABLE)
      1. **Container**: strictly \`<section class="slide bg-[var(--c-bg)] text-[var(--c-text)]">...</section>\`.
      2. **Dimensions**: Strictly width: 1920px; height: 1080px.
      3. **Units**: Use ABSOLUTE UNITS (px) only for layout stability. NO rem, vh, vw.
      4. **Scrolling**: \`overflow: hidden\`. Content MUST fit.
      5. **Images**: NO external images (jpg/png). Use ONLY SVG icons (inline <svg>).
      6. **Backgrounds**:
         - ALL slides (Content, Cover, Ending) MUST have a SOLID background (using \`bg-[var(--c-bg)]\`).
         - **ABSOLUTELY NO GRADIENTS** on backgrounds.
      7. **Print**: \`print-color-adjust: exact\`.
      8. **Typography**: Use clear visual hierarchy - Titles 48-72px, Body 24-32px, Captions 18-20px.
      9. **Contrast**: Ensure text has sufficient contrast against background (WCAG AA minimum).
      10. **Spacing**: Use consistent spacing based on 8px scale: 48px, 32px, 24px, 16px, 8px.
      11. **CSS Variables**: DO NOT generate a <style> block. The following variables are injected globally:
         - \`--c-bg\`: Main background
         - \`--c-surface\`: Card/Section background
         - \`--c-text\`: Main text
         - \`--c-text-muted\`: Secondary text
         - \`--c-accent\`: Highlight/Brand color

      ## 📐 DOM STRUCTURE (MANDATORY)
      Inside the \`<section class="slide ...">\`, you must follow this structure:

      \`\`\`html
      <!-- 1. Header (Except Cover/Ending) -->
      <header class="absolute top-0 left-0 w-full p-12 flex justify-between items-start z-10">
         <div>
            <span class="inline-block py-1 px-3 rounded-full bg-[var(--c-surface)] text-[var(--c-accent)] text-xs font-bold tracking-wider mb-2 uppercase opacity-80">
               GenDeck AI
            </span>
            <h2 class="text-5xl font-bold leading-tight text-[var(--c-text)]">
               ${slide.title}
            </h2>
         </div>
         <!-- Optional: Top right icon or element -->
      </header>

      <!-- 2. Main Content -->
      <main class="absolute top-[200px] left-0 w-full h-[780px] px-12 z-0">
         <!-- YOUR GENERATED LAYOUT CONTENT HERE -->
      </main>

      <!-- 3. Footer -->
      <footer class="absolute bottom-0 left-0 w-full p-8 flex items-end text-[var(--c-text-muted)] z-10 border-t border-[var(--c-text-muted)]/10 mx-12 w-[calc(100%-96px)]">
         <div class="flex-1 text-left text-sm font-medium opacity-50">GenDeck</div>
         <div class="flex-1 text-center text-sm font-semibold opacity-80 tracking-wide uppercase truncate px-4">${deckTitle}</div>
         <div class="flex-1 text-right text-sm font-mono opacity-50">${pageNumber} / ${totalPages}</div>
      </footer>
      \`\`\`

      ## 📊 LAYOUT LOGIC
      Select layout based on Input Data 'Layout Hint':

      1. **Cover**: Central focus, big typography (72-96px title). No gradients. No header/footer.
      2. **Ending**: Central focus. MUST include a large 'Thank You' or concluding statement. MUST include a large SVG placeholder for a Company Logo. Clean, professional. No header/footer.
      3. **Compare**: Split screen (Left/Right). Good for Pros/Cons, Before/After, or comparisons.
      4. **Grid**: 2x2 or 3x2 cards. Good for lists/features, pillars, or equal-weight items.
      5. **Timeline**: Horizontal flow with connected steps. Good for roadmaps, history, or processes.
      6. **Data**: Big numbers prominently displayed, charts (simulated via CSS shapes/bars), or metric cards.
      7. **Center**: Single powerful statement or quote. Minimal elements, maximum impact.
      8. **Quote**: Large decorative quotation marks, italic text, attribution at bottom right.
      9. **Image-Heavy**: For diagrams/screenshots (use placeholder rectangles with descriptive labels).
      10. **Standard**: Title on left, bullet points below, visual/icon composition on right (default).

      ## 🎨 STYLING OVERRIDES (IMPORTANT)
      If the 'Layout Hint' or 'User Override' contains specific typography or style instructions (e.g. "Serif", "All Caps", "Centered", "Left Aligned", "Bold", "Modern"), you **MUST** apply relevant Tailwind classes to the structure.
      - Serif -> \`font-serif\`
      - All Caps -> \`uppercase\`
      - Bold -> \`font-extrabold\`
      - Centered -> \`text-center\` or flex centering.

      ## 🧿 ICONOGRAPHY
      - Use high-quality inline SVGs (Lucide/Feather style).
      - Stroke width: 1.5 or 2.
      - Color: \`var(--c-accent)\` or \`var(--c-text)\`.
      - Size: Icons should be 24px (inline), 32px (medium), or 48px (large hero) depending on context.
      - Use consistent icon style throughout the slide.

      ## INPUT DATA
      - Title: ${slide.title}
      - Content: ${JSON.stringify(slide.contentPoints)}
      - Layout Hint: ${slide.layoutSuggestion}
      ${customInstruction ? `- User Override: ${customInstruction}` : ''}

      ## OUTPUT
      - Return ONLY valid HTML code for the <section>.
      - NO markdown blocks.
    `;

    // Use Slide settings
    const { text, cost } = await callLLM(prompt, apiSettings.slides, apiSettings.apiKeys, false);
    return { data: cleanHtml(text), cost };

  } catch (error) {
    // Error handled by returning fallback HTML
    return {
      data: `<section class="slide flex items-center justify-center text-3xl" style="width:1920px;height:1080px;background-color:var(--c-bg);color:var(--c-accent);"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">⚠️</div><div>Error generating slide</div><div style="font-size:18px;margin-top:8px;opacity:0.7;">Please try regenerating</div></div></section>`,
      cost: 0
    };
  }
};
