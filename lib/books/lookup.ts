import type { BookMetadata, BookPreview } from "@/types/book";
import { normalizeIsbn } from "@/lib/books/isbn";
import {
  buildGenres,
  mergeStringArrays,
  parsePublishYear,
} from "@/lib/books/metadata";

type PartialMetadata = Partial<BookMetadata>;

function parseOpenLibrarySubjects(
  subjects: Array<string | { name?: string }> | undefined,
): string[] {
  if (!subjects?.length) return [];
  return mergeStringArrays([
    subjects.map((item) =>
      typeof item === "string" ? item : (item.name ?? ""),
    ),
  ]);
}

async function fetchOpenLibraryWorkMetadata(
  workKey: string,
): Promise<Pick<PartialMetadata, "subjects" | "openLibraryWorkKey">> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`, {
      next: { revalidate: 3600 },
      headers: OPEN_LIBRARY_HEADERS,
    });
    if (!res.ok) return { openLibraryWorkKey: workKey };

    const data = (await res.json()) as {
      subjects?: Array<string | { name?: string }>;
    };

    const subjects = parseOpenLibrarySubjects(data.subjects);
    return {
      openLibraryWorkKey: workKey,
      ...(subjects.length ? { subjects } : {}),
    };
  } catch {
    return { openLibraryWorkKey: workKey };
  }
}

const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "BookShelf/1.0 (personal library app; contact: local)",
};

export async function fetchBookByIsbn(
  rawIsbn: string,
): Promise<BookPreview | null> {
  const isbn13 = normalizeIsbn(rawIsbn);
  if (!isbn13) return null;

  const fetchers: Array<() => Promise<PartialMetadata>> = [
    () => fetchOpenLibraryBibkeys(isbn13),
    () => fetchOpenLibraryEdition(isbn13),
    () => fetchOpenLibrarySearch(isbn13),
    () => fetchGoogleBooks(isbn13),
    () => fetchTheBookDb(isbn13),
    () => fetchIsbnDb(isbn13),
  ];

  const results = await Promise.all(fetchers.map((fn) => fn()));
  const merged = mergeMetadata(isbn13, results);
  if (!merged.title) return null;

  return {
    ...merged,
    isbn13,
    authors: merged.authors?.length ? merged.authors : ["Unknown Author"],
    source: "merged",
  };
}

async function fetchOpenLibraryBibkeys(
  isbn13: string,
): Promise<PartialMetadata> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`,
      { next: { revalidate: 3600 }, headers: OPEN_LIBRARY_HEADERS },
    );

    if (!res.ok) return {};

    const data = (await res.json()) as Record<
      string,
      {
        title?: string;
        subtitle?: string;
        authors?: Array<{ name: string }>;
        publishers?: Array<{ name: string }>;
        publish_date?: string;
        number_of_pages?: number;
        cover?: { large?: string; medium?: string; small?: string };
        notes?: string;
      }
    >;

    const entry = data[`ISBN:${isbn13}`];
    if (!entry) return {};

    const coverUrl =
      entry.cover?.large ??
      entry.cover?.medium ??
      upgradeOpenLibraryCover(entry.cover?.small);

    return {
      title: entry.title,
      subtitle: entry.subtitle,
      authors: entry.authors?.map((a) => a.name) ?? [],
      publisher: entry.publishers?.[0]?.name,
      publishedDate: entry.publish_date,
      pageCount: entry.number_of_pages,
      description: entry.notes,
      coverUrl,
    };
  } catch {
    return {};
  }
}

async function fetchOpenLibraryEdition(
  isbn13: string,
): Promise<PartialMetadata> {
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn13}.json`, {
      next: { revalidate: 3600 },
      headers: OPEN_LIBRARY_HEADERS,
    });

    if (!res.ok) return {};

    const data = (await res.json()) as {
      title?: string;
      subtitle?: string;
      publishers?: string[];
      publish_date?: string;
      number_of_pages?: number;
      description?: string | { value?: string };
      authors?: Array<{ key?: string }>;
      covers?: number[];
      works?: Array<{ key?: string }>;
      languages?: Array<{ key?: string }>;
    };

    const description =
      typeof data.description === "string"
        ? data.description
        : data.description?.value;

    let coverUrl: string | undefined;
    if (data.covers?.[0]) {
      coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
    }

    let authors: string[] = [];
    if (data.authors?.length) {
      const authorResults = await Promise.all(
        data.authors.slice(0, 5).map(async (a) => {
          if (!a.key) return null;
          try {
            const authorRes = await fetch(
              `https://openlibrary.org${a.key}.json`,
              { next: { revalidate: 3600 }, headers: OPEN_LIBRARY_HEADERS },
            );
            if (!authorRes.ok) return null;
            const authorData = (await authorRes.json()) as { name?: string };
            return authorData.name ?? null;
          } catch {
            return null;
          }
        }),
      );
      authors = authorResults.filter((n): n is string => Boolean(n));
    }

    const workKey = data.works?.[0]?.key;
    const workMeta = workKey
      ? await fetchOpenLibraryWorkMetadata(workKey)
      : {};

    const languageKey = data.languages?.[0]?.key;
    const language = languageKey?.replace(/^\/languages\//, "");

    return {
      title: data.title,
      subtitle: data.subtitle,
      authors,
      publisher: data.publishers?.[0],
      publishedDate: data.publish_date,
      pageCount: data.number_of_pages,
      description,
      coverUrl,
      publishYear: parsePublishYear(data.publish_date),
      ...(language ? { language } : {}),
      ...workMeta,
    };
  } catch {
    return {};
  }
}

async function fetchOpenLibrarySearch(
  isbn13: string,
): Promise<PartialMetadata> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?isbn=${isbn13}&limit=1`,
      { next: { revalidate: 3600 }, headers: OPEN_LIBRARY_HEADERS },
    );

    if (!res.ok) return {};

    const data = (await res.json()) as {
      docs?: Array<{
        title?: string;
        subtitle?: string;
        author_name?: string[];
        publisher?: string[];
        first_publish_year?: number;
        number_of_pages_median?: number;
        cover_i?: number;
        subject?: string[];
        language?: string[];
        key?: string;
      }>;
    };

    const doc = data.docs?.[0];
    if (!doc) return {};

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined;

    const subjects = mergeStringArrays([doc.subject]);
    const language = doc.language?.[0]?.replace(/^\/languages\//, "");

    return {
      title: doc.title,
      subtitle: doc.subtitle,
      authors: doc.author_name ?? [],
      publisher: doc.publisher?.[0],
      publishedDate: doc.first_publish_year?.toString(),
      pageCount: doc.number_of_pages_median,
      coverUrl,
      publishYear: doc.first_publish_year,
      ...(subjects.length ? { subjects } : {}),
      ...(language ? { language } : {}),
      ...(doc.key ? { openLibraryWorkKey: doc.key } : {}),
    };
  } catch {
    return {};
  }
}

function upgradeOpenLibraryCover(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace("-S.jpg", "-L.jpg").replace("-M.jpg", "-L.jpg");
}

async function fetchGoogleBooks(isbn13: string): Promise<PartialMetadata> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : "";
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}${keyParam}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return {};

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
          categories?: string[];
          language?: string;
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

    const item = data.items?.[0];
    const info = item?.volumeInfo;
    if (!info) return {};

    const links = info.imageLinks;
    const coverUrl =
      links?.extraLarge ??
      links?.large ??
      links?.medium ??
      links?.thumbnail?.replace("http:", "https:") ??
      links?.smallThumbnail?.replace("http:", "https:");

    const categories = mergeStringArrays([info.categories]);

    return {
      title: info.title,
      subtitle: info.subtitle,
      authors: info.authors ?? [],
      publisher: info.publisher,
      publishedDate: info.publishedDate,
      description: info.description,
      pageCount: info.pageCount,
      coverUrl: coverUrl?.replace("&edge=curl", ""),
      publishYear: parsePublishYear(info.publishedDate),
      ...(categories.length ? { categories } : {}),
      ...(info.language ? { language: info.language } : {}),
      ...(item.id ? { googleVolumeId: item.id } : {}),
    };
  } catch {
    return {};
  }
}

async function fetchTheBookDb(isbn13: string): Promise<PartialMetadata> {
  const apiKey = process.env.THEBOOKDB_API_KEY?.trim();
  if (!apiKey) return {};

  try {
    const res = await fetch(
      `https://api.thebookdb.net/?key=${encodeURIComponent(apiKey)}&isbn=${isbn13}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return {};

    const data = (await res.json()) as {
      book?: {
        title?: string;
        description?: string;
        image?: string;
        authors?: Array<{ name?: string }>;
        publisher?: string;
        date_published?: string;
        pages?: number;
      };
    };

    const book = data.book;
    if (!book) return {};

    return {
      title: book.title,
      description: book.description,
      authors: book.authors?.map((a) => a.name).filter(Boolean) as string[],
      publisher: book.publisher,
      publishedDate: book.date_published,
      pageCount: book.pages,
      coverUrl: book.image,
    };
  } catch {
    return {};
  }
}

async function fetchIsbnDb(isbn13: string): Promise<PartialMetadata> {
  const apiKey = process.env.ISBNDB_API_KEY?.trim();
  if (!apiKey) return {};

  try {
    const res = await fetch(`https://api2.isbndb.com/book/${isbn13}`, {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return {};

    const data = (await res.json()) as {
      book?: {
        title?: string;
        title_long?: string;
        authors?: string[];
        publisher?: string;
        date_published?: string;
        synopsis?: string;
        pages?: number;
        image?: string;
        subjects?: string[];
      };
    };

    const book = data.book;
    if (!book) return {};

    const subjects = mergeStringArrays([book.subjects]);

    return {
      title: book.title ?? book.title_long,
      authors: book.authors ?? [],
      publisher: book.publisher,
      publishedDate: book.date_published,
      description: book.synopsis,
      pageCount: book.pages,
      coverUrl: book.image,
      publishYear: parsePublishYear(book.date_published),
      ...(subjects.length ? { subjects } : {}),
    };
  } catch {
    return {};
  }
}

function mergeMetadata(
  isbn13: string,
  sources: PartialMetadata[],
): BookMetadata {
  const pick = <K extends keyof BookMetadata>(key: K): BookMetadata[K] | undefined => {
    for (const source of sources) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length === 0) continue;
        return value as BookMetadata[K];
      }
    }
    return undefined;
  };

  const pickAuthors = (): string[] => {
    for (const source of sources) {
      if (source.authors?.length) return source.authors;
    }
    return [];
  };

  const pickCover = (): string | undefined => {
    let best: string | undefined;
    for (const source of sources) {
      const cover = source.coverUrl;
      if (!cover) continue;
      if (!best || isHigherRes(cover, best)) best = cover;
    }
    return best;
  };

  const subjects = mergeStringArrays(sources.map((s) => s.subjects));
  const categories = mergeStringArrays(sources.map((s) => s.categories));
  const genres = buildGenres(subjects, categories);

  const publishYear =
    sources.find((s) => s.publishYear != null)?.publishYear ??
    parsePublishYear(pick("publishedDate"));

  return {
    isbn13,
    title: pick("title") ?? "",
    subtitle: pick("subtitle"),
    authors: pickAuthors(),
    publisher: pick("publisher"),
    publishedDate: pick("publishedDate"),
    description: pick("description"),
    pageCount: pick("pageCount"),
    coverUrl: pickCover(),
    ...(genres.length ? { genres } : {}),
    ...(subjects.length ? { subjects } : {}),
    ...(categories.length ? { categories } : {}),
    language: pick("language"),
    ...(publishYear ? { publishYear } : {}),
    openLibraryWorkKey: pick("openLibraryWorkKey"),
    googleVolumeId: pick("googleVolumeId"),
  };
}

function isHigherRes(a?: string, b?: string): boolean {
  if (!a) return false;
  if (!b) return true;
  const score = (url: string) => {
    if (url.includes("extraLarge") || url.includes("-L.")) return 3;
    if (url.includes("large") || url.includes("-M.")) return 2;
    return 1;
  };
  return score(a) >= score(b);
}
