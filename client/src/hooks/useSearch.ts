import { useQuery } from "@tanstack/react-query";
import type { SearchResponse } from "@shared/schema";

export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ['/api/search', query],
    enabled: query.length > 2,
    staleTime: 30000,
  });
}

export function useArticle(source: string, id: string, title?: string) {
  return useQuery({
    queryKey: ['/api/article', source, id, title],
    enabled: !!source && !!id,
  });
}
