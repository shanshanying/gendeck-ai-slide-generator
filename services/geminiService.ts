
import { GoogleGenAI, Type } from "@google/genai";
import { OutlineItem, ApiSettings, ServiceResponse, ModelSelection, ApiProvider } from "../types";
import { PROVIDERS, findAudienceProfile, PURPOSE_LAYOUT_GUIDES, getStylePreset } from "../constants";

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

const ALLOWED_LAYOUTS = ['Cover', 'Ending', 'Standard', 'Compare', 'Grid', 'Timeline', 'Data', 'Center', 'Quote', 'Image-Heavy'] as const;
type AllowedLayout = (typeof ALLOWED_LAYOUTS)[number];

const normalizePurposeText = (text: string): string => text.toLowerCase().trim();

const selectPurposeGuide = (purpose: string) => {
  const normalizedPurpose = normalizePurposeText(purpose);
  return PURPOSE_LAYOUT_GUIDES.find((guide) => {
    const candidates = [guide.purpose, ...(guide.keywords || [])].map(normalizePurposeText);
    return candidates.some((candidate) => normalizedPurpose.includes(candidate) || candidate.includes(normalizedPurpose));
  });
};

const normalizeLayoutSuggestion = (
  rawLayout: string | undefined,
  index: number,
  total: number
): AllowedLayout => {
  const normalized = (rawLayout || '').toLowerCase().replace(/layout[:\s-]*/g, '').trim();
  const matched = ALLOWED_LAYOUTS.find((layout) => layout.toLowerCase() === normalized);
  if (matched) return matched;
  if (index === 0) return 'Cover';
  if (index === total - 1) return 'Ending';
  return 'Standard';
};

const hasSlideMarkers = (content: string): boolean => {
  return /(^|\n)\s*#{1,6}\s*(slide|幻灯片|頁|页)\s*\d+/i.test(content);
};

const countSlideMarkers = (content: string): number => {
  const matches = content.match(/(^|\n)\s*#{1,6}\s*(slide|幻灯片|頁|页)\s*\d+/gi);
  return matches ? matches.length : 0;
};

const ensureOutlineShape = (items: OutlineItem[], slideCount: number): OutlineItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Failed to generate a valid outline JSON array.');
  }
  if (items.length !== slideCount) {
    throw new Error(`Outline slide count mismatch: expected ${slideCount}, got ${items.length}.`);
  }

  return items.map((item, index) => {
    const title = (item?.title || '').toString().trim();
    const pointsRaw = Array.isArray(item?.contentPoints) ? item.contentPoints : [];
    const contentPoints = pointsRaw.map((p) => String(p).trim()).filter(Boolean);

    if (!title) {
      throw new Error(`Slide ${index + 1} is missing a title.`);
    }
    if (contentPoints.length === 0) {
      throw new Error(`Slide ${index + 1} is missing content points.`);
    }

    return {
      title,
      contentPoints,
      notes: "",
      layoutSuggestion: normalizeLayoutSuggestion(item?.layoutSuggestion, index, items.length)
    };
  });
};

// --- Generic LLM Caller ---
const callLLM = async (
  prompt: string,
  modelSelection: ModelSelection,
  apiKeys: Partial<Record<ApiProvider, string>>,
  jsonMode: boolean = false,
  signal?: AbortSignal,
  onProgress?: (partialText: string) => void
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
  else if (['openai', 'deepseek', 'moonshot', 'custom'].includes(provider)) {
    if (provider !== 'custom' && !apiKey) throw new Error(`Missing API Key for ${provider}`);
    if (!baseUrl) throw new Error(`Missing Base URL for ${provider}`);

    const url = `${baseUrl?.replace(/\/+$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const useStreaming = Boolean(onProgress) && !jsonMode;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        ...(useStreaming ? { stream: true } : {}),
        ...(jsonMode && provider === 'openai' ? { response_format: { type: "json_object" } } : {})
      }),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error (${provider}): ${err}`);
    }

    if (useStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      outputText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              outputText += delta;
              onProgress?.(outputText);
            }
          } catch {
            // ignore malformed non-JSON SSE fragments
          }
        }
      }

    } else {
      const data = await response.json();
      outputText = data.choices?.[0]?.message?.content || "";
    }
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


export interface ContentAnalysis {
  audience: string;
  purpose: string;
  reasoning: string;
}

export const analyzeContent = async (
  content: string,
  lang: 'en' | 'zh',
  apiSettings: ApiSettings,
  signal?: AbortSignal
): Promise<ServiceResponse<ContentAnalysis>> => {
  try {
    const prompt = lang === 'zh' ? `
      角色定义:
      你是一位专业的演示文稿策略顾问。你擅长分析内容并确定最适合的目标受众和演示目标。

      任务:
      分析用户提供的内容，推荐最适合的目标受众和演示目标。

      输入内容:
      ${content.substring(0, 15000)}

      输出要求:
      1. audience: 最适合的目标受众群体（简洁描述，如"技术高管/CTO"、"产品团队"、"投资者"等）
      2. purpose: 演示的核心目标（简洁描述，如"说服投资"、"技术方案评审"、"产品发布"等）
      3. reasoning: 简要解释为什么推荐这个受众和目标（1-2句话）

      输出格式:
      返回一个 JSON 对象，格式如下:
      {
        "audience": "推荐的目标受众",
        "purpose": "演示目标",
        "reasoning": "推荐理由"
      }
    ` : `
      Role Definition:
      You are a professional presentation strategy consultant. You excel at analyzing content and determining the most suitable target audience and presentation purpose.

      Task:
      Analyze the user's content and recommend the best target audience and presentation purpose.

      Input Content:
      ${content.substring(0, 15000)}

      Output Requirements:
      1. audience: The most suitable target audience (concise description, e.g., "Tech Executives/CTO", "Product Team", "Investors", etc.)
      2. purpose: The core purpose of the presentation (concise description, e.g., "Secure Investment", "Technical Review", "Product Launch", etc.)
      3. reasoning: Brief explanation of why this audience and purpose are recommended (1-2 sentences)

      Output Format:
      Return a JSON object in this format:
      {
        "audience": "Recommended target audience",
        "purpose": "Presentation purpose",
        "reasoning": "Reasoning for recommendation"
      }
    `;

    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true, signal);
    const jsonString = cleanJson(text);

    let parsed: ContentAnalysis;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      // Fallback parsing
      parsed = {
        audience: lang === 'zh' ? '技术高管/CTO' : 'Tech Executives/CTO',
        purpose: lang === 'zh' ? '方案评审' : 'Technical Review',
        reasoning: lang === 'zh' ? '基于内容类型自动推断' : 'Auto-inferred based on content type'
      };
    }

    return { data: parsed, cost };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw error;
  }
};

export const generateOutline = async (
  content: string,
  topic: string,
  audience: string,
  purpose: string,
  slideCount: number,
  apiSettings: ApiSettings,
  signal?: AbortSignal,
  strictMode: boolean = false,
  stylePresetId?: string
): Promise<ServiceResponse<OutlineItem[]>> => {
  try {
    // Get style guidance - use user-selected preset if provided, otherwise use audience default
    const profile = stylePresetId ? getStylePreset(stylePresetId) : findAudienceProfile(audience);
    const purposeGuide = selectPurposeGuide(purpose);
    const structuredInputDetected = strictMode && hasSlideMarkers(content);
    const markerSlideCount = structuredInputDetected ? countSlideMarkers(content) : 0;
    const expectedSlideCount = structuredInputDetected && markerSlideCount > 0 ? markerSlideCount : slideCount;

    const strictModeInstruction = strictMode ? `
      ⚠️ STRICT MODE ENABLED:
      - You MUST generate the outline STRICTLY based on the user's provided input.
      - DO NOT add new content, examples, or information that is not explicitly in the user's input.
      - DO NOT expand on ideas beyond what the user provided.
      - Your task is to REORGANIZE and STRUCTURE the existing content, not to create new content.
      - Only use facts, data, and statements that appear in the user's input.
      - You may rephrase for clarity and structure, but the meaning and information must remain exactly as provided.
      
      INPUT STRUCTURE RECOGNITION:
      - If slide markers like "## Slide 1", "## Slide 2" exist, preserve structure and order.
      - Do not merge or split slides already defined in user input.
    ` : '';

    const structureRequirements = structuredInputDetected ? `
      Structure Requirements (MANDATORY - Structured Input Detected):
      1. Preserve each user-defined "Slide N" section as one output slide.
      2. Keep the original order and count exactly as provided.
      3. Derive each title from section content; do not force extra Cover/Ending slides.
      4. Choose layoutSuggestion from allowed values only.
    ` : `
      Structure Requirements (MANDATORY):
      1. **Slide 1 (Cover Page)**:
         - Title: Generate a compelling, professional title based on the input content (do NOT just use the provided 'Topic', make it descriptive).
         - ContentPoints: Use the first point for a subtitle/summary.
         - Layout: 'Cover'
      2. **Slides 2 to ${Math.max(2, expectedSlideCount - 1)} (Main Content)**: Logical flow. ${profile ? `Prioritize these layouts: ${profile.layoutPreferences.primary.slice(0, 4).join(', ')}.` : "Vary layouts ('Compare', 'Grid', 'Timeline', 'Data', 'Standard')."}
      3. **Slide ${expectedSlideCount} (Ending Page)**: One powerful summary sentence, Call to Action, "Thank You", or company contact info.
         - Layout: 'Ending'
    `;

    // Build audience-specific style guidance
    const styleGuidance = profile ? `
      ## 🎨 AUDIENCE-SPECIFIC STYLE GUIDANCE
      
      This presentation is for: **${audience}**
      
      **Typography Style:**
      ${profile.typography.fontCharacteristics}
      - Font family guidance: ${profile.typography.fontFamily}
      - Title case style: ${profile.typography.titleCase}
      
      **Content Tone & Style:**
      - Tone: ${profile.contentStyle.tone}
      - Formality: ${profile.contentStyle.formality}
      - Bullet point style: ${profile.contentStyle.bulletStyle}
      - Key emphasis areas: ${profile.contentStyle.emphasis.join(', ')}
      
      **Visual Density:** ${profile.visualDensity}
      **Data Visualization:** ${profile.dataVisualization}
      
      **Preferred Layouts (in order):** ${profile.layoutPreferences.primary.join(', ')}
      **Layouts to Avoid:** ${profile.layoutPreferences.avoid.join(', ')}
    ` : `
      ## 🎨 STYLE GUIDANCE
      
      **Content Rules:**
      - Titles must be "Viewpoint / Judgment / Conclusion" (No noun piling, Conclusion first). Avoid using the word "Slide" in titles.
      - Bullet points: Concise, Executive-friendly, Value/Capability focused (not just implementation details). Use sentence fragments, not full sentences.
      - Information Density: Max 1 core conclusion per slide, 3-5 content points maximum per slide.
    `;

    // Build purpose-specific layout guidance
    const layoutGuidance = purposeGuide ? `
      ## 📐 PURPOSE-SPECIFIC LAYOUT GUIDANCE
      
      This is a "${purpose}" presentation.
      
      **Recommended Layout Priority:**
      ${purposeGuide.layouts.map((l, i) => `${i + 1}. ${l}`).join('\n      ')}
      
      **Content Focus:**
      ${purposeGuide.contentFocus}
    ` : `
      ## 📐 LAYOUT STRATEGY
      
      Select layouts based on content type:
      - 'Cover': Only for Slide 1.
      - 'Ending': Only for the last Slide.
      - 'Compare': Use for pros/cons, before/after, or 2-column text.
      - 'Grid': Use for list of equal items, features, 3-4 pillars.
      - 'Timeline': Use for roadmaps, history, steps, or evolution.
      - 'Data': Use when a statistic, metric, or chart concept is the focus.
      - 'Center': Use for a single powerful statement or quote.
      - 'Standard': Use for standard title + bullet points (default).
    `;

    const prompt = `
      Role Definition:
      You are a Presentation Outline Copilot. You excel at:
      - Understanding messy, unstructured user input.
      - Identifying the target audience and adapting style accordingly.
      - Restructuring content from an "Executive Perspective".
      - Outputting a professional, restrained, conclusion-first presentation outline.
      - Visualizing how content should be presented on a slide (Layout Strategy).

      Goal:
      Convert the user's unstructured input into a structured outline suitable for a PPT, tailored to the target audience and logic.

      ${strictModeInstruction}

      Input Context:
      - User Input: ${content.substring(0, 30000)}
      - Topic: ${topic}
      - Target Audience: ${audience}
      - Presentation Purpose: ${purpose}
      - Target Slide Count: ${expectedSlideCount} (Strict adherence)

      ${styleGuidance}

      ${layoutGuidance}

      **Language:** The output language MUST match the language of the 'User Input'.

      ${structureRequirements}

      Output Format:
      - Return a RAW JSON array of slides.
      - slide array length MUST equal ${expectedSlideCount}.
      - layoutSuggestion MUST be exactly one of: ${ALLOWED_LAYOUTS.join(', ')}.
      - JSON Structure:
        [
          {
            "title": "Slide Title",
            "contentPoints": ["Point 1", "Point 2"],
            "layoutSuggestion": "Standard"
          }
        ]
    `;

    // Use model settings
    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true, signal);
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

    items = ensureOutlineShape(items, expectedSlideCount);

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

    // Use model settings for speaker notes generation
    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true);
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
  colorPalette: string,
  audience: string,
  apiSettings: ApiSettings,
  deckTitle: string,
  pageNumber: number,
  totalPages: number,
  customInstruction?: string,
  stylePresetId?: string,
  signal?: AbortSignal,
  onProgress?: (partialText: string) => void
): Promise<ServiceResponse<string>> => {
  try {
    // Get style guidance - use user-selected preset if provided, otherwise use audience default
    const profile = stylePresetId ? getStylePreset(stylePresetId) : findAudienceProfile(audience);
    
    // Build style-specific guidance for the renderer
    const styleGuidance = profile ? `
      ## 🎨 AUDIENCE-SPECIFIC DESIGN GUIDANCE
      
      This slide is for: **${audience}**
      
      **Typography Requirements:**
      ${profile.typography.fontCharacteristics}
      - Apply font classes: Use \`${profile.typography.fontFamily.split(',')[0].trim()}\` or appropriate fallbacks
      - Title case: ${profile.typography.titleCase} (apply \`${profile.typography.titleCase === 'uppercase' ? 'uppercase' : ''}\` class if needed)
      
      **Visual Density:** ${profile.visualDensity}
      - ${profile.visualDensity === 'minimal' ? 'Use generous whitespace, larger spacing between elements (64px+ gaps)' : ''}
      - ${profile.visualDensity === 'dense' ? 'Information-rich layout, tighter spacing (24-32px gaps), maximize content' : ''}
      - ${profile.visualDensity === 'balanced' ? 'Moderate spacing (32-48px gaps), balanced content and whitespace' : ''}
      
      **Data Visualization Level:** ${profile.dataVisualization}
      - ${profile.dataVisualization === 'heavy' ? 'Incorporate charts, metrics, progress bars, data cards where applicable' : ''}
      - ${profile.dataVisualization === 'minimal' ? 'Focus on narrative and concepts, minimize data displays' : ''}
      
      **Content Emphasis:** Focus on ${profile.contentStyle.emphasis.join(', ')}
    ` : '';

    const prompt = `
      Role: Enterprise HTML Presentation Deck Renderer.
      Goal: Create a SINGLE, modern, print-ready HTML slide fragment using Tailwind CSS based on the provided content.

      ## 🔴 HARD RULES (NON-NEGOTIABLE)
      1. **Container**: strictly \`<section class="slide" style="background-color: var(--c-bg); color: var(--c-text);">...</section>\`.
      2. **Dimensions**: Strictly width: 1920px; height: 1080px.
      3. **Units**: Use ABSOLUTE UNITS (px) only for layout stability. NO rem, vh, vw.
      4. **Scrolling**: \`overflow: hidden\`. Content MUST fit.
      5. **Images**: NO external images (jpg/png). Use ONLY SVG icons (inline <svg>).
      6. **Backgrounds**:
         - ALL slides (Content, Cover, Ending) MUST have a SOLID background using inline style: \`style="background-color: var(--c-bg);"\`.
         - **ABSOLUTELY NO GRADIENTS** on backgrounds.
      7. **Print**: \`print-color-adjust: exact\`.
      8. **Typography**: Use clear visual hierarchy - Titles 48-72px, Body 24-32px, Captions 18-20px.
      9. **Contrast**: Ensure text has sufficient contrast against background (WCAG AA minimum).
      10. **Spacing**: Use consistent spacing based on 8px scale: 48px, 32px, 24px, 16px, 8px.
      11. **CSS Variables**: DO NOT generate a <style> block. Use inline styles with CSS variables. Available variables:
         
         **Background** (4):
         - \`var(--c-bg)\`: Main background
         - \`var(--c-bg-soft)\`: Soft/subtle background
         - \`var(--c-bg-glass)\`: Glassmorphism background (with transparency)
         - \`var(--c-bg-invert)\`: Inverted background (for contrast)
         
         **Text** (4):
         - \`var(--c-text)\`: Primary text
         - \`var(--c-text-muted)\`: Secondary/muted text
         - \`var(--c-text-faint)\`: Very subtle text
         - \`var(--c-text-invert)\`: Inverted text (for contrast)
         
         **Structure** (3):
         - \`var(--c-border)\`: Standard border
         - \`var(--c-border-strong)\`: Emphasized border
         - \`var(--c-divider)\`: Divider line
         
         **Accent** (3):
         - \`var(--c-primary)\`: Primary brand color
         - \`var(--c-secondary)\`: Secondary color
         - \`var(--c-accent)\`: Accent highlight
         
         **Semantic** (4):
         - \`var(--c-success)\`: Success/positive
         - \`var(--c-warning)\`: Warning/attention
         - \`var(--c-danger)\`: Error/danger
         - \`var(--c-info)\`: Information
      
      ${styleGuidance}

      ## 📐 DOM STRUCTURE (MANDATORY)
      Inside the \`<section class="slide" style="background-color: var(--c-bg); color: var(--c-text); width: 1920px; height: 1080px; position: relative; overflow: hidden;">\`, you must follow this structure:

      \`\`\`html
      <!-- 1. Header (Except Cover/Ending) -->
      <header style="position: absolute; top: 0; left: 0; width: 100%; padding: 48px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;">
         <div>
            <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: var(--c-bg-soft); color: var(--c-primary); font-size: 12px; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 8px; text-transform: uppercase; opacity: 0.8;">
               GenDeck AI
            </span>
            <h2 class="text-5xl font-bold leading-tight text-[var(--c-text)]">
               ${slide.title}
            </h2>
         </div>
         <!-- Optional: Top right icon or element -->
      </header>

      <!-- 2. Main Content -->
      <main style="position: absolute; top: 200px; left: 0; width: 100%; height: 780px; padding: 0 48px; z-index: 0;">
         <!-- YOUR GENERATED LAYOUT CONTENT HERE - Use CSS variables for colors: style="color: var(--c-text);" or style="background-color: var(--c-bg-soft);" -->
      </main>

      <!-- 3. Footer -->
      <footer style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 32px; display: flex; align-items: flex-end; color: var(--c-text-muted); z-index: 10; border-top: 1px solid var(--c-border); margin: 0 48px; width: calc(100% - 96px);">
         <div style="flex: 1; text-align: left; font-size: 14px; font-weight: 500; opacity: 0.5;">GenDeck</div>
         <div style="flex: 1; text-align: center; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 0.05em; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 16px;">${deckTitle}</div>
         <div style="flex: 1; text-align: right; font-size: 14px; font-family: monospace; opacity: 0.5;">${pageNumber} / ${totalPages}</div>
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
      If the 'Layout Hint' or 'User Override' contains specific typography or style instructions (e.g. "Serif", "All Caps", "Centered", "Left Aligned", "Bold", "Modern"), you **MUST** apply relevant styles.
      - Use inline styles for colors: \`style="color: var(--c-text);"\`, \`style="background-color: var(--c-bg-soft);"\`, etc.
      - Use Tailwind for layout: \`flex\`, \`grid\`, \`absolute\`, \`relative\`, etc.
      - Typography: \`font-serif\`, \`uppercase\`, \`font-bold\`, \`text-center\`, etc.

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

    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, false, signal, onProgress);
    return { data: cleanHtml(text), cost };

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw error;
  }
};
