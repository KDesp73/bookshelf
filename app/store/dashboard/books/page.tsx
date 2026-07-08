import { getSessionUser } from "@/lib/auth/get-session-user";
import { getStoreBooks } from "@/lib/store/queries";
import { redirect } from "next/navigation";
import { StoreBooksClient } from "@/components/store/store-books-client";

export default async function StoreBooksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/store/dashboard");
  if (!user.isStore) redirect("/");

  const books = await getStoreBooks(user.id);

  return <StoreBooksClient books={books} />;
}
