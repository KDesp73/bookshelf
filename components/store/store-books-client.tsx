"use client";

import { useState } from "react";
import { deleteStoreBookAction } from "@/actions/store-books";
import type { StoreBookDocument } from "@/types/store";
import { StoreBookForm } from "@/components/store/store-book-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StoreBooksClientProps {
  books: StoreBookDocument[];
}

export function StoreBooksClient({ books }: StoreBooksClientProps) {
  const [editingBook, setEditingBook] = useState<StoreBookDocument | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleDelete(bookId: string) {
    if (!confirm("Delete this book?")) return;
    await deleteStoreBookAction(bookId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Books ({books.length})</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button size="sm">Add book</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a book</DialogTitle>
            </DialogHeader>
            <StoreBookForm onDone={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-stone-500">
          No books yet. Add your first book to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left dark:border-stone-700">
                <th className="pb-2 pr-4 font-medium text-stone-600 dark:text-stone-400">Title</th>
                <th className="pb-2 pr-4 font-medium text-stone-600 dark:text-stone-400">Author</th>
                <th className="pb-2 pr-4 font-medium text-stone-600 dark:text-stone-400">Price</th>
                <th className="pb-2 pr-4 font-medium text-stone-600 dark:text-stone-400">Qty</th>
                <th className="pb-2 font-medium text-stone-600 dark:text-stone-400" />
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="py-2 pr-4">{book.title}</td>
                  <td className="py-2 pr-4 text-stone-500">{book.author}</td>
                  <td className="py-2 pr-4">${book.price.toFixed(2)}</td>
                  <td className="py-2 pr-4">{book.quantity}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setEditingBook(book)}
                            className="text-xs text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                          >
                            Edit
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit book</DialogTitle>
                          </DialogHeader>
                          <StoreBookForm book={editingBook ?? undefined} onDone={() => setEditingBook(null)} />
                        </DialogContent>
                      </Dialog>
                      <button
                        type="button"
                        onClick={() => handleDelete(book._id)}
                        className="text-xs text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
