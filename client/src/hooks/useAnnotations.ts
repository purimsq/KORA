import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  Highlight, InsertHighlight,
  Bookmark, InsertBookmark,
  Thought, InsertThought,
  Annotation, InsertAnnotation,
} from "@shared/schema";

// Highlights
export function useHighlights(downloadId: string) {
  return useQuery<{ highlights: Highlight[] }>({
    queryKey: ['/api/downloads', downloadId, 'highlights'],
    enabled: !!downloadId,
  });
}

export function useCreateHighlight() {
  return useMutation({
    mutationFn: async (data: InsertHighlight) => {
      return apiRequest('POST', '/api/highlights', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'highlights'] 
      });
    },
  });
}

export function useDeleteHighlight() {
  return useMutation({
    mutationFn: async ({ id, downloadId }: { id: string; downloadId: string }) => {
      return apiRequest('DELETE', `/api/highlights/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'highlights'] 
      });
    },
  });
}

// Bookmarks
export function useBookmarks(downloadId: string) {
  return useQuery<{ bookmarks: Bookmark[] }>({
    queryKey: ['/api/downloads', downloadId, 'bookmarks'],
    enabled: !!downloadId,
  });
}

export function useCreateBookmark() {
  return useMutation({
    mutationFn: async (data: InsertBookmark) => {
      return apiRequest('POST', '/api/bookmarks', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'bookmarks'] 
      });
    },
  });
}

export function useDeleteBookmark() {
  return useMutation({
    mutationFn: async ({ id, downloadId }: { id: string; downloadId: string }) => {
      return apiRequest('DELETE', `/api/bookmarks/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'bookmarks'] 
      });
    },
  });
}

// Thoughts
export function useThoughts(downloadId: string) {
  return useQuery<{ thoughts: Thought[] }>({
    queryKey: ['/api/downloads', downloadId, 'thoughts'],
    enabled: !!downloadId,
  });
}

export function useCreateThought() {
  return useMutation({
    mutationFn: async (data: InsertThought) => {
      return apiRequest('POST', '/api/thoughts', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'thoughts'] 
      });
    },
  });
}

export function useUpdateThought() {
  return useMutation({
    mutationFn: async ({ id, text, downloadId }: { id: string; text: string; downloadId: string }) => {
      return apiRequest('PATCH', `/api/thoughts/${id}`, { text });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'thoughts'] 
      });
    },
  });
}

export function useDeleteThought() {
  return useMutation({
    mutationFn: async ({ id, downloadId }: { id: string; downloadId: string }) => {
      return apiRequest('DELETE', `/api/thoughts/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'thoughts'] 
      });
    },
  });
}

// Annotations
export function useAnnotations(downloadId: string) {
  return useQuery<{ annotations: Annotation[] }>({
    queryKey: ['/api/downloads', downloadId, 'annotations'],
    enabled: !!downloadId,
  });
}

export function useCreateAnnotation() {
  return useMutation({
    mutationFn: async (data: InsertAnnotation) => {
      return apiRequest('POST', '/api/annotations', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'annotations'] 
      });
    },
  });
}

export function useUpdateAnnotation() {
  return useMutation({
    mutationFn: async ({ id, content, downloadId }: { id: string; content: string; downloadId: string }) => {
      return apiRequest('PATCH', `/api/annotations/${id}`, { content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'annotations'] 
      });
    },
  });
}

export function useDeleteAnnotation() {
  return useMutation({
    mutationFn: async ({ id, downloadId }: { id: string; downloadId: string }) => {
      return apiRequest('DELETE', `/api/annotations/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/downloads', variables.downloadId, 'annotations'] 
      });
    },
  });
}
