import type { BookMetadata, BookPreview } from "@/types/book";
import { normalizeIsbn } from "@/lib/books/isbn";

type PartialMetadata = Partial<BookMetadata>;

export async function fetchBookByIsbn(
  rawIsbn: string,
): Promise<BookPreview | null> {
  const isbn13 = normalizeIsbn(rawIsbn);
  if (!isbn13) return null;

  const [openLibrary, google] = await Promise.all([
    fetchOpenLibrary(isbn13),
    fetchGoogleBooks(isbn13),
  ]);

  const merged = mergeMetadata(isbn13, openLibrary, google);
  if (!merged.title) return null;

  return {
    ...merged,
    isbn13,
    authors: merged.authors?.length ? merged.authors : ["Unknown Author"],
    source: "merged",
  };
}

async function fetchOpenLibrary(isbn13: string): Promise<PartialMetadata> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`,
      { next: { revalidate: 3600 } },
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
        };
      }>;
    };

    const info = data.items?.[0]?.volumeInfo;
    if (!info) return {};

    const links = info.imageLinks;
    const coverUrl =
      links?.extraLarge ??
      links?.large ??
      links?.medium ??
      links?.thumbnail?.replace("http:", "https:") ??
      links?.smallThumbnail?.replace("http:", "https:");

    return {
      title: info.title,
      subtitle: info.subtitle,
      authors: info.authors ?? [],
      publisher: info.publisher,
      publishedDate: info.publishedDate,
      description: info.description,
      pageCount: info.pageCount,
      coverUrl: coverUrl?.replace("&edge=curl", ""),
    };
  } catch {
    return {};
  }
}

function mergeMetadata(
  isbn13: string,
  openLibrary: PartialMetadata,
  google: PartialMetadata,
): BookMetadata {
  const pickCover = () => {
    const googleCover = google.coverUrl;
    const olCover = openLibrary.coverUrl;
    if (googleCover && isHigherRes(googleCover, olCover)) return googleCover;
    return olCover ?? googleCover;
  };

  return {
    isbn13,
    title: google.title ?? openLibrary.title ?? "",
    subtitle: google.subtitle ?? openLibrary.subtitle,
    authors:
      (google.authors?.length ? google.authors : openLibrary.authors) ?? [],
    publisher: google.publisher ?? openLibrary.publisher,
    publishedDate: google.publishedDate ?? openLibrary.publishedDate,
    description: google.description ?? openLibrary.description,
    pageCount: google.pageCount ?? openLibrary.pageCount,
    coverUrl: pickCover(),
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
