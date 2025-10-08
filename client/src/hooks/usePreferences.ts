import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserPreferences, InsertUserPreferences } from "@shared/schema";
import { useEffect } from "react";

export function usePreferences() {
  const query = useQuery<{ preferences: UserPreferences }>({
    queryKey: ['/api/preferences'],
  });

  // Apply preferences to document when loaded
  useEffect(() => {
    if (query.data?.preferences) {
      const { theme, fontFamily } = query.data.preferences;
      
      // Apply theme
      if (theme === 'glass') {
        document.documentElement.classList.add('glass-theme');
      } else {
        document.documentElement.classList.remove('glass-theme');
      }

      // Apply font
      const fontMap: Record<string, string> = {
        sans: 'Inter, sans-serif',
        serif: 'Crimson Text, serif',
        display: 'Playfair Display, serif',
        script: 'Dancing Script, cursive',
        body: 'Lora, serif',
        elegant: 'Cormorant Garamond, serif',
        reading: 'Merriweather, serif',
      };
      
      document.documentElement.style.setProperty(
        '--selected-font', 
        fontMap[fontFamily] || fontMap.sans
      );
    }
  }, [query.data]);

  return query;
}

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: async (data: InsertUserPreferences) => {
      return apiRequest('POST', '/api/preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    },
  });
}
