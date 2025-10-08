import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Check, Edit2, Trash2 } from "lucide-react";

interface StickyNoteProps {
  note?: { id: string; content: string };
  position: { top: number; left: number };
  onSave: (content: string) => void;
  onCancel: () => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export function StickyNote({ note, position, onSave, onCancel, onEdit, onDelete }: StickyNoteProps) {
  const [content, setContent] = useState(note?.content || "");
  const [isEditing, setIsEditing] = useState(!note);

  const handleSave = () => {
    if (content.trim()) {
      if (note && onEdit) {
        onEdit(note.id, content.trim());
      } else {
        onSave(content.trim());
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
      className="absolute z-40 w-56 p-3 bg-yellow-100 dark:bg-yellow-200 border-yellow-300 shadow-lg rotate-1 animate-fade-in"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
      }}
      data-testid="sticky-note"
    >
      {isEditing ? (
        <>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your note..."
            className="min-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 text-sm text-gray-800 placeholder:text-gray-500"
            autoFocus
            data-testid="textarea-sticky-note"
          />
          <div className="flex items-center gap-1 mt-2">
            <Button 
              size="sm" 
              onClick={handleSave}
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
              onClick={onCancel}
              className="h-7 px-2 bg-yellow-50"
              data-testid="button-cancel-sticky-note"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap" data-testid="text-sticky-note-content">
            {note?.content}
          </p>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="h-6 px-2 text-xs hover:bg-yellow-200"
              data-testid="button-edit-sticky-note"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDelete}
              className="h-6 px-2 text-xs hover:bg-yellow-200 text-destructive"
              data-testid="button-delete-sticky-note"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onCancel}
              className="h-6 px-2 text-xs ml-auto hover:bg-yellow-200"
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
