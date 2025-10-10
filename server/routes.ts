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

      // Search Semantic Scholar
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

      // Search OpenAlex for scientific papers
      try {
        const openAlexResponse = await axios.get(
          `https://api.openalex.org/works`,
          {
            params: { 
              filter: `title.search:${q}`,
              per_page: 5,
              mailto: 'contact@example.com'
            },
            timeout: 10000,
          }
        );

        if (openAlexResponse.data?.results) {
          openAlexResponse.data.results.forEach((work: any) => {
            if (work.title) {
              const isDownloaded = localDownloads.some(d => d.title === work.title);
              if (!suggestions.find(s => s.title === work.title)) {
                suggestions.push({
                  id: work.id || `openalex-${Date.now()}-${Math.random()}`,
                  title: work.title,
                  source: 'openalex',
                  isDownloaded,
                });
              }
            }
          });
        }
      } catch (error) {
        // Silently continue without OpenAlex results if it fails
        console.error('OpenAlex API error (continuing without results):', error instanceof Error ? error.message : 'Unknown error');
      }

      // Search Wikidata for entities
      try {
        const wikidataResponse = await axios.get(
          `https://www.wikidata.org/w/api.php`,
          {
            params: {
              action: 'wbsearchentities',
              search: q,
              language: 'en',
              format: 'json',
              limit: 5,
            },
            timeout: 5000,
          }
        );

        if (wikidataResponse.data?.search) {
          wikidataResponse.data.search.forEach((entity: any) => {
            if (entity.label) {
              const title = `${entity.label}${entity.description ? ` - ${entity.description}` : ''}`;
              const isDownloaded = localDownloads.some(d => d.title === title);
              if (!suggestions.find(s => s.title === title)) {
                suggestions.push({
                  id: entity.id || `wikidata-${Date.now()}-${Math.random()}`,
                  title,
                  source: 'wikidata',
                  isDownloaded,
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Wikidata API error:', error);
      }

      // Search DuckDuckGo Instant Answers
      try {
        const ddgResponse = await axios.get(
          `https://api.duckduckgo.com/`,
          {
            params: {
              q,
              format: 'json',
              no_html: 1,
              skip_disambig: 1,
            },
            timeout: 5000,
          }
        );

        if (ddgResponse.data) {
          const ddgData = ddgResponse.data;
          
          // Add main result if available
          if (ddgData.AbstractText && ddgData.Heading) {
            const isDownloaded = localDownloads.some(d => d.title === ddgData.Heading);
            if (!suggestions.find(s => s.title === ddgData.Heading)) {
              suggestions.push({
                id: `ddg-main-${Date.now()}`,
                title: ddgData.Heading,
                source: 'duckduckgo',
                isDownloaded,
              });
            }
          }

          // Add related topics
          if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
            ddgData.RelatedTopics.slice(0, 3).forEach((topic: any) => {
              if (topic.Text && topic.FirstURL) {
                const title = topic.Text.split(' - ')[0];
                const isDownloaded = localDownloads.some(d => d.title === title);
                if (!suggestions.find(s => s.title === title)) {
                  suggestions.push({
                    id: `ddg-${Date.now()}-${Math.random()}`,
                    title,
                    source: 'duckduckgo',
                    isDownloaded,
                  });
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('DuckDuckGo API error:', error);
      }

      // Search Open Library for books
      try {
        const openLibResponse = await axios.get(
          `https://openlibrary.org/search.json`,
          {
            params: { q, limit: 5 },
            timeout: 5000,
          }
        );

        if (openLibResponse.data?.docs) {
          openLibResponse.data.docs.forEach((book: any) => {
            if (book.title) {
              const title = `${book.title}${book.author_name ? ` by ${book.author_name[0]}` : ''}`;
              const isDownloaded = localDownloads.some(d => d.title === title);
              if (!suggestions.find(s => s.title === title)) {
                suggestions.push({
                  id: book.key || `openlib-${Date.now()}-${Math.random()}`,
                  title,
                  source: 'openlibrary',
                  isDownloaded,
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Open Library API error:', error);
      }

      // Search Wikipedia
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

      res.json({ suggestions });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Fetch article details - use wildcard to handle IDs with slashes
  app.get("/api/article/:source/*", async (req, res) => {
    try {
      const { source } = req.params;
      // Get the ID from the wildcard path (everything after :source/)
      const id = (req.params as any)[0];
      const titleParam = req.query.title;
      const title = typeof titleParam === 'string' ? titleParam : undefined;

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
        // Fetch from medRxiv - id is the DOI
        const response = await axios.get(
          `https://api.biorxiv.org/details/medrxiv/${encodeURIComponent(id)}`,
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
      } else if (source === 'openalex') {
        // Fetch from OpenAlex - id is URL-decoded by Express
        const openAlexId = id.startsWith('http') ? id : id.startsWith('W') ? `https://api.openalex.org/works/${id}` : `https://api.openalex.org/works/${id}`;
        const response = await axios.get(
          openAlexId,
          {
            params: { mailto: 'contact@example.com' },
            timeout: 10000,
          }
        );

        if (response.data) {
          const work = response.data;
          articleData = {
            title: work.title || title || 'Untitled',
            content: work.abstract_inverted_index ? 
              Object.entries(work.abstract_inverted_index)
                .flatMap(([word, positions]: [string, any]) => 
                  (positions as number[]).map(pos => ({ word, pos }))
                )
                .sort((a, b) => a.pos - b.pos)
                .map(item => item.word)
                .join(' ') 
              : 'Full text not available.',
            abstract: work.abstract_inverted_index ? 
              Object.keys(work.abstract_inverted_index).slice(0, 30).join(' ') + '...' 
              : 'Abstract not available.',
            authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
            source: 'openalex',
            sourceUrl: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id,
            category: 'scientific',
            images: [],
          };
        }
      } else if (source === 'wikidata') {
        // Fetch from Wikidata
        const entityId = id.replace('wikidata-', '').split('-')[0];
        
        const response = await axios.get(
          `https://www.wikidata.org/w/api.php`,
          {
            params: {
              action: 'wbgetentities',
              ids: entityId,
              props: 'labels|descriptions|claims|sitelinks',
              languages: 'en',
              format: 'json',
            },
            timeout: 10000,
          }
        );

        if (response.data?.entities?.[entityId]) {
          const entity = response.data.entities[entityId];
          const label = entity.labels?.en?.value || 'Unknown';
          const description = entity.descriptions?.en?.value || '';
          
          // Build content from claims
          let content = description + '\n\n';
          
          // Get Wikipedia link if available
          let sourceUrl = `https://www.wikidata.org/wiki/${entityId}`;
          if (entity.sitelinks?.enwiki) {
            sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(entity.sitelinks.enwiki.title)}`;
          }
          
          // Get image if available
          const images: any[] = [];
          if (entity.claims?.P18) {
            const imageClaim = entity.claims.P18[0];
            if (imageClaim?.mainsnak?.datavalue?.value) {
              const imageFilename = imageClaim.mainsnak.datavalue.value.replace(/ /g, '_');
              const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFilename)}`;
              images.push({ url: imageUrl, caption: label });
            }
          }
          
          articleData = {
            title: label,
            content: content || description || 'No detailed information available.',
            abstract: description,
            authors: [],
            source: 'wikidata',
            sourceUrl,
            category: 'encyclopedia',
            images,
          };
        }
      } else if (source === 'duckduckgo') {
        // Fetch from DuckDuckGo
        const searchTitle = title || id.replace('ddg-main-', '').replace(/^ddg-\d+-[\d.]+$/, title || 'search');
        
        const response = await axios.get(
          `https://api.duckduckgo.com/`,
          {
            params: {
              q: searchTitle,
              format: 'json',
              no_html: 1,
              skip_disambig: 1,
            },
            timeout: 10000,
          }
        );

        if (response.data) {
          const ddgData = response.data;
          const images: any[] = [];
          
          // Get main image if available
          if (ddgData.Image && ddgData.Image.trim() !== '') {
            images.push({ url: ddgData.Image, caption: ddgData.Heading || searchTitle });
          }
          
          // Get images from related topics
          if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
            ddgData.RelatedTopics.slice(0, 5).forEach((topic: any) => {
              if (topic.Icon && topic.Icon.URL && topic.Icon.URL.trim() !== '' && !topic.Icon.URL.includes('spacer.gif')) {
                images.push({ 
                  url: topic.Icon.URL, 
                  caption: topic.Text ? topic.Text.split(' - ')[0] : searchTitle 
                });
              }
            });
          }
          
          let content = ddgData.AbstractText || '';
          
          // Add related topics as additional content
          if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
            content += '\n\n===Related Topics===\n\n';
            ddgData.RelatedTopics.slice(0, 10).forEach((topic: any) => {
              if (topic.Text) {
                content += topic.Text + '\n\n';
              }
            });
          }
          
          articleData = {
            title: ddgData.Heading || searchTitle,
            content: content || 'No content available.',
            abstract: ddgData.AbstractText?.substring(0, 200) + '...' || '',
            authors: [],
            source: 'duckduckgo',
            sourceUrl: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(searchTitle)}`,
            category: 'general',
            images,
          };
        }
      } else if (source === 'openlibrary') {
        // Fetch from Open Library - id is URL-decoded by Express
        const bookKey = id.startsWith('/works/') ? id : id.startsWith('OL') ? `/works/${id}` : id;
        
        const response = await axios.get(
          `https://openlibrary.org${bookKey}.json`,
          { timeout: 10000 }
        );

        if (response.data) {
          const book = response.data;
          const images: any[] = [];
          
          // Get book cover
          if (book.covers && book.covers[0]) {
            images.push({ 
              url: `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`,
              caption: book.title 
            });
          }
          
          let content = book.description;
          if (typeof content === 'object' && content.value) {
            content = content.value;
          }
          
          // Add book details
          if (!content) content = '';
          if (book.first_publish_date) {
            content += `\n\n===Publication===\nFirst published: ${book.first_publish_date}`;
          }
          if (book.subjects) {
            content += `\n\n===Subjects===\n${book.subjects.slice(0, 10).join(', ')}`;
          }
          
          articleData = {
            title: book.title || title || 'Untitled',
            content: content || 'No description available.',
            abstract: typeof book.description === 'string' ? 
              book.description.substring(0, 200) + '...' : 
              'No description available.',
            authors: book.authors?.map((a: any) => a.name || a.author?.name).filter(Boolean) || [],
            source: 'openlibrary',
            sourceUrl: `https://openlibrary.org${bookKey}`,
            category: 'literature',
            images,
          };
        }
      } else if (source === 'wikipedia') {
        // Fetch from Wikipedia
        const searchTitle = title || id.replace('wiki-', '').replace(/\d+-[\d.]+$/, title || 'search');
        
        // Get page content with all images
        const contentResponse = await axios.get(
          `https://en.wikipedia.org/w/api.php`,
          {
            params: {
              action: 'query',
              titles: searchTitle,
              prop: 'extracts|images|pageimages',
              explaintext: true,
              pithumbsize: 500,
              format: 'json',
            },
            timeout: 10000,
          }
        );

        const pages = contentResponse.data?.query?.pages;
        const pageId = Object.keys(pages || {})[0];
        
        if (pageId && pages[pageId]) {
          const page = pages[pageId];
          const images: any[] = [];
          
          // Get all images from the page
          if (page.images && Array.isArray(page.images)) {
            for (const img of page.images.slice(0, 10)) {
              try {
                const imgResponse = await axios.get(
                  `https://en.wikipedia.org/w/api.php`,
                  {
                    params: {
                      action: 'query',
                      titles: img.title,
                      prop: 'imageinfo',
                      iiprop: 'url',
                      format: 'json',
                    },
                    timeout: 5000,
                  }
                );
                
                const imgPages = imgResponse.data?.query?.pages;
                const imgPageId = Object.keys(imgPages || {})[0];
                if (imgPageId && imgPages[imgPageId]?.imageinfo?.[0]?.url) {
                  const url = imgPages[imgPageId].imageinfo[0].url;
                  // Filter out icons and small images
                  if (!url.includes('Icon') && !url.includes('icon') && !url.endsWith('.svg')) {
                    images.push({ url, caption: img.title.replace('File:', '') });
                  }
                }
              } catch (imgError) {
                console.error('Error fetching image:', imgError);
              }
            }
          }
          
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
