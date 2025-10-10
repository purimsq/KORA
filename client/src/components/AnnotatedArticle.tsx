import { useState } from "react";
import type { Highlight, Thought, Annotation } from "@shared/schema";
import { ThoughtCloud } from "./ThoughtCloud";
import { formatContentWithAnnotations } from "@/lib/contentParser";

interface AnnotatedArticleProps {
  content: string;
  highlights: Highlight[];
  thoughts: Thought[];
  annotations: Annotation[];
  fontFamily: string;
  onUpdateThought: (id: string, text: string) => void;
  onDeleteThought: (id: string) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function AnnotatedArticle({
  content,
  highlights,
  thoughts,
  annotations,
  fontFamily,
  onUpdateThought,
  onDeleteThought,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onNoteClick,
}: AnnotatedArticleProps & { onNoteClick?: (text: string) => void }) {
  const [activeThought, setActiveThought] = useState<Thought | null>(null);
  const [thoughtPosition, setThoughtPosition] = useState({ top: 0, left: 0 });

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

      // For paragraphs, apply annotations if any exist
      if (itemHighlights.length === 0 && itemThoughts.length === 0 && itemAnnotations.length === 0) {
        return (
          <div 
            key={idx} 
            className={`font-${fontFamily}`}
            dangerouslySetInnerHTML={{ __html: item.html }}
          />
        );
      }

      // Render with highlights and annotations
      let renderedText = itemText;
      
      // Apply color highlights first (so they don't override thought highlights)
      itemHighlights.forEach(highlight => {
        if (highlight.text && !renderedText.includes(`>${highlight.text}</span>`)) {
          const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');
          renderedText = renderedText.replace(
            regex,
            `<mark class="highlight-${highlight.color}" style="background-color: ${highlight.color === 'yellow' ? '#fef08a' : '#86efac'}; padding: 2px 4px; border-radius: 2px;">${highlight.text}</mark>`
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
            `<span class="highlight-thought" data-thought-id="${thought.id}" style="cursor: pointer; background-color: #dbeafe; border-bottom: 2px dotted #3b82f6; padding: 2px 4px; border-radius: 2px;">${thought.highlightedText}</span>`
          );
        }
      });

      // Apply underlines
      itemAnnotations.filter(a => a.type === 'underline').forEach(annotation => {
        if (annotation.text) {
          renderedText = renderedText.replace(
            annotation.text,
            `<span class="underline-annotation">${annotation.text}</span>`
          );
        }
      });

      // Apply sticky note highlights with colors
      itemAnnotations.filter(a => a.type === 'sticky_note').forEach(annotation => {
        if (annotation.text && annotation.color) {
          const colorClass = `highlight-${annotation.color}`;
          renderedText = renderedText.replace(
            annotation.text,
            `<span class="${colorClass}" data-note-text="${annotation.text}">${annotation.text}</span>`
          );
        }
      });

      return (
        <p 
          key={idx} 
          className={`font-${fontFamily} mb-4`}
          dangerouslySetInnerHTML={{ __html: renderedText }}
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

  return (
    <>
      <div className="prose prose-lg max-w-none">
        {renderContent()}
      </div>

      {activeThought && (
        <ThoughtCloud
          thought={{ id: activeThought.id, text: activeThought.text }}
          position={thoughtPosition}
          onSave={() => {}}
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
    </>
  );
}
