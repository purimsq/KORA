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
  onNoteClick?: (text: string) => void;
  onStickyNoteClick?: (text: string) => void;
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
  onStickyNoteClick,
}: AnnotatedArticleProps) {
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
            `<mark class="highlight-${highlight.color}" style="background-color: ${bgColor}; padding: 2px 4px; border-radius: 2px;">${highlight.text}</mark>`
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

      // Apply underlines with proper styling
      itemAnnotations.filter(a => a.type === 'underline').forEach(annotation => {
        if (annotation.text) {
          const escapedText = annotation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?![^<]*>)${escapedText}`, 'g');
          renderedText = renderedText.replace(
            regex,
            `<span class="underline-annotation" style="text-decoration: underline; text-decoration-color: #3b82f6; text-decoration-thickness: 2px; text-underline-offset: 3px;">${annotation.text}</span>`
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
            `<span class="sticky-note-highlight" data-note-text="${annotation.text}" data-clickable="true" style="background-color: ${bgColor}; padding: 2px 6px; border-radius: 3px; border-left: 3px solid ${annotation.color === 'yellow' ? '#fbbf24' : annotation.color === 'pink' ? '#f472b6' : annotation.color === 'blue' ? '#60a5fa' : annotation.color === 'green' ? '#4ade80' : '#a78bfa'}; cursor: pointer;">${annotation.text}</span>`
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
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.clickable && target.dataset.noteText && onStickyNoteClick) {
              onStickyNoteClick(target.dataset.noteText);
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
