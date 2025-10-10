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
        transform: 'translate(-50%, calc(-100% - 30px))',
      }}
      data-testid="thought-cloud"
      onMouseLeave={thought ? onCancel : undefined}
    >
      {/* Clean white thought bubble matching attached image */}
      <div className="relative">
        <div className="relative bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-6 max-w-sm min-w-[280px]">
          {/* Cloud bumps for realistic thought bubble shape - matching the attached image */}
          <div className="absolute -top-4 left-[20%] w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute -top-5 left-[45%] w-20 h-20 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute -top-4 right-[20%] w-14 h-14 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute -left-4 top-[30%] w-12 h-12 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute -right-3 top-[40%] w-10 h-10 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>

          <div className="relative z-10">
            {isEditing ? (
              <>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your thought here..."
                  className="min-h-24 resize-none border-0 focus-visible:ring-0 text-sm italic bg-transparent text-gray-700 dark:text-gray-200"
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
                <p className="text-sm italic text-gray-700 dark:text-gray-200 mb-3 font-medium" data-testid="text-thought-content">
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

        {/* Thought bubble tail - matching the attached image with white circles */}
        <div className="absolute -bottom-8 left-[15%] flex flex-col items-start gap-1">
          <div className="w-5 h-5 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-md" />
          <div className="w-3 h-3 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-md ml-2" />
          <div className="w-2 h-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm ml-3" />
        </div>
      </div>
    </div>
  );
}
