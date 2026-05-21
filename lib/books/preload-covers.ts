const PRELOAD_CONCURRENCY = 6;

function preloadOne(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Warm the browser cache for cover URLs (deduped, limited concurrency). */
export async function preloadCoverUrls(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return;

  let index = 0;
  const workers = Array.from(
    { length: Math.min(PRELOAD_CONCURRENCY, unique.length) },
    async () => {
      while (index < unique.length) {
        const url = unique[index++];
        await preloadOne(url);
      }
    },
  );

  await Promise.all(workers);
}
