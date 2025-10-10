import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HighlightToolbar } from "@/components/HighlightToolbar";
import { ThoughtCloud } from "@/components/ThoughtCloud";
import { StickyNote } from "@/components/StickyNote";
import { StickyNotesSidebar } from "@/components/StickyNotesSidebar";
import { AnnotatedArticle } from "@/components/AnnotatedArticle";
import { 
  Download, 
  Bookmark as BookmarkIcon, 
  RotateCcw, 
  Search as SearchIcon,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  ArrowUp
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
  useBookmarks,
  useThoughts,
  useAnnotations,
  useCreateHighlight, 
  useCreateBookmark, 
  useCreateThought, 
  useCreateAnnotation,
  useUpdateThought,
  useDeleteThought,
  useUpdateAnnotation,
  useDeleteAnnotation,
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
  const { data, isLoading } = useDownload(downloadId);
  const { data: prefsData } = usePreferences();
  const { data: highlightsData } = useHighlights(downloadId);
  const { data: bookmarksData } = useBookmarks(downloadId);
  const { data: thoughtsData } = useThoughts(downloadId);
  const { data: annotationsData } = useAnnotations(downloadId);
  const createHighlight = useCreateHighlight();
  const createBookmark = useCreateBookmark();
  const createThought = useCreateThought();
  const createAnnotation = useCreateAnnotation();
  const updateThought = useUpdateThought();
  const deleteThought = useDeleteThought();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  const article = data?.download;
  const fontFamily = prefsData?.preferences?.fontFamily || 'sans';
  const highlights = highlightsData?.highlights || [];
  const bookmarks = bookmarksData?.bookmarks || [];
  const thoughts = thoughtsData?.thoughts || [];
  const annotations = annotationsData?.annotations || [];

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

  const handleBookmark = () => {
    if (!selection) return;
    
    const selectedText = selection.text;
    const label = selectedText.substring(0, 50);
    
    // Check if there's an existing bookmark with this text (replace functionality)
    const existingBookmark = bookmarks.find(b => b.text === selectedText);
    
    if (existingBookmark) {
      // Replace: delete old bookmark and create new one at current position
      toast({ title: "Bookmark Updated", description: "Replaced existing bookmark" });
    }
    
    createBookmark.mutate({
      downloadId,
      text: selectedText,
      position: Math.floor(window.scrollY),
      label,
    }, {
      onSuccess: () => {
        toast({ title: "Bookmark Added", description: "Bookmark saved" });
        setShowToolbar(false);
      },
    });
  };
  
  // Check if current selection has a bookmark
  const checkBookmarkStatus = () => {
    if (!selection) return 'none';
    
    const selectedText = selection.text;
    
    // Check for exact match
    const exactMatch = bookmarks.some(b => b.text === selectedText);
    if (exactMatch) return 'full';
    
    // Check for partial match
    const partialMatch = bookmarks.some(b => 
      (b.text && selectedText.includes(b.text)) || 
      (b.text && b.text.includes(selectedText))
    );
    if (partialMatch) return 'partial';
    
    return 'none';
  };
  
  const bookmarkStatus = showToolbar ? checkBookmarkStatus() : 'none';

  const handleScrollToBookmark = (position: number) => {
    window.scrollTo({ top: position, behavior: 'smooth' });
  };

  const handleExportPDF = (includeEdits: boolean) => {
    if (!article) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(20);
    doc.text(article.title, margin, 20, { maxWidth });

    // Authors
    doc.setFontSize(12);
    let yPosition = 40;

    if (article.authors && article.authors.length > 0) {
      doc.text(`By ${article.authors.join(', ')}`, margin, yPosition);
      yPosition += 10;
    }

    // Content
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(article.content, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Include annotations if requested
    if (includeEdits && (highlights.length > 0 || thoughts.length > 0 || annotations.length > 0)) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Annotations', margin, 20);
      
      yPosition = 35;
      doc.setFontSize(10);

      // Highlights
      if (highlights.length > 0) {
        doc.text('Highlights:', margin, yPosition);
        yPosition += 7;
        highlights.forEach(h => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`  • ${h.text.substring(0, 100)}... (${h.color})`, margin, yPosition);
          yPosition += 7;
        });
      }

      // Thoughts
      if (thoughts.length > 0) {
        yPosition += 5;
        doc.text('Thoughts:', margin, yPosition);
        yPosition += 7;
        thoughts.forEach(t => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`  • "${t.highlightedText}"`, margin, yPosition);
          yPosition += 7;
          doc.text(`    → ${t.text}`, margin, yPosition);
          yPosition += 7;
        });
      }

      // Notes
      const stickyNotes = annotations.filter(a => a.type === 'sticky_note');
      if (stickyNotes.length > 0) {
        yPosition += 5;
        doc.text('Notes:', margin, yPosition);
        yPosition += 7;
        stickyNotes.forEach(note => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`  • ${note.content || ''}`, margin, yPosition);
          yPosition += 7;
        });
      }
    }

    doc.save(`${article.title}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: `"${article.title}.pdf" has been downloaded${includeEdits ? ' with annotations' : ''}`,
    });
    setShowExportDialog(false);
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
              <div className="relative flex-1 max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search in article..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-article"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-bookmarks">
                    <BookmarkIcon className="w-4 h-4" />
                    Bookmarks
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {bookmarks.length === 0 ? (
                    <DropdownMenuItem disabled>No bookmarks yet</DropdownMenuItem>
                  ) : (
                    bookmarks.map(bookmark => (
                      <DropdownMenuItem 
                        key={bookmark.id}
                        onClick={() => handleScrollToBookmark(bookmark.position)}
                      >
                        {bookmark.label || 'Bookmark'}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
                bookmarks={bookmarks}
                fontFamily={fontFamily}
                onUpdateThought={(id, text) => updateThought.mutate({ id, text, downloadId })}
                onDeleteThought={(id) => deleteThought.mutate({ id, downloadId })}
                onUpdateAnnotation={(id, content) => updateAnnotation.mutate({ id, content, downloadId })}
                onDeleteAnnotation={(id) => deleteAnnotation.mutate({ id, downloadId })}
                onNoteClick={handleNoteClick}
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
              onBookmark={handleBookmark}
              hasBookmark={bookmarkStatus}
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

      {/* Sticky Notes Sidebar */}
      <StickyNotesSidebar
        notes={annotations.filter(a => a.type === 'sticky_note')}
        onNoteClick={handleNoteClick}
        onUpdateNote={(id, content) => updateAnnotation.mutate({ id, content, downloadId })}
        onDeleteNote={(id) => deleteAnnotation.mutate({ id, downloadId })}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-2xl hover:shadow-3xl transition-all"
          size="icon"
          data-testid="button-scroll-to-top"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
