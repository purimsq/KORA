import { useState } from "react";
import type { Highlight, Thought, Annotation } from "@shared/schema";
import { ThoughtCloud } from "./ThoughtCloud";
import { StickyNote } from "./StickyNote";

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

  // Render highlights
  const renderContent = () => {
    // For now, render plain content with highlights as colored spans
    // In a full implementation, you'd parse the text and apply highlights
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((para, idx) => {
      // Find highlights that match this paragraph
      const paraHighlights = highlights.filter(h => h.text && para.includes(h.text));
      const paraThoughts = thoughts.filter(t => t.highlightedText && para.includes(t.highlightedText));
      const paraAnnotations = annotations.filter(a => a.text && para.includes(a.text));
      
      if (paraHighlights.length === 0 && paraThoughts.length === 0 && paraAnnotations.length === 0) {
        return <p key={idx} className={`font-${fontFamily}`}>{para}</p>;
      }

      // Render with highlights
      let renderedText = para;
      
      // Apply thought highlights (blue with dotted underline)
      paraThoughts.forEach(thought => {
        if (thought.highlightedText) {
          renderedText = renderedText.replace(
            thought.highlightedText,
            `<span class="highlight-thought" data-thought-id="${thought.id}" style="cursor: pointer;">${thought.highlightedText}</span>`
          );
        }
      });

      // Apply color highlights
      paraHighlights.forEach(highlight => {
        if (highlight.text) {
          renderedText = renderedText.replace(
            highlight.text,
            `<span class="highlight-${highlight.color}">${highlight.text}</span>`
          );
        }
      });

      // Apply underlines
      paraAnnotations.filter(a => a.type === 'underline').forEach(annotation => {
        if (annotation.text) {
          renderedText = renderedText.replace(
            annotation.text,
            `<span class="underline-annotation">${annotation.text}</span>`
          );
        }
      });

      // Apply sticky note highlights with colors
      paraAnnotations.filter(a => a.type === 'sticky_note').forEach(annotation => {
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
          className={`font-${fontFamily}`}
          dangerouslySetInnerHTML={{ __html: renderedText }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.thoughtId) {
              const thought = paraThoughts.find(t => t.id === target.dataset.thoughtId);
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
