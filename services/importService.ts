
import { SlideData, PresentationConfig } from '../types';

export interface ImportResult {
  slides: SlideData[];
  config: Partial<PresentationConfig>;
  colorPalette: string;
  topic: string;
}

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

  // Try to find CSS variables
  const bgMatch = cssText.match(/--c-bg:\s*([^;]+)/);
  const surfaceMatch = cssText.match(/--c-surface:\s*([^;]+)/);
  const accentMatch = cssText.match(/--c-accent:\s*([^;]+)/);
  const textMatch = cssText.match(/--c-text:\s*([^;]+)/);

  if (bgMatch && surfaceMatch && accentMatch && textMatch) {
    return `${bgMatch[1].trim()},${surfaceMatch[1].trim()},${accentMatch[1].trim()},${textMatch[1].trim()}`;
  }

  // Fallback: try to find in :root or theme-light
  const rootMatch = cssText.match(/:root\s*\{[^}]*--c-bg:\s*([^;]+)[^}]*--c-surface:\s*([^;]+)[^}]*--c-accent:\s*([^;]+)[^}]*--c-text:\s*([^;\}]+)/);
  if (rootMatch) {
    return `${rootMatch[1].trim()},${rootMatch[2].trim()},${rootMatch[3].trim()},${rootMatch[4].trim()}`;
  }

  // Default fallback
  return '#111111,#222222,#4f46e5,#ffffff';
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
