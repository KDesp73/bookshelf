import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { findBookById } from "@/lib/books/queries";
import { BookEditForm } from "@/components/books/book-edit-form";

interface EditBookPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user?.id) {
    redirect("/login?callbackUrl=/books/" + id + "/edit");
  }

  if (!user.username) {
    redirect("/onboarding");
  }

  let book;
  try {
    book = await findBookById(id, user.id);
  } catch {
    // db error
  }

  if (!book) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-3 sm:p-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
          Edit Book
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {book.title}
        </p>
      </div>
      <BookEditForm book={book} />
    </div>
  );
}
