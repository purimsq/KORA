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
      className="absolute z-50 animate-fade-in pointer-events-auto"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translate(-50%, calc(-100% - 20px))',
      }}
      data-testid="thought-cloud"
      onMouseLeave={thought ? onCancel : undefined}
    >
      {/* Cloud-like bubble with multiple rounded edges */}
      <div className="relative">
        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-3xl shadow-2xl border-2 border-blue-200 dark:border-blue-700 p-5 max-w-xs">
          {/* Cloud bumps for realistic cloud shape */}
          <div className="absolute -top-3 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700"></div>
          <div className="absolute -top-2 right-1/4 w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700"></div>
          <div className="absolute -left-3 top-1/3 w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700"></div>
          <div className="absolute -right-2 top-1/2 w-6 h-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700"></div>

          <div className="relative z-10">
            {isEditing ? (
              <>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your thought here..."
                  className="min-h-24 resize-none border-0 focus-visible:ring-0 text-sm italic bg-transparent"
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
                <p className="text-sm italic text-blue-900 dark:text-blue-100 mb-3 font-medium" data-testid="text-thought-content">
                  💭 {thought?.text}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="flex-1 gap-2 bg-white/50 dark:bg-gray-800/50"
                    data-testid="button-edit-thought"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="text-destructive hover:text-destructive bg-white/50 dark:bg-gray-800/50"
                    data-testid="button-delete-thought"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cloud tail - multiple bubbles creating thought bubble effect */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-3 h-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700" />
          <div className="w-2 h-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border-2 border-blue-200 dark:border-blue-700 mt-2" />
          <div className="w-1.5 h-1.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full border border-blue-200 dark:border-blue-700 mt-3" />
        </div>
      </div>
    </div>
  );
}
