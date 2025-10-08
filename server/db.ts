import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database in the project root
const dbPath = join(__dirname, '..', 'kora.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      abstract TEXT,
      authors TEXT, -- JSON array
      source TEXT NOT NULL,
      source_url TEXT,
      category TEXT,
      images TEXT, -- JSON array
      created_at INTEGER NOT NULL
    )
  `);

  // Downloads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      abstract TEXT,
      authors TEXT, -- JSON array
      source TEXT NOT NULL,
      source_url TEXT,
      category TEXT,
      thumbnail TEXT,
      images TEXT, -- JSON array
      downloaded_at INTEGER NOT NULL
    )
  `);

  // Highlights table
  db.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      download_id TEXT NOT NULL,
      text TEXT NOT NULL,
      color TEXT NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE
    )
  `);

  // Bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      download_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      label TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE
    )
  `);

  // Thoughts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS thoughts (
      id TEXT PRIMARY KEY,
      download_id TEXT NOT NULL,
      highlight_id TEXT,
      text TEXT NOT NULL,
      highlighted_text TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE,
      FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
    )
  `);

  // Annotations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      download_id TEXT NOT NULL,
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      content TEXT,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE
    )
  `);

  // User preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'default',
      font_family TEXT NOT NULL DEFAULT 'sans',
      updated_at INTEGER NOT NULL
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_downloads_title ON downloads(title);
    CREATE INDEX IF NOT EXISTS idx_highlights_download ON highlights(download_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_download ON bookmarks(download_id);
    CREATE INDEX IF NOT EXISTS idx_thoughts_download ON thoughts(download_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_download ON annotations(download_id);
  `);
}

// Initialize on import
initializeDatabase();
