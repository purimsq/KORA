import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BackgroundDecorations } from "@/components/BackgroundDecorations";
import { PulseAnimation } from "@/components/PulseAnimation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/hooks/useSearch";
import { useCreateDownload } from "@/hooks/useDownloads";
import type { SearchSuggestion } from "@shared/schema";
import { saveSearchToHistory } from "@/lib/searchHistory";

export default function SearchPage() {
  const [query, setQuery] = useState(() => {
    return sessionStorage.getItem('searchQuery') || "";
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(() => {
    const saved = sessionStorage.getItem('selectedSuggestion');
    return saved ? JSON.parse(saved) : null;
  });
  const [article, setArticle] = useState<any>(() => {
    const saved = sessionStorage.getItem('currentArticle');
    return saved ? JSON.parse(saved) : null;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [typedContent, setTypedContent] = useState(() => {
    const saved = sessionStorage.getItem('currentArticle');
    return saved ? JSON.parse(saved)?.content || "" : "";
  });
  
  const { toast } = useToast();
  const { data: searchData, isLoading: isSearching } = useSearch(query);
  const createDownload = useCreateDownload();

  // Persist state to sessionStorage
  useEffect(() => {
    if (query) {
      sessionStorage.setItem('searchQuery', query);
    } else {
      sessionStorage.removeItem('searchQuery');
    }
  }, [query]);

  useEffect(() => {
    if (selectedSuggestion) {
      sessionStorage.setItem('selectedSuggestion', JSON.stringify(selectedSuggestion));
    } else {
      sessionStorage.removeItem('selectedSuggestion');
    }
  }, [selectedSuggestion]);

  useEffect(() => {
    if (article) {
      sessionStorage.setItem('currentArticle', JSON.stringify(article));
    } else {
      sessionStorage.removeItem('currentArticle');
    }
  }, [article]);

  const fetchArticle = async (suggestion: SearchSuggestion) => {
    try {
      let data;
      
      // If already downloaded, load from downloads
      if (suggestion.isDownloaded) {
        const response = await fetch(`/api/downloads/${suggestion.id}`);
        data = await response.json();
        if (data.download) {
          data.article = data.download; // Normalize structure
        }
      } else {
        // Fetch from external source
        const response = await fetch(
          `/api/article/${suggestion.source}/${suggestion.id}?title=${encodeURIComponent(suggestion.title)}`
        );
        data = await response.json();
      }
      
      if (data.article) {
        setArticle(data.article);
        setIsTyping(true);
        
        // Typing animation
        const content = data.article.content;
        let index = 0;
        const typeInterval = setInterval(() => {
          if (index < content.length) {
            setTypedContent(content.substring(0, index + 1));
            index++;
          } else {
            clearInterval(typeInterval);
            setIsTyping(false);
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 2000);
          }
        }, 15); // 15ms per character

        return () => clearInterval(typeInterval);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch article",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    // Only clear article if it's a new search (not just clearing the search box)
    if (searchQuery.length === 0) {
      // Don't clear article when just clearing search
    } else {
      setArticle(null);
      setTypedContent("");
      setSelectedSuggestion(null);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSelectedSuggestion(suggestion);
    saveSearchToHistory(suggestion.title);
    fetchArticle(suggestion);
  };

  const handleDownload = () => {
    if (article) {
      createDownload.mutate(
        {
          title: article.title,
          content: article.content,
          abstract: article.abstract,
          authors: article.authors,
          source: article.source,
          sourceUrl: article.sourceUrl,
          category: article.category,
          thumbnail: article.images?.[0]?.url,
          images: article.images,
        },
        {
          onSuccess: () => {
            toast({
              title: "Article Downloaded",
              description: `"${article.title}" has been saved to your downloads.`,
            });
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to download article",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundDecorations />
      <PulseAnimation show={showPulse} />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Discover Medical Knowledge
            </h2>
            <p className="text-lg text-muted-foreground">
              Search, download, and annotate scientific articles
            </p>
          </div>

          <div className="mb-12">
            <SearchBar 
              onSearch={handleSearch}
              onSuggestionClick={handleSuggestionClick}
              suggestions={searchData?.suggestions || []}
              isLoading={isSearching}
              initialQuery={query}
            />
          </div>

          {article && (
            <Card className="p-8 shadow-xl animate-fade-in" data-testid="article-display">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-foreground article-font" data-testid="text-article-title">
                  {article.title}
                </h1>
                <Button 
                  onClick={handleDownload}
                  disabled={createDownload.isPending}
                  className="gap-2 shrink-0"
                  data-testid="button-download-article"
                >
                  <Download className="w-4 h-4" />
                  {createDownload.isPending ? 'Saving...' : 'Download'}
                </Button>
              </div>

              {article.authors && article.authors.length > 0 && (
                <p className="text-muted-foreground mb-4">
                  By {article.authors.join(', ')}
                </p>
              )}

              <div className="prose prose-lg max-w-none article-font space-y-6">
                {article.images && article.images.length > 0 && (
                  <div className="float-right ml-6 mb-4 w-full sm:w-1/2 animate-fade-in">
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
                <p data-testid="text-article-content">
                  {isTyping ? typedContent : article.content}
                </p>
                {article.images && article.images.length > 1 && (
                  <div className="space-y-4 clear-both">
                    {article.images.slice(1).map((img: any, index: number) => (
                      <div key={index + 1} className="animate-fade-in">
                        <img 
                          src={img.url} 
                          alt={img.caption || article.title}
                          className="w-full rounded-lg shadow-md"
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
                    View Source
                  </a>
                </div>
              )}
            </Card>
          )}

          {!article && !isSearching && !selectedSuggestion && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                Start by searching for a medical topic above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
