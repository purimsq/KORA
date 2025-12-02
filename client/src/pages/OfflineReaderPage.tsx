import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HighlightToolbar } from "@/components/HighlightToolbar";
import { ThoughtCloud } from "@/components/ThoughtCloud";
import { StickyNote } from "@/components/StickyNote";
import { StickyNotesSidebar } from "@/components/StickyNotesSidebar";
import { AnnotatedArticle } from "@/components/AnnotatedArticle";
import { TableOfContents } from "@/components/TableOfContents";
import {
  Download,
  RotateCcw,
  Search as SearchIcon,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  ArrowUp,
  List,
  StickyNote as StickyNoteIcon,
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useDownload } from "@/hooks/useDownloads";
import {
  useHighlights,
  useThoughts,
  useAnnotations,
  useCreateHighlight,
  useCreateThought,
  useCreateAnnotation,
  useUpdateThought,
  useDeleteThought,
  useUpdateAnnotation,
  useDeleteAnnotation,
  useDeleteHighlight,
} from "@/hooks/useAnnotations";
import { usePreferences } from "@/hooks/usePreferences";
import jsPDF from 'jspdf';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OfflineReaderPage() {
  const [, params] = useRoute("/reader/:id");
  const [, setLocation] = useLocation();
  const downloadId = params?.id || '';

  const [selection, setSelection] = useState<{ text: string; range: Range } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [thoughtCloud, setThoughtCloud] = useState<{ position: { top: number; left: number } } | null>(null);
  const [stickyNote, setStickyNote] = useState<{ position: { top: number; left: number } } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const [showTOC, setShowTOC] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [totalSearchMatches, setTotalSearchMatches] = useState(0);

  // Generic delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'highlight' | 'underline' | 'thought' | 'sticky_note' } | null>(null);

  const { toast } = useToast();

  // Track scroll position for scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSearchMatch = (index: number) => {
    const matches = document.querySelectorAll('.search-highlight');
    if (matches[index]) {
      matches[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  const { data, isLoading } = useDownload(downloadId);
  const { data: prefsData } = usePreferences();
  const { data: highlightsData } = useHighlights(downloadId);
  const { data: thoughtsData } = useThoughts(downloadId);
  const { data: annotationsData } = useAnnotations(downloadId);
  const createHighlight = useCreateHighlight();
  const createThought = useCreateThought();
  const createAnnotation = useCreateAnnotation();
  const updateThought = useUpdateThought();
  const deleteThought = useDeleteThought();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();
  const deleteHighlight = useDeleteHighlight();

  const article = data?.download;
  const fontFamily = prefsData?.preferences?.fontFamily || 'sans';
  const highlights = highlightsData?.highlights || [];
  const thoughts = thoughtsData?.thoughts || [];
  const annotations = annotationsData?.annotations || [];
  const stickyNotes = annotations.filter(a => a.type === 'sticky_note');

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({ text: sel.toString(), range });
      setToolbarPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleHighlight = (color: 'yellow' | 'green' | 'red' | 'blue' | 'orange' | 'purple') => {
    if (selection) {
      createHighlight.mutate({
        downloadId,
        text: selection.text,
        color,
        startOffset: 0,
        endOffset: selection.text.length,
      }, {
        onSuccess: () => {
          toast({ title: "Text Highlighted", description: `Highlighted in ${color}` });
          setShowToolbar(false);
        },
      });
    }
  };

  const handleAddThought = () => {
    if (selection) {
      const rect = selection.range.getBoundingClientRect();
      setThoughtCloud({
        position: {
          top: rect.top + window.scrollY,
          left: rect.left + rect.width / 2,
        },
      });
      setShowToolbar(false);
    }
  };

  const handleSaveThought = (text: string) => {
    if (selection) {
      createThought.mutate({
        downloadId,
        highlightedText: selection.text,
        text,
        position: Math.floor(window.scrollY),
      }, {
        onSuccess: () => {
          toast({ title: "Thought Saved" });
          setThoughtCloud(null);
          setSelection(null);
        },
      });
    }
  };

  const handleAddNote = () => {
    if (selection) {
      const rect = selection.range.getBoundingClientRect();
      setStickyNote({
        position: {
          top: rect.top + window.scrollY,
          left: rect.right + 20,
        },
      });
      setShowToolbar(false);
    }
  };

  const handleSaveNote = (content: string, color: string) => {
    if (selection) {
      createAnnotation.mutate({
        downloadId,
        type: 'sticky_note',
        text: selection.text,
        content,
        color,
        position: Math.floor(window.scrollY),
      }, {
        onSuccess: () => {
          toast({ title: "Note Saved" });
          setStickyNote(null);
          setSelection(null);
        },
      });
    }
  };

  const handleNoteClick = (noteText: string) => {
    // Find the text in the article
    const articleContent = document.querySelector('[data-testid="article-content"]');
    if (articleContent && noteText) {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        articleContent,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      // Find the node containing the text
      for (const textNode of textNodes) {
        if (textNode.textContent?.includes(noteText)) {
          const parent = textNode.parentElement;
          if (parent) {
            // Scroll to the element
            parent.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add pop effect
            parent.classList.add('animate-pulse');
            setTimeout(() => {
              parent.classList.remove('animate-pulse');
            }, 1000);

            break;
          }
        }
      }
    }
  };

  const handleUnderline = () => {
    if (selection) {
      createAnnotation.mutate({
        downloadId,
        type: 'underline',
        text: selection.text,
        position: Math.floor(window.scrollY),
      }, {
        onSuccess: () => {
          toast({ title: "Text Underlined" });
          setShowToolbar(false);
        },
      });
    }
  };

  const handleRemoveAnnotation = () => {
    if (selection) {
      // Find underline annotation for this text
      const underlineAnnotation = annotations.find(
        a => a.type === 'underline' && a.text === selection.text
      );

      if (underlineAnnotation) {
        setDeleteConfirm({ id: underlineAnnotation.id, type: 'underline' });
        setShowToolbar(false);
      }
    }
  };

  const handleHighlightClick = (id: string, text: string) => {
    setDeleteConfirm({ id, type: 'highlight' });
  };

  const handleAnnotationClick = (id: string, text: string) => {
    setDeleteConfirm({ id, type: 'underline' });
  };

  const handleStickyNoteTextClick = (noteText: string) => {
    // Find the sticky note by its text
    const note = stickyNotes.find(n => n.text === noteText);
    if (!note) return;

    // Auto-open sticky notes sidebar if closed
    if (!showStickyNotes) {
      setShowStickyNotes(true);
    }

    // Highlight the note
    setHighlightedNoteId(note.id);

    // Scroll to the note in the sidebar
    setTimeout(() => {
      const noteElement = document.getElementById(`sticky-note-${note.id}`);
      if (noteElement) {
        noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedNoteId(null);
      }, 2000);
    }, 100);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    const { id, type } = deleteConfirm;

    if (type === 'highlight') {
      deleteHighlight.mutate({ id, downloadId }, {
        onSuccess: () => toast({ title: "Highlight Removed" })
      });
    } else if (type === 'underline' || type === 'sticky_note') {
      deleteAnnotation.mutate({ id, downloadId }, {
        onSuccess: () => toast({ title: type === 'underline' ? "Underline Removed" : "Sticky Note Deleted" })
      });
    } else if (type === 'thought') {
      deleteThought.mutate({ id, downloadId }, {
        onSuccess: () => toast({ title: "Thought Deleted" })
      });
    }

    setDeleteConfirm(null);
  };

  const handleExportPDF = async (includeEdits: boolean) => {
    if (!article) return;

    // Add printing class to body to control visibility of annotations
    const printClass = includeEdits ? 'printing-with-edits' : 'printing-clean';
    document.body.classList.add(printClass);

    try {
      // @ts-ignore - window.electron is exposed via preload
      const result = await window.electron.printToPDF(article.title);

      if (result.success) {
        toast({
          title: "PDF Exported",
          description: `Saved to ${result.filePath}`,
        });
      } else if (result.canceled) {
        // User canceled, do nothing
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      document.body.classList.remove(printClass);
      setShowExportDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/downloads")}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="relative flex-1 max-w-md flex items-center gap-1">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search in article..."
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setCurrentSearchIndex(0);
                    }}
                    className="pl-9 h-9"
                    data-testid="input-search-article"
                  />
                  {searchText && totalSearchMatches > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {currentSearchIndex + 1}/{totalSearchMatches}
                    </div>
                  )}
                </div>
                {searchText && totalSearchMatches > 0 && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => {
                        const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : totalSearchMatches - 1;
                        setCurrentSearchIndex(newIndex);
                        scrollToSearchMatch(newIndex);
                      }}
                      data-testid="button-search-prev"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => {
                        const newIndex = currentSearchIndex < totalSearchMatches - 1 ? currentSearchIndex + 1 : 0;
                        setCurrentSearchIndex(newIndex);
                        scrollToSearchMatch(newIndex);
                      }}
                      data-testid="button-search-next"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTOC(!showTOC)}
                className="gap-2"
                data-testid="button-toggle-outline"
              >
                <List className="w-4 h-4" />
                Outline
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStickyNotes(!showStickyNotes)}
                className="gap-2"
                data-testid="button-toggle-sticky-notes"
              >
                <StickyNoteIcon className="w-4 h-4" />
                Sticky Notes
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="gap-2"
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto relative">
          <article
            onMouseUp={handleTextSelection}
            data-testid="article-content"
          >
            <h1 className={`text-4xl font-bold mb-4 font-${fontFamily}`} data-testid="text-article-title">
              {article.title}
            </h1>
            {article.authors && article.authors.length > 0 && (
              <p className="text-muted-foreground mb-6">
                By {article.authors.join(', ')}
              </p>
            )}
            <div className="space-y-6">
              {article.images && article.images.length > 0 && (
                <div className="float-right ml-6 mb-4 w-full sm:w-1/2">
                  <img
                    src={article.images[0].url}
                    alt={article.images[0].caption || article.title}
                    className="w-full rounded-lg shadow-md"
                  />
                  {article.images[0].caption && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      {article.images[0].caption}
                    </p>
                  )}
                </div>
              )}
              <AnnotatedArticle
                content={article.content}
                highlights={highlights}
                thoughts={thoughts}
                annotations={annotations}
                fontFamily={fontFamily}
                searchText={searchText}
                currentSearchIndex={currentSearchIndex}
                onSearchMatchesFound={setTotalSearchMatches}
                onUpdateThought={(id, text) => updateThought.mutate({ id, text, downloadId })}
                onDeleteThought={(id) => setDeleteConfirm({ id, type: 'thought' })}
                onUpdateAnnotation={(id, content) => updateAnnotation.mutate({ id, content, downloadId })}
                onDeleteAnnotation={(id) => setDeleteConfirm({ id, type: 'sticky_note' })}
                onNoteClick={handleNoteClick}
                onStickyNoteClick={handleStickyNoteTextClick}
                onHighlightClick={handleHighlightClick}
                onAnnotationClick={handleAnnotationClick}
              />
              {article.images && article.images.length > 1 && (
                <div className="space-y-4 clear-both">
                  {article.images.slice(1).map((img: any, index: number) => (
                    <div key={index + 1}>
                      <img
                        src={img.url}
                        alt={img.caption || article.title}
                        className="w-full rounded-lg shadow-md"
                        data-testid={`img-article-${index + 1}`}
                      />
                      {img.caption && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {article.sourceUrl && (
              <div className="mt-6 pt-6 border-t">
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                  data-testid="link-source"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original Source
                </a>
              </div>
            )}
          </article>

          {showToolbar && (
            <HighlightToolbar
              position={toolbarPosition}
              onHighlight={handleHighlight}
              onAddThought={handleAddThought}
              onUnderline={handleUnderline}
              onAddNote={handleAddNote}
              onRemove={handleRemoveAnnotation}
              hasAnnotation={selection ? annotations.some(a => a.type === 'underline' && a.text === selection.text) : false}
            />
          )}

          {thoughtCloud && (
            <ThoughtCloud
              position={thoughtCloud.position}
              onSave={handleSaveThought}
              onCancel={() => setThoughtCloud(null)}
            />
          )}

          {stickyNote && (
            <StickyNote
              position={stickyNote.position}
              onSave={handleSaveNote}
              onCancel={() => setStickyNote(null)}
            />
          )}
        </div>
      </div>

      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export as PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to include your annotations and edits in the PDF?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleExportPDF(false)}>
              Without Edits
            </Button>
            <AlertDialogAction onClick={() => handleExportPDF(true)}>
              With Edits
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirm?.type.replace('_', ' ')}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StickyNotesSidebar
        notes={stickyNotes}
        onNoteClick={handleNoteClick}
        onUpdateNote={(id, content) => updateAnnotation.mutate({ id, content, downloadId })}
        onDeleteNote={(id) => setDeleteConfirm({ id, type: 'sticky_note' })}
        highlightedNoteId={highlightedNoteId}
        isOpen={showStickyNotes}
        onToggle={() => setShowStickyNotes(!showStickyNotes)}
      />
    </div>
  );
}
