export interface CoverOption {
  url: string;
  source: string;
  label?: string;
}

const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "BookShelf/1.0 (personal library app; contact: local)",
};

function normalizeCoverUrl(url: string): string {
  return url
    .trim()
    .replace(/^http:/, "https:")
    .replace("&edge=curl", "")
    .replace("-S.jpg", "-L.jpg")
    .replace("-M.jpg", "-L.jpg");
}

function coverDedupeKey(url: string): string {
  const ol = url.match(/covers\.openlibrary\.org\/b\/id\/(\d+)/i);
  if (ol) return `ol:${ol[1]}`;
  return normalizeCoverUrl(url).split("?")[0] ?? url;
}

function addCover(
  options: CoverOption[],
  seen: Set<string>,
  candidate: CoverOption,
): void {
  if (!candidate.url) return;
  const url = normalizeCoverUrl(candidate.url);
  const key = coverDedupeKey(url);
  if (seen.has(key)) return;
  seen.add(key);
  options.push({ ...candidate, url });
}

function openLibraryCoverUrl(coverId: number): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

async function fetchOpenLibraryIsbnCovers(
  isbn13: string,
  options: CoverOption[],
  seen: Set<string>,
): Promise<void> {
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn13}.json`, {
      next: { revalidate: 3600 },
      headers: OPEN_LIBRARY_HEADERS,
    });
    if (!res.ok) return;

    const data = (await res.json()) as {
      covers?: number[];
      publishers?: string[];
      publish_date?: string;
    };

    const label = [data.publishers?.[0], data.publish_date]
      .filter(Boolean)
      .join(" · ");

    for (const coverId of data.covers ?? []) {
      addCover(options, seen, {
        url: openLibraryCoverUrl(coverId),
        source: "Open Library",
        label: label || "This ISBN edition",
      });
    }
  } catch {
    // ignore
  }
}

async function fetchOpenLibrarySearchCovers(
  title: string,
  authors: string[],
  options: CoverOption[],
  seen: Set<string>,
): Promise<void> {
  const primaryAuthor = authors[0]?.trim();
  if (!title.trim() || !primaryAuthor) return;

  try {
    const params = new URLSearchParams({
      title: title.trim(),
      author: primaryAuthor,
      limit: "25",
      fields: "title,author_name,cover_i,publisher,first_publish_year",
    });

    const res = await fetch(
      `https://openlibrary.org/search.json?${params}`,
      { next: { revalidate: 3600 }, headers: OPEN_LIBRARY_HEADERS },
    );
    if (!res.ok) return;

    const data = (await res.json()) as {
      docs?: Array<{
        title?: string;
        cover_i?: number;
        publisher?: string[];
        first_publish_year?: number;
      }>;
    };

    for (const doc of data.docs ?? []) {
      if (!doc.cover_i) continue;
      const label = [
        doc.publisher?.[0],
        doc.first_publish_year?.toString(),
        doc.title !== title.trim() ? doc.title : undefined,
      ]
        .filter(Boolean)
        .join(" · ");

      addCover(options, seen, {
        url: openLibraryCoverUrl(doc.cover_i),
        source: "Open Library",
        label: label || undefined,
      });
    }
  } catch {
    // ignore
  }
}

async function fetchGoogleBooksCovers(
  title: string,
  authors: string[],
  isbn13: string | undefined,
  options: CoverOption[],
  seen: Set<string>,
): Promise<void> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";

  const queries: string[] = [];
  const primaryAuthor = authors[0]?.trim();
  if (title.trim() && primaryAuthor) {
    queries.push(
      encodeURIComponent(`intitle:${title.trim()} inauthor:${primaryAuthor}`),
    );
  }
  if (isbn13) {
    queries.push(encodeURIComponent(`isbn:${isbn13}`));
  }

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=20${keyParam}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) continue;

      const data = (await res.json()) as {
        items?: Array<{
          volumeInfo?: {
            title?: string;
            authors?: string[];
            publisher?: string;
            publishedDate?: string;
            imageLinks?: {
              extraLarge?: string;
              large?: string;
              medium?: string;
              thumbnail?: string;
              smallThumbnail?: string;
            };
          };
        }>;
      };

      for (const item of data.items ?? []) {
        const info = item.volumeInfo;
        if (!info) continue;

        const links = info.imageLinks;
        const url =
          links?.extraLarge ??
          links?.large ??
          links?.medium ??
          links?.thumbnail ??
          links?.smallThumbnail;

        if (!url) continue;

        const label = [info.publisher, info.publishedDate, info.title]
          .filter(Boolean)
          .join(" · ");

        addCover(options, seen, {
          url,
          source: "Google Books",
          label: label || undefined,
        });
      }
    } catch {
      // ignore
    }
  }
}

export async function fetchCoverOptions(input: {
  title: string;
  authors: string[];
  isbn13?: string;
  /** Pre-selected cover from ISBN lookup (shown first). */
  initialCoverUrl?: string;
}): Promise<CoverOption[]> {
  const options: CoverOption[] = [];
  const seen = new Set<string>();

  if (input.initialCoverUrl) {
    addCover(options, seen, {
      url: input.initialCoverUrl,
      source: "ISBN lookup",
      label: "Matched to your scan",
    });
  }

  await Promise.all([
    input.isbn13
      ? fetchOpenLibraryIsbnCovers(input.isbn13, options, seen)
      : Promise.resolve(),
    fetchOpenLibrarySearchCovers(input.title, input.authors, options, seen),
    fetchGoogleBooksCovers(
      input.title,
      input.authors,
      input.isbn13,
      options,
      seen,
    ),
  ]);

  return options.slice(0, 24);
}
