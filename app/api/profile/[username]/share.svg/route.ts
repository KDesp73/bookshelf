import { buildProfileShareSvg } from "@/lib/social/profile-share-svg";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { username } = await context.params;
  const svg = await buildProfileShareSvg(username);

  if (!svg) {
    return new Response("Profile not found", { status: 404 });
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
