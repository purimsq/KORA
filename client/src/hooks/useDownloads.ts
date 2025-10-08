import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Download, InsertDownload } from "@shared/schema";

export function useDownloads() {
  return useQuery<{ downloads: Download[] }>({
    queryKey: ['/api/downloads'],
  });
}

export function useDownload(id: string) {
  return useQuery<{ download: Download }>({
    queryKey: ['/api/downloads', id],
    enabled: !!id,
  });
}

export function useCreateDownload() {
  return useMutation({
    mutationFn: async (data: InsertDownload) => {
      return apiRequest('POST', '/api/downloads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/search'] });
    },
  });
}

export function useDeleteDownload() {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/downloads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
    },
  });
}
