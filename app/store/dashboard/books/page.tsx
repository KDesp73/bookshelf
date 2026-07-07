import { getStoreFromSession } from "@/lib/store/auth";
import { getStoreBooks } from "@/lib/store/queries";
import { redirect } from "next/navigation";
import { StoreBooksClient } from "@/components/store/store-books-client";

export default async function StoreBooksPage() {
  const store = await getStoreFromSession();
  if (!store) redirect("/store/login");

  const books = await getStoreBooks(store._id);

  return <StoreBooksClient books={books} />;
}
