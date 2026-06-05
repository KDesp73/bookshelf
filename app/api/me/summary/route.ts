import { getSessionUser } from "@/lib/auth/get-session-user";

export async function GET(): Promise<Response> {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      avatarType: user.avatarType,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
