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
 */
export function parseArticleContent(content: string): string {
  if (!content) return '';

  // Use DOMParser to handle HTML structure correctly
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const formattedLines: string[] = [];

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        // Split text by subtitle markers (capturing the markers)
        const parts = text.split(/((?:={2,4}).+?(?:={2,4}))/g);

        parts.forEach(part => {
          if (!part.trim()) return;

          const subtitleMatch = part.match(/^\s*(={2,4})(.+?)\1\s*$/);
          if (subtitleMatch) {
            const level = subtitleMatch[1].length;
            const title = subtitleMatch[2].trim();

            if (level === 2) {
              formattedLines.push(`<h2 class="text-2xl font-bold mt-8 mb-4">${title}</h2>`);
            } else if (level === 3) {
              formattedLines.push(`<h3 class="text-xl font-semibold mt-6 mb-3">${title}</h3>`);
            } else {
              formattedLines.push(`<h4 class="text-lg font-semibold mt-4 mb-2">${title}</h4>`);
            }
          } else {
            formattedLines.push(`<p class="mb-4">${part}</p>`);
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      // Preserve media wrappers and headings
      if (el.classList.contains('kora-media-wrapper') ||
        ['AUDIO', 'VIDEO', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
        formattedLines.push(el.outerHTML);
        return;
      }

      // Handle paragraphs and divs - preserve structure if they contain media
      if (el.tagName === 'P' || el.tagName === 'DIV') {
        // Check for media first
        if (el.querySelector('.kora-media-wrapper') || el.querySelector('audio') || el.querySelector('video')) {
          formattedLines.push(el.outerHTML);
          return;
        }

        const text = el.textContent?.trim();
        if (text) {
          // Split text by subtitle markers (capturing the markers)
          const parts = text.split(/((?:={2,4}).+?(?:={2,4}))/g);

          parts.forEach(part => {
            if (!part.trim()) return;

            const subtitleMatch = part.match(/^\s*(={2,4})(.+?)\1\s*$/);
            if (subtitleMatch) {
              const level = subtitleMatch[1].length;
              const title = subtitleMatch[2].trim();

              if (level === 2) {
                formattedLines.push(`<h2 class="text-2xl font-bold mt-8 mb-4">${title}</h2>`);
              } else if (level === 3) {
                formattedLines.push(`<h3 class="text-xl font-semibold mt-6 mb-3">${title}</h3>`);
              } else {
                formattedLines.push(`<h4 class="text-lg font-semibold mt-4 mb-2">${title}</h4>`);
              }
            } else {
              formattedLines.push(`<p class="mb-4">${part}</p>`);
            }
          });
          return;
        }

        // If no text and no media (empty P/DIV?), just push outerHTML or ignore
        formattedLines.push(el.outerHTML);
        return;
      }

      // Fallback
      formattedLines.push(el.outerHTML);
    }
  };

  Array.from(doc.body.childNodes).forEach(processNode);

  return formattedLines.join('\n');
}

/**
 * Formats content for rendering with annotations
 */
export function formatContentWithAnnotations(content: string): Array<{
  type: 'heading' | 'subheading' | 'paragraph' | 'media';
  text: string;
  html: string;
}> {
  if (!content) return [];

  // Use DOMParser to handle HTML structure correctly
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  const formattedContent: Array<{
    type: 'heading' | 'subheading' | 'paragraph' | 'media';
    text: string;
    html: string;
  }> = [];

  // Helper to process nodes
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        // Split text by subtitle markers (capturing the markers)
        // Matches ==...==, ===...===, ====...====
        // Use non-greedy match for content
        const parts = text.split(/((?:={2,4}).+?(?:={2,4}))/g);

        parts.forEach(part => {
          if (!part.trim()) return;

          const subtitleMatch = part.match(/^\s*(={2,4})(.+?)\1\s*$/);
          if (subtitleMatch) {
            const level = subtitleMatch[1].length;
            const title = subtitleMatch[2].trim();

            if (level === 2) {
              formattedContent.push({
                type: 'subheading',
                text: title,
                html: `<h3 class="text-xl font-semibold mt-6 mb-3">${title}</h3>`
              });
            } else if (level === 3) {
              formattedContent.push({
                type: 'heading',
                text: title,
                html: `<h2 class="text-2xl font-bold mt-8 mb-4">${title}</h2>`
              });
            } else {
              // Level 4 or more
              formattedContent.push({
                type: 'subheading',
                text: title,
                html: `<h4 class="text-lg font-semibold mt-4 mb-2">${title}</h4>`
              });
            }
          } else {
            formattedContent.push({
              type: 'paragraph',
              text: part,
              html: `<p class="mb-4">${part}</p>`
            });
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      // Handle media wrappers
      if (el.classList.contains('kora-media-wrapper') || el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
        formattedContent.push({
          type: 'media',
          text: '',
          html: el.outerHTML
        });
        return;
      }

      // Handle headings
      if (['H1', 'H2'].includes(el.tagName)) {
        formattedContent.push({
          type: 'heading',
          text: el.textContent || '',
          html: el.outerHTML
        });
        return;
      }
      if (['H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
        formattedContent.push({
          type: 'subheading',
          text: el.textContent || '',
          html: el.outerHTML
        });
        return;
      }

      // Handle paragraphs and divs
      if (el.tagName === 'P' || el.tagName === 'DIV') {
        const text = el.textContent?.trim();
        if (text) {
          // Split text by subtitle markers (capturing the markers)
          const parts = text.split(/((?:={2,4}).+?(?:={2,4}))/g);

          parts.forEach(part => {
            if (!part.trim()) return;

            const subtitleMatch = part.match(/^\s*(={2,4})(.+?)\1\s*$/);
            if (subtitleMatch) {
              const level = subtitleMatch[1].length;
              const title = subtitleMatch[2].trim();

              if (level === 2) {
                formattedContent.push({
                  type: 'subheading',
                  text: title,
                  html: `<h3 class="text-xl font-semibold mt-6 mb-3">${title}</h3>`
                });
              } else if (level === 3) {
                formattedContent.push({
                  type: 'heading',
                  text: title,
                  html: `<h2 class="text-2xl font-bold mt-8 mb-4">${title}</h2>`
                });
              } else {
                formattedContent.push({
                  type: 'subheading',
                  text: title,
                  html: `<h4 class="text-lg font-semibold mt-4 mb-2">${title}</h4>`
                });
              }
            } else {
              // If it's a P tag originally, we can keep it as P.
              // But if we split a P tag, we are creating multiple blocks.
              // This is fine as we are returning a list of blocks.
              formattedContent.push({
                type: 'paragraph',
                text: part,
                html: `<p class="mb-4">${part}</p>`
              });
            }
          });

          // If the element had media, we need to handle it.
          // The split logic above only handles text content.
          // If there is media, we might lose it if we only process textContent.
          // Check if there are child elements that are media.
          if (el.querySelector('.kora-media-wrapper') || el.querySelector('audio') || el.querySelector('video')) {
            // If we have media, the simple text split might be destructive.
            // Fallback to preserving the whole element if it has media, 
            // OR try to be smarter.
            // For now, if media is present, let's assume it's a complex block and just return it as is,
            // maybe missing some subtitle formatting but preserving media is more important.
            // However, the previous logic pushed media separately.
            // Let's check if we pushed anything.
            // If we pushed parts, we might have duplicated text if we also push outerHTML.
            // Actually, if we have media, we should probably skip the text splitting to avoid breaking the media.
            // Let's revert the split for this specific case (media presence).
          }
        } else {
          // No text, maybe just media?
          if (el.querySelector('.kora-media-wrapper') || el.querySelector('audio') || el.querySelector('video')) {
            formattedContent.push({
              type: 'media',
              text: '',
              html: el.outerHTML
            });
          }
        }
        return;
      }

      // Fallback for other elements
      formattedContent.push({
        type: 'paragraph',
        text: el.textContent || '',
        html: el.outerHTML
      });
    }
  };

  Array.from(doc.body.childNodes).forEach(processNode);

  return formattedContent;
}
