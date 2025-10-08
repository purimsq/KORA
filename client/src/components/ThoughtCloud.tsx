import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Check, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ThoughtCloudProps {
  thought?: { id: string; text: string };
  position: { top: number; left: number };
  onSave: (text: string) => void;
  onCancel: () => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

export function ThoughtCloud({ thought, position, onSave, onCancel, onEdit, onDelete }: ThoughtCloudProps) {
  const [text, setText] = useState(thought?.text || "");
  const [isEditing, setIsEditing] = useState(!thought);

  const handleSave = () => {
    if (text.trim()) {
      if (thought && onEdit) {
        onEdit(thought.id, text.trim());
      } else {
        onSave(text.trim());
      }
    }
  };

  const handleDelete = () => {
    if (thought && onDelete) {
      onDelete(thought.id);
    }
  };

  return (
    <div 
      className="absolute z-50 animate-fade-in"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
      }}
      data-testid="thought-cloud"
    >
      {/* Cloud shape */}
      <div className="relative">
        <Card className="w-80 p-4 shadow-2xl border-2 border-primary/20 bg-white dark:bg-card">
          {isEditing ? (
            <>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your thought here..."
                className="min-h-24 resize-none border-0 focus-visible:ring-0 text-sm italic"
                autoFocus
                data-testid="textarea-thought"
              />
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="flex-1 gap-2"
                  data-testid="button-save-thought"
                >
                  <Check className="w-4 h-4" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="button-cancel-thought"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm italic text-foreground mb-3" data-testid="text-thought-content">
                {thought?.text}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 gap-2"
                  data-testid="button-edit-thought"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-thought"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onCancel}
                  data-testid="button-close-thought"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Cloud tail */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white dark:border-t-card"
        />
      </div>
    </div>
  );
}
