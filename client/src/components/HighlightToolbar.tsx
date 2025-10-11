import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Highlighter, MessageCircle, Underline as UnderlineIcon, StickyNote, Trash2 } from "lucide-react";

interface HighlightToolbarProps {
  position: { top: number; left: number };
  onHighlight: (color: 'yellow' | 'green' | 'red' | 'blue' | 'orange' | 'purple') => void;
  onAddThought: () => void;
  onUnderline: () => void;
  onAddNote: () => void;
  onRemove?: () => void;
  hasAnnotation?: boolean;
}

const COLOR_MEANINGS = [
  { color: 'yellow', label: 'Key Point', hex: '#fef08a' },
  { color: 'green', label: 'Definition', hex: '#86efac' },
  { color: 'red', label: 'Important', hex: '#fca5a5' },
  { color: 'blue', label: 'Reference', hex: '#93c5fd' },
  { color: 'orange', label: 'Example', hex: '#fdba74' },
  { color: 'purple', label: 'Question', hex: '#d8b4fe' },
];

export function HighlightToolbar({ 
  position, 
  onHighlight, 
  onAddThought, 
  onUnderline, 
  onAddNote, 
  onRemove,
  hasAnnotation
}: HighlightToolbarProps) {
  return (
    <Card 
      className="absolute z-50 shadow-xl border-2 animate-fade-in"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translate(-50%, -120%)',
      }}
      data-testid="highlight-toolbar"
    >
      <div className="p-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('yellow')}
            className="gap-1 px-2"
            data-testid="button-highlight-yellow"
            title="Yellow - Key Point"
          >
            <Highlighter className="w-4 h-4 text-yellow-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('green')}
            className="gap-1 px-2"
            data-testid="button-highlight-green"
            title="Green - Definition"
          >
            <Highlighter className="w-4 h-4 text-green-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('red')}
            className="gap-1 px-2"
            data-testid="button-highlight-red"
            title="Red - Important"
          >
            <Highlighter className="w-4 h-4 text-red-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('blue')}
            className="gap-1 px-2"
            data-testid="button-highlight-blue"
            title="Blue - Reference"
          >
            <Highlighter className="w-4 h-4 text-blue-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('orange')}
            className="gap-1 px-2"
            data-testid="button-highlight-orange"
            title="Orange - Example"
          >
            <Highlighter className="w-4 h-4 text-orange-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHighlight('purple')}
            className="gap-1 px-2"
            data-testid="button-highlight-purple"
            title="Purple - Question"
          >
            <Highlighter className="w-4 h-4 text-purple-600" />
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

        {/* Color Legend */}
        <div className="border-t mt-2 pt-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {COLOR_MEANINGS.map(({ color, label, hex }) => (
              <div key={color} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: hex }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
