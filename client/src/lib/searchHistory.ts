const MAX_HISTORY_ITEMS = 10;
const HISTORY_KEY = 'search_history';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function saveSearchToHistory(query: string) {
  if (!query.trim()) return;
  
  try {
    const history = getSearchHistory();
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };
    
    // Remove duplicates and add new item at the beginning
    const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}
