import { db } from './db';
import { randomUUID } from 'crypto';
import type {
  Article, InsertArticle,
  Download, InsertDownload,
  Highlight, InsertHighlight,
  Bookmark, InsertBookmark,
  Thought, InsertThought,
  Annotation, InsertAnnotation,
  UserPreferences, InsertUserPreferences,
} from '@shared/schema';

export interface IStorage {
  // Articles
  getArticle(id: string): Promise<Article | undefined>;
  searchArticlesByTitle(query: string): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;

  // Downloads
  getAllDownloads(): Promise<Download[]>;
  getDownload(id: string): Promise<Download | undefined>;
  searchDownloads(query: string): Promise<Download[]>;
  createDownload(download: InsertDownload): Promise<Download>;
  deleteDownload(id: string): Promise<void>;
  downloadExists(title: string): Promise<boolean>;

  // Highlights
  getHighlightsByDownload(downloadId: string): Promise<Highlight[]>;
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  deleteHighlight(id: string): Promise<void>;

  // Bookmarks
  getBookmarksByDownload(downloadId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;

  // Thoughts
  getThoughtsByDownload(downloadId: string): Promise<Thought[]>;
  createThought(thought: InsertThought): Promise<Thought>;
  updateThought(id: string, text: string): Promise<void>;
  deleteThought(id: string): Promise<void>;

  // Annotations
  getAnnotationsByDownload(downloadId: string): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: string, content: string): Promise<void>;
  deleteAnnotation(id: string): Promise<void>;

  // User Preferences
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
}

export class SQLiteStorage implements IStorage {
  // Articles
  async getArticle(id: string): Promise<Article | undefined> {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      authors: row.authors ? JSON.parse(row.authors) : null,
      images: row.images ? JSON.parse(row.images) : [],
      createdAt: new Date(row.created_at),
    };
  }

  async searchArticlesByTitle(query: string): Promise<Article[]> {
    const rows = db.prepare('SELECT * FROM articles WHERE title LIKE ? ORDER BY created_at DESC')
      .all(`%${query}%`) as any[];
    
    return rows.map(row => ({
      ...row,
      authors: row.authors ? JSON.parse(row.authors) : null,
      images: row.images ? JSON.parse(row.images) : [],
      createdAt: new Date(row.created_at),
    }));
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO articles (id, title, content, abstract, authors, source, source_url, category, images, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      article.title,
      article.content,
      article.abstract || null,
      article.authors ? JSON.stringify(article.authors) : null,
      article.source,
      article.sourceUrl || null,
      article.category || null,
      article.images ? JSON.stringify(article.images) : '[]',
      now
    );

    return this.getArticle(id) as Promise<Article>;
  }

  // Downloads
  async getAllDownloads(): Promise<Download[]> {
    const rows = db.prepare('SELECT * FROM downloads ORDER BY downloaded_at DESC').all() as any[];
    
    return rows.map(row => ({
      ...row,
      authors: row.authors ? JSON.parse(row.authors) : null,
      images: row.images ? JSON.parse(row.images) : [],
      downloadedAt: new Date(row.downloaded_at),
    }));
  }

  async getDownload(id: string): Promise<Download | undefined> {
    const row = db.prepare('SELECT * FROM downloads WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      authors: row.authors ? JSON.parse(row.authors) : null,
      images: row.images ? JSON.parse(row.images) : [],
      downloadedAt: new Date(row.downloaded_at),
    };
  }

  async searchDownloads(query: string): Promise<Download[]> {
    const rows = db.prepare('SELECT * FROM downloads WHERE title LIKE ? ORDER BY downloaded_at DESC')
      .all(`%${query}%`) as any[];
    
    return rows.map(row => ({
      ...row,
      authors: row.authors ? JSON.parse(row.authors) : null,
      images: row.images ? JSON.parse(row.images) : [],
      downloadedAt: new Date(row.downloaded_at),
    }));
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO downloads (id, title, content, abstract, authors, source, source_url, category, thumbnail, images, downloaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      download.title,
      download.content,
      download.abstract || null,
      download.authors ? JSON.stringify(download.authors) : null,
      download.source,
      download.sourceUrl || null,
      download.category || null,
      download.thumbnail || null,
      download.images ? JSON.stringify(download.images) : '[]',
      now
    );

    return this.getDownload(id) as Promise<Download>;
  }

  async deleteDownload(id: string): Promise<void> {
    db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
  }

  async downloadExists(title: string): Promise<boolean> {
    const row = db.prepare('SELECT id FROM downloads WHERE title = ?').get(title);
    return !!row;
  }

  // Highlights
  async getHighlightsByDownload(downloadId: string): Promise<Highlight[]> {
    const rows = db.prepare('SELECT * FROM highlights WHERE download_id = ? ORDER BY created_at')
      .all(downloadId) as any[];
    
    return rows.map(row => ({
      ...row,
      downloadId: row.download_id,
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      createdAt: new Date(row.created_at),
    }));
  }

  async createHighlight(highlight: InsertHighlight): Promise<Highlight> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO highlights (id, download_id, text, color, start_offset, end_offset, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, highlight.downloadId, highlight.text, highlight.color, highlight.startOffset, highlight.endOffset, now);

    const row = db.prepare('SELECT * FROM highlights WHERE id = ?').get(id) as any;
    return {
      ...row,
      downloadId: row.download_id,
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      createdAt: new Date(row.created_at),
    };
  }

  async deleteHighlight(id: string): Promise<void> {
    db.prepare('DELETE FROM highlights WHERE id = ?').run(id);
  }

  // Bookmarks
  async getBookmarksByDownload(downloadId: string): Promise<Bookmark[]> {
    const rows = db.prepare('SELECT * FROM bookmarks WHERE download_id = ? ORDER BY created_at')
      .all(downloadId) as any[];
    
    return rows.map(row => ({
      ...row,
      downloadId: row.download_id,
      createdAt: new Date(row.created_at),
    }));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO bookmarks (id, download_id, position, label, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, bookmark.downloadId, bookmark.position, bookmark.label || null, now);

    const row = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id) as any;
    return {
      ...row,
      downloadId: row.download_id,
      createdAt: new Date(row.created_at),
    };
  }

  async deleteBookmark(id: string): Promise<void> {
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  }

  // Thoughts
  async getThoughtsByDownload(downloadId: string): Promise<Thought[]> {
    const rows = db.prepare('SELECT * FROM thoughts WHERE download_id = ? ORDER BY created_at')
      .all(downloadId) as any[];
    
    return rows.map(row => ({
      ...row,
      downloadId: row.download_id,
      highlightId: row.highlight_id,
      highlightedText: row.highlighted_text,
      createdAt: new Date(row.created_at),
    }));
  }

  async createThought(thought: InsertThought): Promise<Thought> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO thoughts (id, download_id, highlight_id, text, highlighted_text, position, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      thought.downloadId,
      thought.highlightId || null,
      thought.text,
      thought.highlightedText,
      thought.position,
      now
    );

    const row = db.prepare('SELECT * FROM thoughts WHERE id = ?').get(id) as any;
    return {
      ...row,
      downloadId: row.download_id,
      highlightId: row.highlight_id,
      highlightedText: row.highlighted_text,
      createdAt: new Date(row.created_at),
    };
  }

  async updateThought(id: string, text: string): Promise<void> {
    db.prepare('UPDATE thoughts SET text = ? WHERE id = ?').run(text, id);
  }

  async deleteThought(id: string): Promise<void> {
    db.prepare('DELETE FROM thoughts WHERE id = ?').run(id);
  }

  // Annotations
  async getAnnotationsByDownload(downloadId: string): Promise<Annotation[]> {
    const rows = db.prepare('SELECT * FROM annotations WHERE download_id = ? ORDER BY created_at')
      .all(downloadId) as any[];
    
    return rows.map(row => ({
      ...row,
      downloadId: row.download_id,
      createdAt: new Date(row.created_at),
    }));
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const id = randomUUID();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO annotations (id, download_id, type, text, content, position, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      annotation.downloadId,
      annotation.type,
      annotation.text,
      annotation.content || null,
      annotation.position,
      now
    );

    const row = db.prepare('SELECT * FROM annotations WHERE id = ?').get(id) as any;
    return {
      ...row,
      downloadId: row.download_id,
      createdAt: new Date(row.created_at),
    };
  }

  async updateAnnotation(id: string, content: string): Promise<void> {
    db.prepare('UPDATE annotations SET content = ? WHERE id = ?').run(content, id);
  }

  async deleteAnnotation(id: string): Promise<void> {
    db.prepare('DELETE FROM annotations WHERE id = ?').run(id);
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    const row = db.prepare('SELECT * FROM user_preferences LIMIT 1').get() as any;
    if (!row) return undefined;
    
    return {
      ...row,
      fontFamily: row.font_family,
      updatedAt: new Date(row.updated_at),
    };
  }

  async updateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences();
    const now = Date.now();
    
    if (existing) {
      db.prepare(`
        UPDATE user_preferences
        SET theme = ?, font_family = ?, updated_at = ?
        WHERE id = ?
      `).run(prefs.theme, prefs.fontFamily, now, existing.id);
    } else {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO user_preferences (id, theme, font_family, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(id, prefs.theme, prefs.fontFamily, now);
    }

    return this.getUserPreferences() as Promise<UserPreferences>;
  }
}

export const storage = new SQLiteStorage();
