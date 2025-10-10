import { useState } from "react";
import type { Highlight, Thought, Annotation } from "@shared/schema";
import { ThoughtCloud } from "./ThoughtCloud";
import { StickyNote } from "./StickyNote";
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
  const [activeNote, setActiveNote] = useState<Annotation | null>(null);
  const [thoughtPosition, setThoughtPosition] = useState({ top: 0, left: 0 });
  const [notePosition, setNotePosition] = useState({ top: 0, left: 0 });

  const handleThoughtHover = (thought: Thought, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setThoughtPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
    setActiveThought(thought);
  };

  const handleNoteHover = (note: Annotation, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setNotePosition({
      top: rect.top + window.scrollY,
      left: rect.right + 20,
    });
    setActiveNote(note);
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
      
      // Apply thought highlights (blue with dotted underline)
      itemThoughts.forEach(thought => {
        if (thought.highlightedText) {
          renderedText = renderedText.replace(
            thought.highlightedText,
            `<span class="highlight-thought" data-thought-id="${thought.id}" style="cursor: pointer;">${thought.highlightedText}</span>`
          );
        }
      });

      // Apply color highlights
      itemHighlights.forEach(highlight => {
        if (highlight.text) {
          renderedText = renderedText.replace(
            highlight.text,
            `<span class="highlight-${highlight.color}">${highlight.text}</span>`
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
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.thoughtId) {
              const thought = itemThoughts.find(t => t.id === target.dataset.thoughtId);
              if (thought) {
                handleThoughtHover(thought, e as any);
              }
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

      {/* Render sticky notes in margin */}
      {annotations.filter(a => a.type === 'sticky_note').map((note, idx) => {
        const colorMap: Record<string, string> = {
          yellow: 'bg-yellow-400',
          pink: 'bg-pink-400',
          blue: 'bg-blue-400',
          green: 'bg-green-400',
          purple: 'bg-purple-400',
        };
        const bgColor = colorMap[note.color || 'yellow'] || 'bg-yellow-400';
        
        return (
          <div 
            key={note.id}
            className="absolute right-0 top-0"
            style={{ marginTop: `${idx * 120}px` }}
            onClick={() => onNoteClick?.(note.text)}
            onMouseEnter={(e) => handleNoteHover(note, e as any)}
          >
            <div className={`w-4 h-4 ${bgColor} rounded-full cursor-pointer hover:scale-110 transition-transform`} />
          </div>
        );
      })}

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

      {activeNote && (
        <StickyNote
          note={{ id: activeNote.id, content: activeNote.content || '' }}
          position={notePosition}
          onSave={() => {}}
          onCancel={() => setActiveNote(null)}
          onEdit={(id, content) => {
            onUpdateAnnotation(id, content);
            setActiveNote(null);
          }}
          onDelete={(id) => {
            onDeleteAnnotation(id);
            setActiveNote(null);
          }}
        />
      )}
    </>
  );
}
