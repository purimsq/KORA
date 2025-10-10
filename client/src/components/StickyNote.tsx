import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Check, Edit2, Trash2 } from "lucide-react";

interface StickyNoteProps {
  note?: { id: string; content: string; color?: string };
  position: { top: number; left: number };
  onSave: (content: string, color: string) => void;
  onCancel: () => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onNoteClick?: () => void;
}

const STICKY_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-gray-800', hover: 'hover:bg-yellow-200' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-gray-800', hover: 'hover:bg-pink-200' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-gray-800', hover: 'hover:bg-blue-200' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-gray-800', hover: 'hover:bg-green-200' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-gray-800', hover: 'hover:bg-purple-200' },
];

export function StickyNote({ note, position, onSave, onCancel, onEdit, onDelete, onNoteClick }: StickyNoteProps) {
  const [content, setContent] = useState(note?.content || "");
  const [selectedColor, setSelectedColor] = useState(note?.color || 'yellow');
  const [isEditing, setIsEditing] = useState(!note);
  
  const colorConfig = STICKY_COLORS.find(c => c.name === selectedColor) || STICKY_COLORS[0];

  const handleSave = () => {
    if (content.trim()) {
      if (note && onEdit) {
        onEdit(note.id, content.trim());
      } else {
        onSave(content.trim(), selectedColor);
      }
    }
  };

  const handleDelete = () => {
    if (note && onDelete) {
      onDelete(note.id);
    }
  };

  return (
    <Card 
      className={`absolute z-40 w-64 p-3 shadow-xl rotate-1 animate-fade-in cursor-pointer ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
      }}
      onClick={onNoteClick}
      data-testid="sticky-note"
    >
      {isEditing ? (
        <>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your note..."
            className={`min-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 text-sm placeholder:text-gray-500 ${colorConfig.text}`}
            autoFocus
            data-testid="textarea-sticky-note"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-1 mt-2 mb-2">
            {STICKY_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColor(color.name);
                }}
                className={`w-6 h-6 rounded-full border-2 ${color.bg} ${
                  selectedColor === color.name ? 'border-gray-800' : 'border-gray-400'
                }`}
                data-testid={`button-color-${color.name}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={!content.trim()}
              className="flex-1 h-7 text-xs"
              data-testid="button-save-sticky-note"
            >
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="h-7 px-2"
              data-testid="button-cancel-sticky-note"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={`text-sm mb-2 whitespace-pre-wrap ${colorConfig.text}`} data-testid="text-sticky-note-content">
            {note?.content}
          </p>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className={`h-6 px-2 text-xs ${colorConfig.hover}`}
              data-testid="button-edit-sticky-note"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className={`h-6 px-2 text-xs ${colorConfig.hover} text-destructive`}
              data-testid="button-delete-sticky-note"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className={`h-6 px-2 text-xs ml-auto ${colorConfig.hover}`}
              data-testid="button-close-sticky-note"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
