import { useState, useEffect } from "react";
import type { Highlight, Thought, Annotation } from "@shared/schema";
import { ThoughtCloud } from "./ThoughtCloud";
import { formatContentWithAnnotations } from "@/lib/contentParser";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface AnnotatedArticleProps {
  content: string;
  highlights: Highlight[];
  thoughts: Thought[];
  annotations: Annotation[];
  fontFamily: string;
  searchText?: string;
  currentSearchIndex?: number;
  onSearchMatchesFound?: (count: number) => void;
  onUpdateThought: (id: string, text: string) => void;
  onDeleteThought: (id: string) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onNoteClick?: (text: string) => void;
  onStickyNoteClick?: (text: string) => void;
  onHighlightClick?: (id: string, text: string) => void;
  onAnnotationClick?: (id: string, text: string) => void;
}

export function AnnotatedArticle({
  content,
  highlights,
  thoughts,
  annotations,
  fontFamily,
  searchText = "",
  currentSearchIndex = 0,
  onSearchMatchesFound,
  onUpdateThought,
  onDeleteThought,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onNoteClick,
  onStickyNoteClick,
  onHighlightClick,
  onAnnotationClick,
}: AnnotatedArticleProps) {
  const [activeThought, setActiveThought] = useState<Thought | null>(null);
  const [thoughtPosition, setThoughtPosition] = useState({ top: 0, left: 0 });
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);

  const handleThoughtHover = (thought: Thought, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setThoughtPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
    setActiveThought(thought);
  };

  // Render content with proper formatting
  const renderContent = () => {
    const formattedContent = formatContentWithAnnotations(content);
    let searchMatchCounter = 0;

    return formattedContent.map((item, idx) => {
      const itemText = item.text;

      // Find highlights that match this content item
      const itemHighlights = highlights.filter(h => h.text && itemText.includes(h.text));
      const itemThoughts = thoughts.filter(t => t.highlightedText && itemText.includes(t.highlightedText));
      const itemAnnotations = annotations.filter(a => a.text && itemText.includes(a.text));

      // For headings, render without annotations
      if (item.type === 'heading' || item.type === 'subheading') {
        return (
          <div
            key={idx}
            className={`font-${fontFamily}`}
            dangerouslySetInnerHTML={{ __html: item.html }}
          />
        );
      }

      // For media (audio/video), render as is without annotations
      if (item.type === 'media') {
        return (
          <div
            key={idx}
            className="my-6"
            dangerouslySetInnerHTML={{ __html: item.html }}
          />
        );
      }

      // For paragraphs, apply annotations if any exist
      if (itemHighlights.length === 0 && itemThoughts.length === 0 && itemAnnotations.length === 0) {
        return (
          <div
            key={idx}
            className={`font-${fontFamily}`}
            dangerouslySetInnerHTML={{ __html: item.html }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              // Handle image clicks
              if (target.tagName === 'IMG') {
                e.preventDefault();
                const img = target as HTMLImageElement;
                setSelectedImage({
                  url: img.src,
                  caption: img.alt
                });
                return;
              }
            }}
          />
        );
      }

      // Render with highlights and annotations
      let renderedText = itemText;

      // Apply search highlighting if search text exists
      if (searchText && itemText.toLowerCase().includes(searchText.toLowerCase())) {
        const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        const parts = itemText.split(regex);

        renderedText = parts.map((part, partIdx) => {
          if (part.toLowerCase() === searchText.toLowerCase()) {
            const isCurrentMatch = searchMatchCounter === currentSearchIndex;
            const className = isCurrentMatch
              ? 'search-highlight search-highlight-current'
              : 'search-highlight';
            const style = isCurrentMatch
              ? 'background-color: #fbbf24; padding: 2px 4px; border-radius: 2px; font-weight: 600;'
              : 'background-color: #fef08a; padding: 2px 4px; border-radius: 2px;';
            searchMatchCounter++;
            return `<span class="${className}" style="${style}">${part}</span>`;
          }
          return part;
        }).join('');
      }

      // Apply color highlights first (so they don't override thought highlights)
      itemHighlights.forEach(highlight => {
        if (highlight.text && !renderedText.includes(`>${highlight.text}</span>`)) {
          const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');

          // Define color mapping for all highlight colors
          const colorMap: Record<string, string> = {
            yellow: '#fef08a',
            green: '#86efac',
            red: '#fca5a5',
            blue: '#93c5fd',
            orange: '#fdba74',
            purple: '#d8b4fe'
          };

          const bgColor = colorMap[highlight.color] || '#fef08a';

          renderedText = renderedText.replace(
            regex,
            `<mark class="highlight-${highlight.color}" data-highlight-id="${highlight.id}" style="background-color: ${bgColor}; padding: 2px 4px; border-radius: 2px; cursor: pointer;">${highlight.text}</mark>`
          );
        }
      });

      // Apply thought highlights (blue with dotted underline) - with hover capability
      itemThoughts.forEach(thought => {
        if (thought.highlightedText && !renderedText.includes(`>${thought.highlightedText}</span>`)) {
          const escapedText = thought.highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');
          renderedText = renderedText.replace(
            regex,
            `<span class="highlight-thought" data-thought-id="${thought.id}" style="cursor: pointer; background-color: #dbeafe; border-bottom: 2px dotted #3b82f6; padding: 2px 4px; border-radius: 2px;">${thought.highlightedText}<span class="print-thought-content" style="display: none;">${thought.text}</span></span>`
          );
        }
      });

      // Apply underlines with proper styling
      itemAnnotations.filter(a => a.type === 'underline').forEach(annotation => {
        if (annotation.text) {
          const escapedText = annotation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');
          renderedText = renderedText.replace(
            regex,
            `<span class="underline-annotation" data-annotation-id="${annotation.id}" style="text-decoration: underline; text-decoration-color: #3b82f6; text-decoration-thickness: 2px; text-underline-offset: 3px; cursor: pointer;">${annotation.text}</span>`
          );
        }
      });

      // Apply sticky note highlights with colors matching the sticky note
      itemAnnotations.filter(a => a.type === 'sticky_note').forEach(annotation => {
        if (annotation.text && annotation.color) {
          const escapedText = annotation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');

          // Color mapping for sticky notes - match the sticky note background colors
          const stickyColorMap: Record<string, string> = {
            yellow: '#fef3c7',
            pink: '#fce7f3',
            blue: '#dbeafe',
            green: '#dcfce7',
            purple: '#f3e8ff'
          };

          const bgColor = stickyColorMap[annotation.color] || '#fef3c7';

          renderedText = renderedText.replace(
            regex,
            `<span class="sticky-note-highlight" data-note-text="${annotation.text}" data-clickable="true" style="background-color: ${bgColor}; padding: 2px 6px; border-radius: 3px; border-left: 3px solid ${annotation.color === 'yellow' ? '#fbbf24' : annotation.color === 'pink' ? '#f472b6' : annotation.color === 'blue' ? '#60a5fa' : annotation.color === 'green' ? '#4ade80' : '#a78bfa'}; cursor: pointer;">${annotation.text}<span class="print-note-content" style="display: none;">${annotation.content}</span></span>`
          );
        }
      });

      return (
        <p
          key={idx}
          className={`font-${fontFamily} mb-4`}
          dangerouslySetInnerHTML={{ __html: renderedText }}
          onClick={(e) => {
            const target = e.target as HTMLElement;

            // Handle image clicks
            if (target.tagName === 'IMG') {
              e.preventDefault();
              const img = target as HTMLImageElement;
              setSelectedImage({
                url: img.src,
                caption: img.alt
              });
              return;
            }

            // Handle highlight clicks
            if (target.dataset.highlightId && onHighlightClick) {
              onHighlightClick(target.dataset.highlightId, target.textContent || '');
              e.stopPropagation();
              return;
            }
            // Handle underline clicks
            if (target.dataset.annotationId && onAnnotationClick) {
              onAnnotationClick(target.dataset.annotationId, target.textContent || '');
              e.stopPropagation();
              return;
            }
            // Handle sticky note clicks
            if (target.dataset.clickable && target.dataset.noteText && onStickyNoteClick) {
              onStickyNoteClick(target.dataset.noteText);
              e.stopPropagation();
              return;
            }
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.thoughtId) {
              const thought = itemThoughts.find(t => t.id === target.dataset.thoughtId);
              if (thought) {
                handleThoughtHover(thought, e as any);
              }
            }
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.thoughtId) {
              setActiveThought(null);
            }
          }}

        />
      );
    });
  };

  // Count total search matches and notify parent
  useEffect(() => {
    if (searchText && onSearchMatchesFound) {
      const formattedContent = formatContentWithAnnotations(content);
      let count = 0;
      formattedContent.forEach(item => {
        const matches = item.text.toLowerCase().split(searchText.toLowerCase()).length - 1;
        count += matches;
      });
      onSearchMatchesFound(count);
    } else if (onSearchMatchesFound) {
      onSearchMatchesFound(0);
    }
  }, [searchText, content, onSearchMatchesFound]);

  return (
    <>
      <div className="prose prose-lg max-w-none">
        {renderContent()}
      </div>

      {activeThought && (
        <ThoughtCloud
          thought={{ id: activeThought.id, text: activeThought.text }}
          position={thoughtPosition}
          onSave={() => { }}
          onCancel={() => setActiveThought(null)}
          onEdit={(id, text) => {
            onUpdateThought(id, text);
            setActiveThought(null);
          }}
          onDelete={(id) => {
            onDeleteThought(id);
            setActiveThought(null);
          }}
        />
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.caption || "Article image"}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {selectedImage?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 text-center backdrop-blur-sm">
                <p className="text-sm">{selectedImage.caption}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
