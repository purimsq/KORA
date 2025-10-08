import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SearchSuggestion } from "@shared/schema";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
}

export function SearchBar({ onSearch, onSuggestionClick, suggestions = [], isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" data-testid="icon-search" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for medical topics..."
            value={query}
            onChange={handleQueryChange}
            className="pl-12 pr-12 h-14 text-base rounded-full border-2 focus-visible:ring-4 focus-visible:ring-primary/20 transition-all shadow-lg hover:shadow-xl"
            data-testid="input-search"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors hover-elevate rounded-full p-1"
              data-testid="button-clear-search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-xl border-2 animate-fade-in z-50" data-testid="suggestions-dropdown">
          <div className="p-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 rounded-lg hover-elevate active-elevate-2 transition-all group"
                data-testid={`suggestion-${suggestion.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {suggestion.title}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {suggestion.source.replace('_', ' ')}
                    </p>
                  </div>
                  {suggestion.isDownloaded && (
                    <Badge variant="secondary" className="shrink-0" data-testid={`badge-downloaded-${suggestion.id}`}>
                      Downloaded
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="absolute top-full mt-2 w-full">
          <Card className="p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin" data-testid="loading-spinner" />
              <p className="text-sm text-muted-foreground">Searching medical databases...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
