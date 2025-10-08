import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import type { SearchSuggestion } from "@shared/schema";
import { 
  insertDownloadSchema, 
  insertHighlightSchema, 
  insertBookmarkSchema,
  insertThoughtSchema,
  insertAnnotationSchema,
  insertUserPreferencesSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Search API - Semantic Scholar + Wikipedia
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const suggestions: SearchSuggestion[] = [];

      // Check local downloads first
      const localDownloads = await storage.searchDownloads(q);
      localDownloads.forEach(download => {
        suggestions.push({
          id: download.id,
          title: download.title,
          source: download.source,
          isDownloaded: true,
        });
      });

      // Search PubMed (NCBI E-Utilities)
      try {
        const pubmedResponse = await axios.get(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`,
          {
            params: { 
              db: 'pubmed', 
              term: q, 
              retmode: 'json', 
              retmax: 10 
            },
            timeout: 5000,
          }
        );

        if (pubmedResponse.data?.esearchresult?.idlist) {
          const pmids = pubmedResponse.data.esearchresult.idlist.slice(0, 5);
          
          if (pmids.length > 0) {
            const fetchResponse = await axios.get(
              `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi`,
              {
                params: { 
                  db: 'pubmed', 
                  id: pmids.join(','), 
                  retmode: 'json' 
                },
                timeout: 5000,
              }
            );

            if (fetchResponse.data?.result) {
              pmids.forEach((pmid: string) => {
                const paper = fetchResponse.data.result[pmid];
                if (paper && paper.title) {
                  const isDownloaded = localDownloads.some(d => d.title === paper.title);
                  if (!suggestions.find(s => s.title === paper.title)) {
                    suggestions.push({
                      id: pmid,
                      title: paper.title,
                      source: 'pubmed',
                      isDownloaded,
                    });
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('PubMed API error:', error);
      }

      // Search medRxiv/bioRxiv preprints
      if (suggestions.length < 5) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const medRxivResponse = await axios.get(
            `https://api.biorxiv.org/details/medrxiv/${monthAgo}/${today}/0`,
            { timeout: 5000 }
          );

          if (medRxivResponse.data?.collection) {
            const filtered = medRxivResponse.data.collection
              .filter((paper: any) => 
                paper.title.toLowerCase().includes(q.toLowerCase()) ||
                paper.abstract?.toLowerCase().includes(q.toLowerCase())
              )
              .slice(0, 3);

            filtered.forEach((paper: any) => {
              const isDownloaded = localDownloads.some(d => d.title === paper.title);
              if (!suggestions.find(s => s.title === paper.title)) {
                suggestions.push({
                  id: paper.doi,
                  title: paper.title,
                  source: 'medrxiv',
                  isDownloaded,
                });
              }
            });
          }
        } catch (error) {
          console.error('medRxiv API error:', error);
        }
      }

      // Search Semantic Scholar
      if (suggestions.length < 5) {
        try {
          const semanticResponse = await axios.get(
            `https://api.semanticscholar.org/graph/v1/paper/search`,
            {
              params: { query: q, limit: 5, fields: 'title,abstract,authors,url' },
              timeout: 5000,
            }
          );

          if (semanticResponse.data?.data) {
            semanticResponse.data.data.forEach((paper: any) => {
              const isDownloaded = localDownloads.some(d => d.title === paper.title);
              if (!suggestions.find(s => s.title === paper.title)) {
                suggestions.push({
                  id: paper.paperId || `semantic-${Date.now()}-${Math.random()}`,
                  title: paper.title,
                  source: 'semantic_scholar',
                  isDownloaded,
                });
              }
            });
          }
        } catch (error) {
          console.error('Semantic Scholar API error:', error);
        }
      }

      // Fallback to Wikipedia if not enough results
      if (suggestions.length < 3) {
        try {
          const wikiResponse = await axios.get(
            `https://en.wikipedia.org/w/api.php`,
            {
              params: {
                action: 'opensearch',
                search: q,
                limit: 5,
                namespace: 0,
                format: 'json',
              },
              timeout: 5000,
            }
          );

          if (wikiResponse.data && Array.isArray(wikiResponse.data[1])) {
            wikiResponse.data[1].forEach((title: string) => {
              const isDownloaded = localDownloads.some(d => d.title === title);
              if (!suggestions.find(s => s.title === title)) {
                suggestions.push({
                  id: `wiki-${Date.now()}-${Math.random()}`,
                  title,
                  source: 'wikipedia',
                  isDownloaded,
                });
              }
            });
          }
        } catch (error) {
          console.error('Wikipedia API error:', error);
        }
      }

      res.json({ suggestions });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Fetch article details
  app.get("/api/article/:source/:id", async (req, res) => {
    try {
      const { source, id } = req.params;
      const { title } = req.query;

      let articleData: any = null;

      if (source === 'pubmed') {
        // Fetch from PubMed
        const response = await axios.get(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`,
          {
            params: { 
              db: 'pubmed', 
              id, 
              retmode: 'xml', 
              rettype: 'abstract' 
            },
            timeout: 10000,
          }
        );

        // Parse XML to extract title, abstract, authors
        const xmlData = response.data;
        const titleMatch = xmlData.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
        const abstractMatch = xmlData.match(/<AbstractText.*?>([\s\S]*?)<\/AbstractText>/);
        const authorMatches = xmlData.match(/<Author.*?>([\s\S]*?)<\/Author>/g);
        
        const authors: string[] = [];
        if (authorMatches) {
          authorMatches.forEach((author: string) => {
            const lastNameMatch = author.match(/<LastName>(.*?)<\/LastName>/);
            const foreNameMatch = author.match(/<ForeName>(.*?)<\/ForeName>/);
            if (lastNameMatch && foreNameMatch) {
              authors.push(`${foreNameMatch[1]} ${lastNameMatch[1]}`);
            }
          });
        }

        if (titleMatch) {
          const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '') : 'No abstract available.';
          articleData = {
            title: titleMatch[1],
            content: abstract,
            abstract,
            authors,
            source: 'pubmed',
            sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            category: 'scientific',
            images: [],
          };
        }
      } else if (source === 'medrxiv') {
        // Fetch from medRxiv
        const response = await axios.get(
          `https://api.biorxiv.org/details/medrxiv/${id}`,
          { timeout: 10000 }
        );

        if (response.data?.collection?.[0]) {
          const paper = response.data.collection[0];
          const authors = paper.authors ? paper.authors.split(';').map((a: string) => a.trim()) : [];
          
          articleData = {
            title: paper.title,
            content: paper.abstract || 'No abstract available.',
            abstract: paper.abstract,
            authors,
            source: 'medrxiv',
            sourceUrl: `https://www.medrxiv.org/content/${paper.doi}`,
            category: 'preprint',
            images: [],
          };
        }
      } else if (source === 'semantic_scholar') {
        // Fetch from Semantic Scholar
        const response = await axios.get(
          `https://api.semanticscholar.org/graph/v1/paper/${id}`,
          {
            params: { fields: 'title,abstract,authors,url,openAccessPdf' },
            timeout: 10000,
          }
        );

        if (response.data) {
          const paper = response.data;
          articleData = {
            title: paper.title,
            content: paper.abstract || 'No content available.',
            abstract: paper.abstract,
            authors: paper.authors?.map((a: any) => a.name) || [],
            source: 'semantic_scholar',
            sourceUrl: paper.url,
            category: 'scientific',
            images: [],
          };
        }
      } else if (source === 'wikipedia') {
        // Fetch from Wikipedia
        const searchTitle = title || id;
        
        // Get page content
        const contentResponse = await axios.get(
          `https://en.wikipedia.org/w/api.php`,
          {
            params: {
              action: 'query',
              titles: searchTitle,
              prop: 'extracts|pageimages',
              exintro: true,
              explaintext: true,
              piprop: 'original',
              format: 'json',
            },
            timeout: 10000,
          }
        );

        const pages = contentResponse.data?.query?.pages;
        const pageId = Object.keys(pages || {})[0];
        
        if (pageId && pages[pageId]) {
          const page = pages[pageId];
          const images = page.original ? [{ url: page.original.source, caption: searchTitle }] : [];
          
          articleData = {
            title: page.title,
            content: page.extract || 'No content available.',
            abstract: page.extract?.substring(0, 200) + '...',
            authors: [],
            source: 'wikipedia',
            sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            category: 'general',
            images,
          };
        }
      }

      if (!articleData) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Save to articles table for caching
      const article = await storage.createArticle(articleData);
      
      res.json({ article });
    } catch (error) {
      console.error('Fetch article error:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Downloads
  app.get("/api/downloads", async (req, res) => {
    try {
      const downloads = await storage.getAllDownloads();
      res.json({ downloads });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch downloads' });
    }
  });

  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) {
        return res.status(404).json({ error: 'Download not found' });
      }
      res.json({ download });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch download' });
    }
  });

  app.post("/api/downloads", async (req, res) => {
    try {
      const validatedData = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(validatedData);
      res.json({ download });
    } catch (error) {
      res.status(400).json({ error: 'Invalid download data' });
    }
  });

  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      await storage.deleteDownload(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete download' });
    }
  });

  // Highlights
  app.get("/api/downloads/:id/highlights", async (req, res) => {
    try {
      const highlights = await storage.getHighlightsByDownload(req.params.id);
      res.json({ highlights });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch highlights' });
    }
  });

  app.post("/api/highlights", async (req, res) => {
    try {
      const validatedData = insertHighlightSchema.parse(req.body);
      const highlight = await storage.createHighlight(validatedData);
      res.json({ highlight });
    } catch (error) {
      res.status(400).json({ error: 'Invalid highlight data' });
    }
  });

  app.delete("/api/highlights/:id", async (req, res) => {
    try {
      await storage.deleteHighlight(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete highlight' });
    }
  });

  // Bookmarks
  app.get("/api/downloads/:id/bookmarks", async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarksByDownload(req.params.id);
      res.json({ bookmarks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(validatedData);
      res.json({ bookmark });
    } catch (error) {
      res.status(400).json({ error: 'Invalid bookmark data' });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      await storage.deleteBookmark(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete bookmark' });
    }
  });

  // Thoughts
  app.get("/api/downloads/:id/thoughts", async (req, res) => {
    try {
      const thoughts = await storage.getThoughtsByDownload(req.params.id);
      res.json({ thoughts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch thoughts' });
    }
  });

  app.post("/api/thoughts", async (req, res) => {
    try {
      const validatedData = insertThoughtSchema.parse(req.body);
      const thought = await storage.createThought(validatedData);
      res.json({ thought });
    } catch (error) {
      res.status(400).json({ error: 'Invalid thought data' });
    }
  });

  app.patch("/api/thoughts/:id", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text required' });
      }
      await storage.updateThought(req.params.id, text);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update thought' });
    }
  });

  app.delete("/api/thoughts/:id", async (req, res) => {
    try {
      await storage.deleteThought(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete thought' });
    }
  });

  // Annotations
  app.get("/api/downloads/:id/annotations", async (req, res) => {
    try {
      const annotations = await storage.getAnnotationsByDownload(req.params.id);
      res.json({ annotations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch annotations' });
    }
  });

  app.post("/api/annotations", async (req, res) => {
    try {
      const validatedData = insertAnnotationSchema.parse(req.body);
      const annotation = await storage.createAnnotation(validatedData);
      res.json({ annotation });
    } catch (error) {
      res.status(400).json({ error: 'Invalid annotation data' });
    }
  });

  app.patch("/api/annotations/:id", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content required' });
      }
      await storage.updateAnnotation(req.params.id, content);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update annotation' });
    }
  });

  app.delete("/api/annotations/:id", async (req, res) => {
    try {
      await storage.deleteAnnotation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete annotation' });
    }
  });

  // User Preferences
  app.get("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences();
      res.json({ preferences: preferences || { theme: 'default', fontFamily: 'sans' } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      const preferences = await storage.updateUserPreferences(validatedData);
      res.json({ preferences });
    } catch (error) {
      res.status(400).json({ error: 'Invalid preferences data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
