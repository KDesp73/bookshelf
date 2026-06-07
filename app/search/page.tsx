import { BookSearch } from "@/components/books/book-search";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Add a book
        </h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Search by title, author, or keyword to find a book to add to your
          library.
        </p>
      </div>
      <BookSearch />
    </div>
  );
}
