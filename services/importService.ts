
import { SlideData, PresentationConfig } from '../types';

export interface ImportResult {
  slides: SlideData[];
  config: Partial<PresentationConfig>;
  colorPalette: string;
  topic: string;
}

export interface MarkdownOutlineImportResult {
  topic: string;
  audience?: string;
  purpose?: string;
  tone?: string;
  slides: Array<{
    title: string;
    contentPoints: string[];
    notes: string;
    layoutSuggestion: string;
  }>;
}

const cleanInlineMarkdown = (value: string): string => {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
};

const inferLayoutFromLabel = (value: string): string => {
  const v = value.toLowerCase();
  if (v.includes('cover')) return 'Cover';
  if (v.includes('ending') || v.includes('thank') || v.includes('q&a') || v.includes('qa') || v.includes('contact')) return 'Ending';
  if (v.includes('compare')) return 'Compare';
  if (v.includes('grid')) return 'Grid';
  if (v.includes('timeline') || v.includes('phase') || v.includes('roadmap')) return 'Timeline';
  if (v.includes('data') || v.includes('metric') || v.includes('economics')) return 'Data';
  if (v.includes('quote') || v.includes('voice')) return 'Quote';
  return 'Standard';
};

const parseSlideSection = (headerSuffix: string, sectionLines: string[]) => {
  let explicitTitle = '';
  const contentPoints: string[] = [];
  const notes: string[] = [];
  const tableLinesBuffer: string[] = [];

  const flushTableBuffer = () => {
    if (tableLinesBuffer.length < 2) {
      tableLinesBuffer.length = 0;
      return;
    }

    const splitRow = (row: string) => row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cleanInlineMarkdown(cell.trim()));

    const isSeparatorRow = (cells: string[]) => cells.every((cell) => /^:?-{3,}:?$/.test(cell));

    const rows = tableLinesBuffer.map(splitRow).filter((cells) => cells.length > 0);
    if (rows.length < 2) {
      tableLinesBuffer.length = 0;
      return;
    }

    const headers = rows[0];
    const dataRows = isSeparatorRow(rows[1]) ? rows.slice(2) : rows.slice(1);

    dataRows.forEach((row) => {
      if (row.every((cell) => !cell)) return;
      const point = row
        .map((cell, idx) => {
          const header = headers[idx] || `Col ${idx + 1}`;
          return `${header}: ${cell || '-'}`;
        })
        .join(' | ');
      if (point.trim()) {
        contentPoints.push(point);
      }
    });

    tableLinesBuffer.length = 0;
  };

  for (const rawLine of sectionLines) {
    const line = rawLine.trim();
    if (!line) {
      flushTableBuffer();
      continue;
    }
    if (line === '---') continue;
    if (/^```/.test(line)) continue;

    if (/^\|.*\|$/.test(line)) {
      tableLinesBuffer.push(line);
      continue;
    }
    flushTableBuffer();

    const boldTitle = line.match(/^\*\*(.+?)\*\*$/);
    if (boldTitle && !explicitTitle) {
      explicitTitle = cleanInlineMarkdown(boldTitle[1]);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      contentPoints.push(cleanInlineMarkdown(bullet[1]));
      continue;
    }

    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      notes.push(cleanInlineMarkdown(quote[1]));
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) continue;
    if (/^[A-Za-z\u4e00-\u9fff][^:：]{0,25}[:：]$/.test(line)) continue;

    if (contentPoints.length < 6) {
      contentPoints.push(cleanInlineMarkdown(line));
    }
  }
  flushTableBuffer();

  const cleanedHeader = cleanInlineMarkdown(headerSuffix).replace(/\s*\(.*?\)\s*$/, '').trim();
  const title = explicitTitle || cleanedHeader || 'Untitled Slide';
  const layoutSuggestion = inferLayoutFromLabel(`${cleanedHeader} ${title}`);

  return {
    title,
    contentPoints,
    notes: notes.join('\n'),
    layoutSuggestion,
  };
};

/**
 * Parse markdown outline where slides are defined as `## Slide N — ...`
 */
export const parseMarkdownOutline = (markdown: string): MarkdownOutlineImportResult => {
  const raw = String(markdown || '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');

  const slideHeaderRegex = /^##\s*slide\s*\d+\s*(?:[-—–:]\s*(.+))?$/i;
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const topic = cleanInlineMarkdown(titleMatch?.[1] || '').trim() || 'Imported Markdown Outline';

  const audience = cleanInlineMarkdown(raw.match(/^\>\s*\*\*Audience:\*\*\s*(.+)$/im)?.[1] || '');
  const purpose = cleanInlineMarkdown(raw.match(/^\>\s*\*\*Goal:\*\*\s*(.+)$/im)?.[1] || '');
  const tone = cleanInlineMarkdown(raw.match(/^\>\s*\*\*Tone:\*\*\s*(.+)$/im)?.[1] || '');

  const sections: Array<{ headerSuffix: string; lines: string[] }> = [];
  let current: { headerSuffix: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headerMatch = line.match(slideHeaderRegex);
    if (headerMatch) {
      if (current) {
        sections.push(current);
      }
      current = {
        headerSuffix: headerMatch[1] || '',
        lines: [],
      };
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    sections.push(current);
  }

  const slides = sections
    .map((section) => parseSlideSection(section.headerSuffix, section.lines))
    .filter((slide) => slide.title || slide.contentPoints.length > 0);

  if (slides.length === 0) {
    throw new Error('No slide sections found. Use headings like: ## Slide 1 — Cover');
  }

  return {
    topic,
    audience: audience || undefined,
    purpose: purpose || undefined,
    tone: tone || undefined,
    slides,
  };
};

/**
 * Parse an exported HTML deck file and extract slide data
 */
export const parseExportedHtml = (htmlContent: string): ImportResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extract topic from title
  const topic = doc.querySelector('title')?.textContent || 'Imported Deck';

  // Extract color palette from CSS variables in style tags
  const colorPalette = extractColorPalette(doc);

  // Extract slides
  const slideElements = doc.querySelectorAll('.slide');
  const slides: SlideData[] = [];

  slideElements.forEach((el, index) => {
    const htmlContent = el.outerHTML;
    
    // Try to extract title from various sources
    let title = '';
    const h2 = el.querySelector('h2');
    const h1 = el.querySelector('h1');
    const slideTitle = el.getAttribute('data-title');
    
    if (slideTitle) {
      title = slideTitle;
    } else if (h2) {
      title = h2.textContent?.trim() || '';
    } else if (h1) {
      title = h1.textContent?.trim() || '';
    } else {
      // Fallback: try to find any heading
      const anyHeading = el.querySelector('[class*="text-5xl"], [class*="text-4xl"], [class*="text-6xl"]');
      title = anyHeading?.textContent?.trim() || `Slide ${index + 1}`;
    }

    // Try to extract content points from list items or paragraphs
    const contentPoints: string[] = [];
    const listItems = el.querySelectorAll('li');
    const paragraphs = el.querySelectorAll('p');
    
    if (listItems.length > 0) {
      listItems.forEach(li => {
        const text = li.textContent?.trim();
        if (text && text.length > 0 && text !== title) {
          contentPoints.push(text);
        }
      });
    }
    
    // If no list items, use paragraphs
    if (contentPoints.length === 0) {
      paragraphs.forEach(p => {
        const text = p.textContent?.trim();
        if (text && text.length > 0 && text !== title && !text.includes('/')) {
          contentPoints.push(text);
        }
      });
    }

    // Infer layout suggestion from HTML structure
    const layoutSuggestion = inferLayout(el);

    slides.push({
      id: `slide-${index}-${Date.now()}`,
      title,
      contentPoints: contentPoints.slice(0, 5), // Limit to 5 points
      htmlContent,
      notes: '',
      layoutSuggestion,
      isRegenerating: false,
    });
  });

  return {
    slides,
    config: {
      topic,
      audience: '',
      purpose: '',
      slideCount: slides.length,
      documentContent: '',
    },
    colorPalette,
    topic,
  };
};

/**
 * Extract color palette from the document's CSS
 */
const extractColorPalette = (doc: Document): string => {
  const styles = doc.querySelectorAll('style');
  let cssText = '';
  
  styles.forEach(style => {
    cssText += style.textContent || '';
  });

  // Try to find CSS variables (18-color system)
  const bgMatch = cssText.match(/--c-bg:\s*([^;]+)/);
  const bgSoftMatch = cssText.match(/--c-bg-soft:\s*([^;]+)/);
  const bgGlassMatch = cssText.match(/--c-bg-glass:\s*([^;]+)/);
  const bgInvertMatch = cssText.match(/--c-bg-invert:\s*([^;]+)/);
  const textMatch = cssText.match(/--c-text:\s*([^;]+)/);
  const textMutedMatch = cssText.match(/--c-text-muted:\s*([^;]+)/);
  const textFaintMatch = cssText.match(/--c-text-faint:\s*([^;]+)/);
  const textInvertMatch = cssText.match(/--c-text-invert:\s*([^;]+)/);
  const borderMatch = cssText.match(/--c-border:\s*([^;]+)/);
  const borderStrongMatch = cssText.match(/--c-border-strong:\s*([^;]+)/);
  const dividerMatch = cssText.match(/--c-divider:\s*([^;]+)/);
  const primaryMatch = cssText.match(/--c-primary:\s*([^;]+)/);
  const secondaryMatch = cssText.match(/--c-secondary:\s*([^;]+)/);
  const accentMatch = cssText.match(/--c-accent:\s*([^;]+)/);
  const successMatch = cssText.match(/--c-success:\s*([^;]+)/);
  const warningMatch = cssText.match(/--c-warning:\s*([^;]+)/);
  const dangerMatch = cssText.match(/--c-danger:\s*([^;]+)/);
  const infoMatch = cssText.match(/--c-info:\s*([^;]+)/);

  if (bgMatch && textMatch && primaryMatch) {
    return `${bgMatch[1].trim()},${bgSoftMatch?.[1].trim() || bgMatch[1].trim()},${bgGlassMatch?.[1].trim() || bgMatch[1].trim() + '80'},${bgInvertMatch?.[1].trim() || textMatch[1].trim()},${textMatch[1].trim()},${textMutedMatch?.[1].trim() || textMatch[1].trim()},${textFaintMatch?.[1].trim() || textMatch[1].trim()},${textInvertMatch?.[1].trim() || bgMatch[1].trim()},${borderMatch?.[1].trim() || '#404040'},${borderStrongMatch?.[1].trim() || '#525252'},${dividerMatch?.[1].trim() || '#40404040'},${primaryMatch[1].trim()},${secondaryMatch?.[1].trim() || primaryMatch[1].trim()},${accentMatch?.[1].trim() || primaryMatch[1].trim()},${successMatch?.[1].trim() || '#22c55e'},${warningMatch?.[1].trim() || '#f59e0b'},${dangerMatch?.[1].trim() || '#ef4444'},${infoMatch?.[1].trim() || '#06b6d4'}`;
  }

  // Default fallback (executive dark theme)
  return '#0a0a0a,#141414,#0a0a0a80,#ffffff,#ffffff,#a1a1aa,#6b7280,#0a0a0a,#404040,#525252,#40404040,#3b82f6,#8b5cf6,#3b82f6,#22c55e,#f59e0b,#ef4444,#06b6d4';
};

/**
 * Infer layout type from slide HTML structure
 */
const inferLayout = (el: Element): string => {
  const html = el.outerHTML.toLowerCase();
  
  // Check for cover layout (usually has very large title, no header/footer)
  if (html.includes('text-7xl') || html.includes('text-8xl') || html.includes('text-9xl')) {
    return 'Cover';
  }
  
  // Check for ending/thank you slide
  if (html.includes('thank you') || html.includes('谢谢') || html.includes('ending')) {
    return 'Ending';
  }
  
  // Check for grid layout (multiple cards)
  const cards = el.querySelectorAll('[class*="rounded"], [class*="card"]');
  if (cards.length >= 4) {
    return 'Grid';
  }
  
  // Check for compare/split layout
  const flexItems = el.querySelectorAll('[class*="flex-1"], [class*="w-1/2"]');
  if (flexItems.length >= 2) {
    return 'Compare';
  }
  
  // Check for timeline
  if (html.includes('timeline') || html.includes('step') || html.includes('roadmap')) {
    return 'Timeline';
  }
  
  // Check for data/metrics
  const bigNumbers = el.querySelectorAll('[class*="text-6xl"], [class*="text-7xl"]');
  if (bigNumbers.length > 0) {
    return 'Data';
  }
  
  // Check for quote
  if (html.includes('blockquote') || html.includes('quote') || html.includes('"')) {
    return 'Quote';
  }
  
  // Check for centered content
  const centered = el.querySelectorAll('[class*="text-center"], [class*="items-center"]');
  if (centered.length > 2 && !html.includes('header')) {
    return 'Center';
  }
  
  return 'Standard';
};
