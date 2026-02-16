
import { GoogleGenAI, Type } from "@google/genai";
import { OutlineItem, ApiSettings, ServiceResponse, ModelSelection, ApiProvider, Language } from "../types";
import { PROVIDERS, findAudienceProfile, PURPOSE_LAYOUT_GUIDES, getStylePreset, getDeckDesignSystemPrompt, getLayoutArchetypeGuideline } from "../constants";

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
type JsonTask = 'outline' | 'analysis' | 'notes';
type PromptLang = 'en' | 'zh';

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

const isLikelyChinese = (text: string): boolean => /[\u4e00-\u9fff]/.test(text);
const resolvePromptLang = (...texts: Array<string | undefined>): PromptLang =>
  texts.some((t) => t && isLikelyChinese(t)) ? 'zh' : 'en';

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

const getGeminiResponseSchema = (task: JsonTask) => {
  if (task === 'analysis') {
    return {
      type: Type.OBJECT,
      properties: {
        audience: { type: Type.STRING },
        purpose: { type: Type.STRING },
        reasoning: { type: Type.STRING },
      },
      required: ['audience', 'purpose', 'reasoning'],
    };
  }

  if (task === 'notes') {
    return {
      type: Type.OBJECT,
      properties: {
        notes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['notes'],
    };
  }

  return {
    type: Type.OBJECT,
    properties: {
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            contentPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            layoutSuggestion: { type: Type.STRING },
          },
          required: ['title', 'contentPoints', 'layoutSuggestion'],
        },
      },
    },
    required: ['slides'],
  };
};

// --- Generic LLM Caller ---
const callLLM = async (
  prompt: string,
  modelSelection: ModelSelection,
  apiKeys: Partial<Record<ApiProvider, string>>,
  jsonMode: boolean = false,
  signal?: AbortSignal,
  onProgress?: (partialText: string) => void,
  jsonTask: JsonTask = 'outline'
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
          responseSchema: getGeminiResponseSchema(jsonTask),
        },
      });
      outputText = response.text || "{}";
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
        ...(jsonMode ? { response_format: { type: "json_object" } } : {})
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
  apiSettings: ApiSettings,
  signal?: AbortSignal,
  lang?: Language
): Promise<ServiceResponse<ContentAnalysis>> => {
  try {
    const useChinese = isLikelyChinese(content);
    const promptLang: PromptLang = lang || resolvePromptLang(content);
    const prompt = promptLang === 'zh' ? `
      角色定义：
      你是专业的演示策略顾问，擅长分析内容并判断最合适的目标受众与演示目的。

      任务：
      分析用户输入内容，并给出最匹配的目标受众与演示目的建议。

      输入内容：
      ${content.substring(0, 15000)}

      输出要求：
      1. audience：最合适的目标受众（简洁描述，例如“技术管理层/CTO”、“产品团队”、“投资人”等）
      2. purpose：本次演示的核心目的（简洁描述，例如“争取投资”、“技术评审”、“产品发布”等）
      3. reasoning：简要说明推荐原因（1-2 句话）
      4. 语言规则：audience/purpose/reasoning 必须与输入内容语言保持一致。

      输出格式：
      仅返回 JSON 对象，格式如下：
      {
        "audience": "推荐目标受众",
        "purpose": "演示目的",
        "reasoning": "推荐原因"
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
      4. Language rule: Keep audience/purpose/reasoning in the same language as input content.

      Output Format:
      Return a JSON object in this format:
      {
        "audience": "Recommended target audience",
        "purpose": "Presentation purpose",
        "reasoning": "Reasoning for recommendation"
      }
    `;

    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true, signal, undefined, 'analysis');
    const jsonString = cleanJson(text);

    let parsed: ContentAnalysis;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      // Fallback parsing
      parsed = {
        audience: useChinese ? '技术管理层 / CTO' : 'Tech Executives/CTO',
        purpose: useChinese ? '技术评审' : 'Technical Review',
        reasoning: useChinese ? '根据内容类型自动推断。' : 'Auto-inferred based on content type'
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
  stylePresetId?: string,
  lang?: Language
): Promise<ServiceResponse<OutlineItem[]>> => {
  try {
    // Get style guidance - use user-selected preset if provided, otherwise use audience default
    const profile = stylePresetId ? getStylePreset(stylePresetId) : findAudienceProfile(audience);
    const purposeGuide = selectPurposeGuide(purpose);
    const designSystemGuidance = getDeckDesignSystemPrompt(audience, purpose, stylePresetId);
    const structuredInputDetected = strictMode && hasSlideMarkers(content);
    const markerSlideCount = structuredInputDetected ? countSlideMarkers(content) : 0;
    const expectedSlideCount = structuredInputDetected && markerSlideCount > 0 ? markerSlideCount : slideCount;
    const promptLang: PromptLang = lang || resolvePromptLang(content, topic, audience, purpose);

    const strictModeInstruction = strictMode ? (promptLang === 'zh' ? `
      ⚠️ 已启用严格模式：
      - 你必须严格基于用户输入生成大纲。
      - 不得新增输入中不存在的内容、案例或信息。
      - 不得超出用户提供信息进行扩写。
      - 你的任务是重组与结构化，不是创作新内容。
      - 仅可使用输入中出现的事实、数据与结论。
      - 可为清晰性进行改写，但语义必须与原文一致。
      
      输入结构识别：
      - 若存在“## Slide 1 / ## 幻灯片 1”类标记，需保持结构与顺序。
      - 不得随意合并或拆分用户已定义页面。
    ` : `
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
    `) : '';

    const structureRequirements = structuredInputDetected ? (promptLang === 'zh' ? `
      结构要求（强制 - 识别到结构化输入）：
      1. 将每个用户定义的“Slide N / 幻灯片 N”区块映射为一页输出。
      2. 必须保持原有顺序与页数。
      3. 标题应从该区块内容提炼，不要强制追加 Cover/Ending 页。
      4. layoutSuggestion 只能使用允许值。
    ` : `
      Structure Requirements (MANDATORY - Structured Input Detected):
      1. Preserve each user-defined "Slide N" section as one output slide.
      2. Keep the original order and count exactly as provided.
      3. Derive each title from section content; do not force extra Cover/Ending slides.
      4. Choose layoutSuggestion from allowed values only.
    `) : (promptLang === 'zh' ? `
      结构要求（强制）：
      1. **第 1 页（封面）**：
         - 标题：根据输入内容生成专业且有信息量的标题（不要直接复用 Topic）。
         - ContentPoints：第 1 点用于副标题/摘要。
         - Layout：'Cover'
      2. **第 2 到 ${Math.max(2, expectedSlideCount - 1)} 页（主体）**：保持逻辑推进。${profile ? `优先布局：${profile.layoutPreferences.primary.slice(0, 4).join('、')}。` : "可组合使用 'Compare'、'Grid'、'Timeline'、'Data'、'Standard'。"}
      3. **第 ${expectedSlideCount} 页（结束）**：给出总结/行动号召/感谢语/联系方式。
         - Layout：'Ending'
    ` : `
      Structure Requirements (MANDATORY):
      1. **Slide 1 (Cover Page)**:
         - Title: Generate a compelling, professional title based on the input content (do NOT just use the provided 'Topic', make it descriptive).
         - ContentPoints: Use the first point for a subtitle/summary.
         - Layout: 'Cover'
      2. **Slides 2 to ${Math.max(2, expectedSlideCount - 1)} (Main Content)**: Logical flow. ${profile ? `Prioritize these layouts: ${profile.layoutPreferences.primary.slice(0, 4).join(', ')}.` : "Vary layouts ('Compare', 'Grid', 'Timeline', 'Data', 'Standard')."}
      3. **Slide ${expectedSlideCount} (Ending Page)**: One powerful summary sentence, Call to Action, "Thank You", or company contact info.
         - Layout: 'Ending'
    `);

    // Build audience-specific style guidance
    const styleGuidance = profile ? (promptLang === 'zh' ? `
      ## 🎨 受众风格指导
      
      当前受众：**${audience}**
      
      **排版要求：**
      ${profile.typography.fontCharacteristics}
      - 字体建议：${profile.typography.fontFamily}
      - 标题大小写风格：${profile.typography.titleCase}
      
      **内容语气与表达：**
      - 语气：${profile.contentStyle.tone}
      - 正式程度：${profile.contentStyle.formality}
      - 要点书写风格：${profile.contentStyle.bulletStyle}
      - 重点强调：${profile.contentStyle.emphasis.join('、')}
      
      **视觉密度：** ${profile.visualDensity}
      **数据可视化强度：** ${profile.dataVisualization}
      
      **优先布局：** ${profile.layoutPreferences.primary.join('、')}
      **避免布局：** ${profile.layoutPreferences.avoid.join('、')}
    ` : `
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
    `) : (promptLang === 'zh' ? `
      ## 🎨 风格指导
      
      **内容规则：**
      - 标题优先输出“观点/判断/结论”，避免名词堆叠，避免标题里出现“Slide”。
      - 要点应简洁、适合管理层阅读、突出价值与能力（而非仅实现细节）。
      - 信息密度：每页最多 1 个核心结论，3-5 个要点。
    ` : `
      ## 🎨 STYLE GUIDANCE
      
      **Content Rules:**
      - Titles must be "Viewpoint / Judgment / Conclusion" (No noun piling, Conclusion first). Avoid using the word "Slide" in titles.
      - Bullet points: Concise, Executive-friendly, Value/Capability focused (not just implementation details). Use sentence fragments, not full sentences.
      - Information Density: Max 1 core conclusion per slide, 3-5 content points maximum per slide.
    `);

    // Build purpose-specific layout guidance
    const layoutGuidance = purposeGuide ? (promptLang === 'zh' ? `
      ## 📐 目的导向布局指导
      
      当前演示目的："${purpose}"
      
      **推荐布局优先级：**
      ${purposeGuide.layouts.map((l, i) => `${i + 1}. ${l}`).join('\n      ')}
      
      **内容重心：**
      ${purposeGuide.contentFocus}
    ` : `
      ## 📐 PURPOSE-SPECIFIC LAYOUT GUIDANCE
      
      This is a "${purpose}" presentation.
      
      **Recommended Layout Priority:**
      ${purposeGuide.layouts.map((l, i) => `${i + 1}. ${l}`).join('\n      ')}
      
      **Content Focus:**
      ${purposeGuide.contentFocus}
    `) : (promptLang === 'zh' ? `
      ## 📐 布局策略
      
      请根据内容类型选择布局：
      - 'Cover'：仅用于第 1 页。
      - 'Ending'：仅用于最后一页。
      - 'Compare'：适合优劣势、前后对比、双栏对照。
      - 'Grid'：适合并列条目、功能点、3-4 支柱。
      - 'Timeline'：适合路线图、历史、步骤、演进过程。
      - 'Data'：适合指标、统计、图表概念主导的页面。
      - 'Center'：适合单条强结论/关键陈述。
      - 'Standard'：常规标题+要点（默认）。
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
    `);

    const prompt = promptLang === 'zh' ? `
      角色定义：
      你是演示大纲协同助手。你擅长：
      - 理解杂乱、非结构化输入；
      - 判断受众并匹配表达风格；
      - 以“结论先行”的方式重组内容；
      - 输出专业、克制、可执行的演示大纲；
      - 给出适合页面表达的布局策略。

      目标：
      将用户输入转换为结构化 PPT 大纲，适配目标受众与叙事逻辑。

      ${strictModeInstruction}

      输入上下文：
      - 用户输入：${content.substring(0, 30000)}
      - Topic：${topic}
      - 目标受众：${audience}
      - 演示目的：${purpose}
      - 目标页数：${expectedSlideCount}（必须严格一致）

      ${styleGuidance}

      ${layoutGuidance}

      ${designSystemGuidance}

      **语言规则：** 输出语言必须与“用户输入”一致。

      ${structureRequirements}

      输出格式：
      - 仅返回一个 JSON 对象，唯一键为 "slides"。
      - slides 数组长度必须等于 ${expectedSlideCount}。
      - layoutSuggestion 必须是以下之一：${ALLOWED_LAYOUTS.join(', ')}。
      - JSON 结构：
        {
          "slides": [
            {
              "title": "页面标题",
              "contentPoints": ["要点1", "要点2"],
              "layoutSuggestion": "Standard"
            }
          ]
        }
    ` : `
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

      ${designSystemGuidance}

      **Language:** The output language MUST match the language of the 'User Input'.

      ${structureRequirements}

      Output Format:
      - Return ONLY a JSON object with one key: "slides".
      - slides array length MUST equal ${expectedSlideCount}.
      - layoutSuggestion MUST be exactly one of: ${ALLOWED_LAYOUTS.join(', ')}.
      - JSON Structure:
        {
          "slides": [
            {
              "title": "Slide Title",
              "contentPoints": ["Point 1", "Point 2"],
              "layoutSuggestion": "Standard"
            }
          ]
        }
    `;

    // Use model settings
    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true, signal, undefined, 'outline');
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
  apiSettings: ApiSettings,
  lang?: Language
): Promise<ServiceResponse<string[]>> => {
  try {
    const promptLang: PromptLang = lang || resolvePromptLang(topic, audience, JSON.stringify(slides.map((s) => `${s.title} ${s.contentPoints.join(' ')}`)));
    const prompt = promptLang === 'zh' ? `
      你是资深演示教练。
      请为下列幻灯片撰写有感染力的讲稿备注（Speaker Notes）。

      上下文：
      - 主题：${topic}
      - 受众：${audience}
      - 语气：专业但口语化

      备注要求：
      - 每页 2-4 句话
      - 包含：(1) 本页要强调的核心信息；(2) 与上一页的过渡（第 1 页除外）；(3) 一条表达建议
      - 使用第一人称（“我/我们”）表达，像演讲者在讲述
      - 不要逐条复述 bullet points，应补充背景、洞察与故事化表达
      - 输出语言与页面内容一致

      幻灯片内容：
      ${JSON.stringify(slides.map((s, i) => ({ index: i, title: s.title, points: s.contentPoints })))}

      输出：
      - 仅返回 JSON 对象，格式：{ "notes": ["...", "..."] }
      - "notes" 数量必须与幻灯片页数完全一致
      - 保证页与页之间过渡自然
      - 每个 notes 字符串按索引对应到页面
    ` : `
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
      - Return ONLY a JSON object in this shape: { "notes": ["...", "..."] }
      - "notes" length MUST match the number of slides exactly
      - Ensure smooth transitions between slides
      - Each notes string corresponds to its slide index
    `;

    // Use model settings for speaker notes generation
    const { text, cost } = await callLLM(prompt, apiSettings.model, apiSettings.apiKeys, true, undefined, undefined, 'notes');
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
  onProgress?: (partialText: string) => void,
  lang?: Language
): Promise<ServiceResponse<string>> => {
  try {
    // Get style guidance - use user-selected preset if provided, otherwise use audience default
    const profile = stylePresetId ? getStylePreset(stylePresetId) : findAudienceProfile(audience);
    const designSystemGuidance = getDeckDesignSystemPrompt(audience, deckTitle, stylePresetId);
    const archetypeGuidance = getLayoutArchetypeGuideline(slide.layoutSuggestion || 'Standard');
    const promptLang: PromptLang = lang || resolvePromptLang(
      slide.title,
      slide.contentPoints.join(' '),
      slide.layoutSuggestion,
      audience,
      deckTitle,
      customInstruction
    );
    
    // Build style-specific guidance for the renderer
    const styleGuidance = profile ? (promptLang === 'zh' ? `
      ## 🎨 受众风格渲染指导
      
      目标受众：**${audience}**
      
      **排版要求：**
      ${profile.typography.fontCharacteristics}
      - 字体建议：优先 \`${profile.typography.fontFamily.split(',')[0].trim()}\`，并提供回退字体
      - 标题大小写规则：${profile.typography.titleCase}
      
      **视觉密度：** ${profile.visualDensity}
      - ${profile.visualDensity === 'minimal' ? '留白更大，元素间距建议 64px+' : ''}
      - ${profile.visualDensity === 'dense' ? '信息密度高，间距可收紧到 24-32px' : ''}
      - ${profile.visualDensity === 'balanced' ? '保持 32-48px 的平衡间距' : ''}
      
      **数据可视化强度：** ${profile.dataVisualization}
      - ${profile.dataVisualization === 'heavy' ? '优先采用指标卡、进度条、图形化结构等数据表达' : ''}
      - ${profile.dataVisualization === 'minimal' ? '以叙事和概念表达为主，减少数据图形占比' : ''}
      
      **内容强调方向：** ${profile.contentStyle.emphasis.join('、')}
    ` : `
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
    `) : '';

    const commonStyleSettings = promptLang === 'zh' ? `
      ## 🧩 通用样式基线（建议复用）
      以如下样式 token 作为默认基线，保证输出稳定、紧凑：
      - sectionBase: \`background-color: var(--c-bg); color: var(--c-text); width: 1920px; height: 1080px; position: relative; overflow: hidden; print-color-adjust: exact;\`
      - headerBase: \`position: absolute; top: 0; left: 0; width: 100%; padding: 48px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;\`
      - headerBadge: \`display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: var(--c-bg-soft); color: var(--c-primary); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px; text-transform: uppercase; opacity: 0.8;\`
      - headerTitle: \`font-size: 56px; font-weight: 800; line-height: 1.1; color: var(--c-text);\`
      - mainBase: \`position: absolute; top: 200px; left: 0; width: 100%; height: 780px; padding: 0 48px; z-index: 0;\`
      - footerBase: \`position: absolute; bottom: 0; left: 48px; right: 48px; padding: 32px 0; display: flex; align-items: flex-end; color: var(--c-text-muted); z-index: 10; border-top: 1px solid var(--c-border);\`
      - footerMeta: \`font-size: 14px; opacity: 0.5;\`
      Cover/Ending 或特殊布局可偏离，但需保持同一视觉系统与间距尺度。
    ` : `
      ## 🧩 COMMON STYLE SETTINGS (REUSE THESE DEFAULTS)
      Use these as the baseline style tokens so your output stays concise and consistent:
      - sectionBase: \`background-color: var(--c-bg); color: var(--c-text); width: 1920px; height: 1080px; position: relative; overflow: hidden; print-color-adjust: exact;\`
      - headerBase: \`position: absolute; top: 0; left: 0; width: 100%; padding: 48px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;\`
      - headerBadge: \`display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: var(--c-bg-soft); color: var(--c-primary); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px; text-transform: uppercase; opacity: 0.8;\`
      - headerTitle: \`font-size: 56px; font-weight: 800; line-height: 1.1; color: var(--c-text);\`
      - mainBase: \`position: absolute; top: 200px; left: 0; width: 100%; height: 780px; padding: 0 48px; z-index: 0;\`
      - footerBase: \`position: absolute; bottom: 0; left: 48px; right: 48px; padding: 32px 0; display: flex; align-items: flex-end; color: var(--c-text-muted); z-index: 10; border-top: 1px solid var(--c-border);\`
      - footerMeta: \`font-size: 14px; opacity: 0.5;\`
      You may deviate for Cover/Ending or layout-specific needs, but keep the same visual system and spacing scale.
    `;

    const prompt = promptLang === 'zh' ? `
      角色：企业级 HTML 演示渲染器。
      目标：根据输入内容，输出单页现代化、可打印的 HTML 幻灯片片段（Tailwind CSS）。

      ## 🔴 强约束（不可违反）
      1. **容器**：必须为 \`<section class="slide" style="background-color: var(--c-bg); color: var(--c-text); width: 1920px; height: 1080px; position: relative; overflow: hidden; print-color-adjust: exact;">...</section>\`。
      2. **尺寸**：固定 1920x1080。
      3. **单位**：布局与字号仅使用 px，禁止 rem/vh/vw。
      4. **滚动**：必须 \`overflow: hidden\`，内容必须在单页内放下。
      5. **图片**：禁止外链位图（jpg/png），仅可使用内联 SVG。
      6. **背景**：所有页面必须是纯色背景（\`var(--c-bg)\`），绝对禁止渐变背景。
      7. **打印**：必须使用 \`print-color-adjust: exact\`。
      8. **排版层级**：标题 48-72px，正文 24-32px，注释 18-20px。
      9. **对比度**：保证文字可读性（至少 AA 水平）。
      10. **间距**：遵循 8px 体系：48/32/24/16/8。
      11. **CSS 变量**：不得输出 <style> 块；使用 inline style + 变量。
          变量：--c-bg, --c-bg-soft, --c-bg-glass, --c-bg-invert,
          --c-text, --c-text-muted, --c-text-faint, --c-text-invert,
          --c-border, --c-border-strong, --c-divider,
          --c-primary, --c-secondary, --c-accent,
          --c-success, --c-warning, --c-danger, --c-info。
      
      ${styleGuidance}
      ${commonStyleSettings}
      ${designSystemGuidance}
      ${archetypeGuidance ? `\n      ## 📏 当前页面原型约束\n      ${archetypeGuidance}\n` : ''}

      ## 📐 DOM 结构（默认建议）
      可按语义骨架生成，并应用上述通用样式：
      - Header（Cover/Ending 可省略）
      - Main（布局主体）
      - Footer（Cover/Ending 可省略）

      ## 📊 布局逻辑（依据 Layout Hint）
      1. Cover：中心聚焦，大字号标题（72-96px），无页眉页脚。
      2. Ending：中心聚焦，必须包含结束语（如 Thank You）与大号品牌 Logo 占位，无页眉页脚。
      3. Compare：左右对比。
      4. Grid：2x2 / 3x2 卡片。
      5. Timeline：横向流程。
      6. Data：大数字/指标卡/图形化数据。
      7. Center：单句强信息。
      8. Quote：大引号+引用+署名。
      9. Image-Heavy：占位图框+说明。
      10. Standard：标题+要点+辅助视觉（默认）。

      ## 🎨 样式覆盖规则
      若 Layout Hint 或 User Override 包含“衬线、全大写、居中、左对齐、粗体、现代”等指令，必须体现。
      - 颜色尽量用 inline style + CSS 变量。
      - Tailwind 主要用于布局（flex/grid/absolute/relative）。
      - 字号建议内联 px，保证 1080p 打印一致性。
      - 避免所有页面视觉铬层完全一致，应体现风格差异（语气、密度、排版）。

      ## 🧿 图标规范
      - 使用高质量内联 SVG（Lucide/Feather 风格）。
      - 线宽 1.5 或 2。
      - 颜色优先 \`var(--c-accent)\` 或 \`var(--c-text)\`。
      - 尺寸按场景使用 24/32/48px。

      ## 输入数据
      - 标题：${slide.title}
      - 内容：${JSON.stringify(slide.contentPoints)}
      - 布局提示：${slide.layoutSuggestion}
      ${customInstruction ? `- 用户补充指令：${customInstruction}` : ''}

      ## 输出要求
      - 仅返回 \`<section>\` 对应的有效 HTML 代码。
      - 禁止 markdown 代码块包装。
    ` : `
      Role: Enterprise HTML Presentation Deck Renderer.
      Goal: Create a SINGLE, modern, print-ready HTML slide fragment using Tailwind CSS based on the provided content.

      ## 🔴 HARD RULES (NON-NEGOTIABLE)
      1. **Container**: strictly \`<section class="slide" style="background-color: var(--c-bg); color: var(--c-text); width: 1920px; height: 1080px; position: relative; overflow: hidden; print-color-adjust: exact;">...</section>\`.
      2. **Dimensions**: Strictly width: 1920px; height: 1080px.
      3. **Units**: Use ABSOLUTE UNITS (px) only for layout/typography sizing. NO rem, vh, vw.
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
      ${commonStyleSettings}
      ${designSystemGuidance}
      ${archetypeGuidance ? `\n      ## 📏 THIS SLIDE ARCHETYPE CONSTRAINT\n      ${archetypeGuidance}\n` : ''}

      ## 📐 DOM STRUCTURE (DEFAULT, CONCISE)
      Use this semantic skeleton and apply the common style settings above.

      \`\`\`html
      <!-- Header (except Cover/Ending) -->
      <header style="/* headerBase */">
         <div>
           <span style="/* headerBadge */">GenDeck AI</span>
           <h2 style="/* headerTitle */">${slide.title}</h2>
         </div>
      </header>

      <!-- Main -->
      <main style="/* mainBase */">
         <!-- layout-specific content -->
      </main>

      <!-- Footer (except Cover/Ending) -->
      <footer style="/* footerBase */">
         <div style="flex:1; text-align:left; /* footerMeta */">GenDeck</div>
         <div style="flex:1; text-align:center; font-size:14px; font-weight:600; opacity:0.8; letter-spacing:0.05em; text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 16px;">${deckTitle}</div>
         <div style="flex:1; text-align:right; font-size:14px; font-family:monospace; opacity:0.5;">${pageNumber} / ${totalPages}</div>
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
      - Use Tailwind utilities mainly for layout: \`flex\`, \`grid\`, \`absolute\`, \`relative\`, etc.
      - Prefer inline px typography styles for title/body sizing to ensure 1080p print consistency.
      - Do NOT render every slide with the same visual chrome; express the chosen style profile (tone, density, typography).

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
