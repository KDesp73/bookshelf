import { buildBookSharePng } from "@/lib/social/book-share-svg";

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { bookId } = await context.params;
  const png = await buildBookSharePng(bookId);

  if (!png) {
    return new Response("Book not found", { status: 404 });
  }

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
