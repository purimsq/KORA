import { useQuery } from "@tanstack/react-query";
import type { SearchResponse } from "@shared/schema";

export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return await res.json();
    },
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
