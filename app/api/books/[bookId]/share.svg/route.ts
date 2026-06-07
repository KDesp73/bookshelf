import { buildBookShareSvg } from "@/lib/social/book-share-svg";

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { bookId } = await context.params;
  const svg = await buildBookShareSvg(bookId);

  if (!svg) {
    return new Response("Book not found", { status: 404 });
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
