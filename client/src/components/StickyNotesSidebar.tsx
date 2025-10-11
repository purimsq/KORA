import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Trash2, Edit2, Maximize2, Minimize2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Annotation } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

interface StickyNotesSidebarProps {
  notes: Annotation[];
  onNoteClick: (text: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  highlightedNoteId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

const STICKY_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-gray-800', shadow: 'shadow-yellow-200' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-gray-800', shadow: 'shadow-pink-200' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-gray-800', shadow: 'shadow-blue-200' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-gray-800', shadow: 'shadow-green-200' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-gray-800', shadow: 'shadow-purple-200' },
];

export function StickyNotesSidebar({ notes, onNoteClick, onUpdateNote, onDeleteNote, highlightedNoteId, isOpen, onToggle }: StickyNotesSidebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (note: Annotation) => {
    setEditingNoteId(note.id);
    setEditContent(note.content || "");
  };

  const handleSave = (noteId: string) => {
    if (editContent.trim()) {
      onUpdateNote(noteId, editContent.trim());
    }
    setEditingNoteId(null);
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur border-l shadow-xl transition-all duration-300 z-40 ${
          isOpen ? (isMaximized ? 'w-[600px]' : 'w-80') : 'w-0'
        }`}
        data-testid="sticky-notes-sidebar"
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Sticky Notes</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Minimize" : "Maximize"}
                  data-testid="button-toggle-maximize-sticky-notes"
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  data-testid="button-close-sticky-notes"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notes list */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {notes.map((note, idx) => {
                  const colorConfig = STICKY_COLORS.find(c => c.name === note.color) || STICKY_COLORS[0];
                  const isEditing = editingNoteId === note.id;

                  const rotation = idx % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1deg]';
                  const hoverRotation = idx % 2 === 0 ? 'hover:rotate-[-2deg]' : 'hover:rotate-[2deg]';
                  
                  return (
                    <Card
                      key={note.id}
                      id={`sticky-note-${note.id}`}
                      className={`relative p-4 ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} border-t-4 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform ${rotation} ${hoverRotation} ${highlightedNoteId === note.id ? 'animate-bounce ring-4 ring-primary' : ''}`}
                      style={{ 
                        minHeight: '140px',
                        maxHeight: '200px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)',
                      }}
                      onClick={() => !isEditing && onNoteClick(note.text)}
                      data-testid={`sticky-note-${idx}`}
                    >
                      {/* Sticky note pin at the top */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full shadow-md" />
                      
                      {/* Sticky note realistic top edge */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400/20 to-transparent" />
                      
                      {isEditing ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`bg-transparent border-0 focus-visible:ring-0 text-sm resize-none ${colorConfig.text}`}
                            autoFocus
                            data-testid="textarea-edit-sticky-note"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(note.id)}
                              className="flex-1 h-7"
                              data-testid="button-save-edit-sticky-note"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNoteId(null)}
                              className="h-7"
                              data-testid="button-cancel-edit-sticky-note"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`text-sm whitespace-pre-wrap mb-4 leading-relaxed ${colorConfig.text}`} style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                            {note.content}
                          </p>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic border-t border-gray-300/30 pt-2">
                            📍 Referenced: "{note.text.substring(0, 35)}{note.text.length > 35 ? '...' : ''}"
                          </div>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(note);
                              }}
                              className="h-6 px-2"
                              data-testid={`button-edit-sticky-note-${idx}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                              }}
                              className="h-6 px-2 text-destructive"
                              data-testid={`button-delete-sticky-note-${idx}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </>
  );
}
