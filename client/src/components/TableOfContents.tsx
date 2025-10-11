import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableOfContentsProps {
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}

interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

export function TableOfContents({ content, isOpen, onToggle }: TableOfContentsProps) {

  // Extract headings from content
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Check for markdown-style headings
    if (trimmed.startsWith('# ')) {
      headings.push({ level: 1, text: trimmed.substring(2), id: `heading-${idx}` });
    } else if (trimmed.startsWith('## ')) {
      headings.push({ level: 2, text: trimmed.substring(3), id: `heading-${idx}` });
    } else if (trimmed.startsWith('### ')) {
      headings.push({ level: 3, text: trimmed.substring(4), id: `heading-${idx}` });
    }
    // Also check for text that looks like headings (short lines, possibly capitalized)
    else if (trimmed.length > 0 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && !trimmed.includes('.')) {
      headings.push({ level: 1, text: trimmed, id: `heading-${idx}` });
    }
  });

  const scrollToHeading = (text: string) => {
    const articleContent = document.querySelector('[data-testid="article-content"]');
    if (!articleContent) return;

    const walker = document.createTreeWalker(
      articleContent,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.includes(text)) {
        const parent = node.parentElement;
        if (parent) {
          parent.scrollIntoView({ behavior: 'smooth', block: 'start' });
          parent.classList.add('animate-pulse');
          setTimeout(() => {
            parent.classList.remove('animate-pulse');
          }, 1000);
          break;
        }
      }
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur border-l shadow-xl transition-all duration-300 z-40 ${
          isOpen ? 'w-80' : 'w-0'
        }`}
        data-testid="table-of-contents"
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Outline</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                data-testid="button-close-toc"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Headings list */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {headings.map((heading, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToHeading(heading.text)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                      heading.level === 1 ? 'font-semibold text-base' : 
                      heading.level === 2 ? 'pl-6 text-sm' : 
                      'pl-9 text-sm text-muted-foreground'
                    }`}
                    data-testid={`toc-item-${idx}`}
                  >
                    {heading.text}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </>
  );
}
