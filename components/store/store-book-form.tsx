"use client";

import { useState } from "react";
import { addStoreBookAction, updateStoreBookAction } from "@/actions/store-books";
import type { StoreBookActionState } from "@/actions/store-books";
import type { StoreBookDocument } from "@/types/store";
import { StoreImagePicker } from "@/components/store/store-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreBookFormProps {
  book?: StoreBookDocument;
  onDone?: () => void;
}

export function StoreBookForm({ book, onDone }: StoreBookFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [coverImage, setCoverImage] = useState(book?.coverImage ?? "");
  const isEditing = !!book;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    if (isEditing && book) {
      formData.set("bookId", book._id);
    }
    formData.set("coverImage", coverImage);

    const action = isEditing ? updateStoreBookAction : addStoreBookAction;

    try {
      const result: StoreBookActionState = await action({}, formData);

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      onDone?.();
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          name="author"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="isbn">ISBN (optional)</Label>
        <Input
          id="isbn"
          name="isbn"
          defaultValue={book?.isbn ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={book?.description ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={book?.price.toString() ?? ""}
          disabled={pending}
        />
      </div>

      <StoreImagePicker
        value={coverImage}
        onChange={setCoverImage}
        label="Cover image"
        bookTitle={title}
        bookAuthor={author}
        bookIsbn={book?.isbn}
        showSearch
      />

      <div className="grid gap-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          defaultValue={book?.quantity.toString() ?? "1"}
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Saving\u2026"
          : isEditing
            ? "Update book"
            : "Add book"}
      </Button>
    </form>
  );
}
