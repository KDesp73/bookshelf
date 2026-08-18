export const OPEN_LIBRARY_BASE = "https://openlibrary.org";
export const OPEN_LIBRARY_COVERS_BASE = "https://covers.openlibrary.org";

export const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "BookShelf/1.0 (personal library app; contact: local)",
};

export function openLibraryCoverUrl(coverId: number): string {
  return `${OPEN_LIBRARY_COVERS_BASE}/b/id/${coverId}-L.jpg`;
}
