interface ZenQuote {
  q: string;
  a: string;
  h: string;
}

interface DailyQuote {
  text: string;
  author: string;
}

export async function getDailyQuote(): Promise<DailyQuote | null> {
  try {
    const res = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data: ZenQuote[] = await res.json();
    const quote = data[0];
    if (!quote) return null;

    return { text: quote.q, author: quote.a };
  } catch {
    return null;
  }
}
