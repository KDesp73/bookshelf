"use server";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { fetchCoverOptions } from "@/lib/books/covers";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function fetchStoreCoverOptionsAction(input: {
  title: string;
  authors: string[];
  isbn13?: string;
  initialCoverUrl?: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof fetchCoverOptions>>>> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Sign in required." };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "Title is required to search for covers." };
  }

  if (!input.authors?.length) {
    return { success: false, error: "At least one author is required." };
  }

  try {
    const options = await fetchCoverOptions({
      title: input.title.trim(),
      authors: input.authors.filter(Boolean),
      isbn13: input.isbn13?.trim(),
      initialCoverUrl: input.initialCoverUrl?.trim(),
    });
    return { success: true, data: options };
  } catch {
    return { success: false, error: "Could not load cover options." };
  }
}
