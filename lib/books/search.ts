export interface SearchResult {
  isbn13: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  publishYear: number | null;
  description: string | null;
  pageCount: number | null;
  source: "openlibrary" | "google";
  openLibraryWorkKey: string | null;
  googleVolumeId: string | null;
  subtitle: string | null;
  publisher: string | null;
}

const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "BookShelf/1.0 (personal library app; contact: local)",
};

function deduplicate(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.isbn13 ?? `${r.title}|${r.authors.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`,
      { next: { revalidate: 300 }, headers: OPEN_LIBRARY_HEADERS },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      docs?: Array<{
        title?: string;
        subtitle?: string;
        author_name?: string[];
        first_publish_year?: number;
        number_of_pages_median?: number;
        cover_i?: number;
        isbn?: string[];
        key?: string;
        publisher?: string[];
        subject?: string[];
      }>;
    };

    if (!data.docs?.length) return [];

    return data.docs.map((doc): SearchResult => {
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : null;

      const isbn = doc.isbn?.find((i) => i.length === 13) ?? doc.isbn?.[0] ?? null;

      return {
        isbn13: isbn,
        title: doc.title ?? "",
        subtitle: doc.subtitle ?? null,
        authors: doc.author_name ?? [],
        coverUrl,
        publishYear: doc.first_publish_year ?? null,
        description: null,
        pageCount: doc.number_of_pages_median ?? null,
        source: "openlibrary",
        openLibraryWorkKey: doc.key ? `https://openlibrary.org${doc.key}` : null,
        googleVolumeId: null,
        publisher: doc.publisher?.[0] ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : "";
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20${keyParam}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      items?: Array<{
        id?: string;
        volumeInfo?: {
          title?: string;
          subtitle?: string;
          authors?: string[];
          publisher?: string;
          publishedDate?: string;
          description?: string;
          pageCount?: number;
          imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            thumbnail?: string;
            smallThumbnail?: string;
          };
          industryIdentifiers?: Array<{
            type?: string;
            identifier?: string;
          }>;
        };
      }>;
    };

    if (!data.items?.length) return [];

    const results: SearchResult[] = [];

    for (const item of data.items) {
      const info = item.volumeInfo;
      if (!info?.title) continue;

      const links = info.imageLinks;
      const coverUrl =
        links?.extraLarge ??
        links?.large ??
        links?.medium ??
        links?.thumbnail?.replace("http:", "https:") ??
        links?.smallThumbnail?.replace("http:", "https:") ??
        null;

      const cleanCover = coverUrl?.replace("&edge=curl", "") ?? null;

      const isbn =
        info.industryIdentifiers?.find(
          (id) => id.type === "ISBN_13",
        )?.identifier ??
        info.industryIdentifiers?.find((id) => id.type === "ISBN_10")?.identifier ??
        null;

      const publishYear = info.publishedDate
        ? parseInt(info.publishedDate.slice(0, 4), 10)
        : null;

      results.push({
        isbn13: isbn,
        title: info.title,
        subtitle: info.subtitle ?? null,
        authors: info.authors ?? [],
        coverUrl: cleanCover,
        publishYear,
        description: info.description ?? null,
        pageCount: info.pageCount ?? null,
        source: "google",
        openLibraryWorkKey: null,
        googleVolumeId: item.id ?? null,
        publisher: info.publisher ?? null,
      });
    }

    return results;
  } catch {
    return [];
  }
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const [olResults, gbResults] = await Promise.all([
    searchOpenLibrary(trimmed),
    searchGoogleBooks(trimmed),
  ]);

  return deduplicate([...olResults, ...gbResults]);
}
