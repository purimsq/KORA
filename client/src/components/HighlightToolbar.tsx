import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Highlighter, MessageCircle, Underline as UnderlineIcon, StickyNote, Bookmark, Trash2 } from "lucide-react";

interface HighlightToolbarProps {
  position: { top: number; left: number };
  onHighlight: (color: 'yellow' | 'green') => void;
  onAddThought: () => void;
  onUnderline: () => void;
  onAddNote: () => void;
  onBookmark: () => void;
  onRemove?: () => void;
  hasAnnotation?: boolean;
}

export function HighlightToolbar({ 
  position, 
  onHighlight, 
  onAddThought, 
  onUnderline, 
  onAddNote, 
  onBookmark,
  onRemove,
  hasAnnotation 
}: HighlightToolbarProps) {
  return (
    <Card 
      className="absolute z-50 p-2 shadow-xl border-2 animate-fade-in"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translate(-50%, -120%)',
      }}
      data-testid="highlight-toolbar"
    >
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onHighlight('yellow')}
          className="gap-2 px-3"
          data-testid="button-highlight-yellow"
        >
          <Highlighter className="w-4 h-4 text-yellow-600" />
          <span className="text-xs">Yellow</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onHighlight('green')}
          className="gap-2 px-3"
          data-testid="button-highlight-green"
        >
          <Highlighter className="w-4 h-4 text-green-600" />
          <span className="text-xs">Green</span>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onAddThought}
          title="Add Thought"
          data-testid="button-add-thought"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onUnderline}
          title="Underline"
          data-testid="button-underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onAddNote}
          title="Sticky Note"
          data-testid="button-sticky-note"
        >
          <StickyNote className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBookmark}
          title="Bookmark"
          data-testid="button-bookmark"
        >
          <Bookmark className="w-4 h-4" />
        </Button>

        {hasAnnotation && onRemove && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              title="Remove Annotation"
              className="text-destructive hover:text-destructive"
              data-testid="button-remove-annotation"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
