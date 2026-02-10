
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
    const purposeGuide = PURPOSE_LAYOUT_GUIDES.find(g => 
      purpose.toLowerCase().includes(g.purpose.toLowerCase())
    );

    const strictModeInstruction = strictMode ? `
      ⚠️ STRICT MODE ENABLED:
      - You MUST generate the outline STRICTLY based on the user's provided input.
      - DO NOT add new content, examples, or information that is not explicitly in the user's input.
      - DO NOT expand on ideas beyond what the user provided.
      - Your task is to REORGANIZE and STRUCTURE the existing content, not to create new content.
      - Only use facts, data, and statements that appear in the user's input.
      - You may rephrase for clarity and structure, but the meaning and information must remain exactly as provided.
      
      INPUT STRUCTURE RECOGNITION:
      - The user's input may already be structured with slide markers like "## Slide 1", "## Slide 2", etc.
      - If such markers exist, you MUST preserve the original slide structure and count.
      - Map each "## Slide N" section to a corresponding slide in the output.
      - Use the content under each "## Slide N" section as the contentPoints for that slide.
      - Derive the slide title from the first line after "## Slide N" or from the main heading within that section.
      - DO NOT merge or split slides that are already defined by "## Slide N" markers.
      - Maintain the exact order of slides as they appear in the input.
    ` : '';

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
      - Target Slide Count: ${slideCount} (Strict adherence)

      ${styleGuidance}

      ${layoutGuidance}

      **Language:** The output language MUST match the language of the 'User Input'.

      Structure Requirements (MANDATORY):
      1. **Slide 1 (Cover Page)** - GRAND OPENING:
         - Title: Create an impactful, memorable title (5-8 words). Use action verbs or bold statements. NOT just the topic name.
         - ContentPoints: 
           * First point: Compelling subtitle that explains the value proposition (what will audience learn/take away)
           * Second point: Speaker name, title, company
           * Third point: Event/conference name (if applicable)
           * Fourth point: Social handle or GitHub (optional)
         - Layout: 'Cover'
         - Design Notes: Will feature large typography (80-120px), hero visual element, centered composition
      
      2. **Slides 2 to ${slideCount - 1} (Main Content)**: Logical flow. ${profile ? `Prioritize these layouts: ${profile.layoutPreferences.primary.slice(0, 4).join(', ')}.` : "Vary layouts ('Compare', 'Grid', 'Timeline', 'Data', 'Standard')."}
      
      3. **Slide ${slideCount} (Ending Page)** - POWERFUL CLOSE:
         - Title: "Thank You" OR a powerful one-sentence takeaway/lesson
         - ContentPoints:
           * First point: Clear Call to Action (visit repo, try the tool, read docs, etc.)
           * Second point: GitHub repository URL or main resource link
           * Third point: Social handles (Twitter/X, LinkedIn, GitHub) for connection
           * Fourth point: Website or documentation link
           * Fifth point: QR code destination (if applicable)
         - Layout: 'Ending'
         - Design Notes: Centered, large thank you message, QR code placeholder, social links row

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
  currentHtml?: string
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

      ## 📋 COVER PAGE DESIGN GUIDE
      The Cover slide should create immediate impact:
      - Full-screen centered layout with NO header/footer
      - Large hero visual: geometric shapes, abstract tech patterns, or meaningful icon (200-400px)
      - Title: 80-120px, font-weight 800, center-aligned, maximum 2 lines
      - Subtitle: 28-36px, color: --c-text-muted, positioned 32-48px below title
      - Speaker info block at bottom: name (24px, --c-text), title/company (18px, --c-text-muted), social (16px, --c-text-faint)
      - Optional: Event badge in top-right corner with --c-bg-soft background
      - Background: solid --c-bg color with optional subtle radial gradient accent (opacity 0.08)
      
      ## 📋 ENDING PAGE DESIGN GUIDE
      The Ending slide should be memorable and actionable:
      - Full-screen centered layout with NO header/footer
      - Main message: "Thank You" at 72-96px OR powerful takeaway sentence at 48-64px
      - Call to Action: Clear next step (28-32px, use --c-primary for emphasis)
      - QR Code placeholder: 180px square, bordered with --c-border-strong, centered below CTA
      - Links section: GitHub, docs, social handles in horizontal row or clean vertical list
      - Visual hierarchy: Main message > CTA > QR > Links
      - Background: solid --c-bg with optional subtle accent shape

      ## 📊 LAYOUT LOGIC
      Select layout based on Input Data 'Layout Hint':

      1. **Cover** (Slide 1): Impactful first impression. No header/footer.
         - **Structure**: Full-screen centered composition with dramatic typography
         - **Title**: 80-120px, bold, maximum impact (use CSS font-weight: 800 or font-black)
         - **Subtitle**: 28-36px, positioned below title with generous spacing (32-48px gap)
         - **Visual Element**: Large geometric shape, abstract tech pattern, or hero icon (200-400px) using CSS variables --c-primary and --c-secondary
         - **Speaker Info**: Bottom area - name, title, company, social handle (GitHub/Twitter). Use --c-text-muted at 20-24px
         - **Event Badge**: Optional top corner badge with conference/event name using --c-bg-soft background
         - **Background**: Solid --c-bg with optional subtle geometric accent shapes (very low opacity ~0.1)
         - **Layout Rules**: Center-aligned. Ample whitespace. No bullet points.

      2. **Ending** (Last Slide): Memorable closing. No header/footer.
         - **Structure**: Centered composition with clear visual hierarchy
         - **Main Message**: Large "Thank You" (72-96px) OR powerful one-sentence takeaway (48-64px)
         - **Call to Action**: Clear CTA below main message - GitHub repo, Documentation URL, or "Try it now" (28-32px, use --c-primary color or button style)
         - **QR Code Placeholder**: 160-200px square with border --c-border-strong for project links/resources
         - **Connect Section**: Social/GitHub handles, website URL in horizontal row at bottom
         - **Company Logo Area**: Centered logo placeholder (if applicable) above connect section
         - **Background**: Solid --c-bg - can use a subtle gradient accent line or shape for visual interest (keep minimal)
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
      ${currentHtml ? `- Current Slide HTML: \n\`\`\`html\n${currentHtml}\n\`\`\`` : ''}

      ## OUTPUT
      - Return ONLY valid HTML code for the <section>.
      - NO markdown blocks.
    `;

    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, false);
    return { data: cleanHtml(text), cost };

  } catch (error: any) {
    // Log error for debugging
    console.error('Error generating slide:', error);
    
    // Error handled by returning fallback HTML
    return {
      data: `<section class="slide flex items-center justify-center text-3xl" style="width:1920px;height:1080px;background-color:var(--c-bg);color:var(--c-accent);"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">⚠️</div><div>Error generating slide</div><div style="font-size:18px;margin-top:8px;opacity:0.7;">${error.message || 'Unknown error'}</div></div></section>`,
      cost: 0
    };
  }
};
