/**
 * Parses and formats article content with proper subtitle formatting and HTML entity decoding
 */

/**
 * Decodes HTML entities in text
 */
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Formats content sections with proper HTML structure
 * - Converts ===Section=== to <h2>Section</h2>
 * - Decodes HTML entities like &#x2009;
 * - Preserves paragraph structure
 */
export function parseArticleContent(content: string): string {
  if (!content) return '';
  
  // First, decode all HTML entities
  let parsedContent = decodeHTMLEntities(content);
  
  // Split content into lines
  const lines = parsedContent.split('\n');
  const formattedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for subtitle markers: ===Section===
    const subtitleMatch = trimmedLine.match(/^===(.+?)===$/);
    if (subtitleMatch) {
      const sectionTitle = subtitleMatch[1].trim();
      formattedLines.push(`<h2 class="text-2xl font-bold mt-8 mb-4">${sectionTitle}</h2>`);
      continue;
    }
    
    // Check for subsection markers: ==Subsection==
    const subsectionMatch = trimmedLine.match(/^==(.+?)==$/);
    if (subsectionMatch) {
      const subsectionTitle = subsectionMatch[1].trim();
      formattedLines.push(`<h3 class="text-xl font-semibold mt-6 mb-3">${subsectionTitle}</h3>`);
      continue;
    }
    
    // Regular paragraph or empty line
    if (trimmedLine) {
      formattedLines.push(`<p class="mb-4">${trimmedLine}</p>`);
    } else {
      formattedLines.push('');
    }
  }
  
  return formattedLines.join('\n');
}

/**
 * Formats content for rendering with annotations
 * Returns structured content with proper HTML formatting
 */
export function formatContentWithAnnotations(content: string): Array<{
  type: 'heading' | 'subheading' | 'paragraph';
  text: string;
  html: string;
}> {
  if (!content) return [];
  
  // First, decode all HTML entities
  let parsedContent = decodeHTMLEntities(content);
  
  // Split content into lines
  const lines = parsedContent.split('\n');
  const formattedContent: Array<{
    type: 'heading' | 'subheading' | 'paragraph';
    text: string;
    html: string;
  }> = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check for subtitle markers: ===Section===
    const subtitleMatch = trimmedLine.match(/^===(.+?)===$/);
    if (subtitleMatch) {
      const sectionTitle = subtitleMatch[1].trim();
      formattedContent.push({
        type: 'heading',
        text: sectionTitle,
        html: `<h2 class="text-2xl font-bold mt-8 mb-4">${sectionTitle}</h2>`
      });
      continue;
    }
    
    // Check for subsection markers: ==Subsection==
    const subsectionMatch = trimmedLine.match(/^==(.+?)==$/);
    if (subsectionMatch) {
      const subsectionTitle = subsectionMatch[1].trim();
      formattedContent.push({
        type: 'subheading',
        text: subsectionTitle,
        html: `<h3 class="text-xl font-semibold mt-6 mb-3">${subsectionTitle}</h3>`
      });
      continue;
    }
    
    // Regular paragraph
    formattedContent.push({
      type: 'paragraph',
      text: trimmedLine,
      html: `<p class="mb-4">${trimmedLine}</p>`
    });
  }
  
  return formattedContent;
}
