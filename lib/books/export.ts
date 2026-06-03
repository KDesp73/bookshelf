import * as XLSX from "xlsx";
import type { BookDocument, BookListKind } from "@/types/book";
import {
  EXPORT_VERSION,
  type BookExportEnvelope,
  type ExportedBook,
  type ExportFormat,
} from "@/types/export";

const CSV_COLUMNS: (keyof ExportedBook)[] = [
  "isbn13",
  "title",
  "subtitle",
  "authors",
  "publisher",
  "publishedDate",
  "pageCount",
  "status",
  "rating",
  "tags",
  "notes",
  "coverUrl",
  "description",
  "isWishlist",
  "dateAdded",
];

function toExportedBook(book: BookDocument): ExportedBook {
  return {
    isbn13: book.isbn13,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    publisher: book.publisher,
    publishedDate: book.publishedDate,
    description: book.description,
    pageCount: book.pageCount,
    coverUrl: book.coverUrl,
    status: book.status,
    tags: book.tags,
    notes: book.notes,
    rating: book.rating,
    isWishlist: book.isWishlist,
    dateAdded: book.dateAdded,
  };
}

export function buildExportEnvelope(
  books: BookDocument[],
  list: BookListKind,
): BookExportEnvelope {
  return {
    version: EXPORT_VERSION,
    source: "bookshelf",
    list,
    exportedAt: new Date().toISOString(),
    books: books.map(toExportedBook),
  };
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function bookToCsvRow(book: ExportedBook): string {
  return CSV_COLUMNS.map((column) => {
    const value = book[column];
    if (value == null) return "";
    if (Array.isArray(value)) return escapeCsv(value.join("; "));
    if (typeof value === "boolean") return value ? "true" : "false";
    return escapeCsv(String(value));
  }).join(",");
}

export function booksToCsv(books: BookDocument[]): string {
  const exported = books.map(toExportedBook);
  const header = CSV_COLUMNS.join(",");
  const rows = exported.map(bookToCsvRow);
  return [header, ...rows].join("\n");
}

export function booksToJson(books: BookDocument[], list: BookListKind): string {
  return JSON.stringify(buildExportEnvelope(books, list), null, 2);
}

export function booksToExcelBuffer(books: BookDocument[]): Buffer {
  const exported = books.map(toExportedBook);
  const rows = exported.map((book) => ({
    isbn13: book.isbn13,
    title: book.title,
    subtitle: book.subtitle ?? "",
    authors: book.authors.join("; "),
    publisher: book.publisher ?? "",
    publishedDate: book.publishedDate ?? "",
    pageCount: book.pageCount ?? "",
    status: book.status,
    rating: book.rating ?? "",
    tags: book.tags.join("; "),
    notes: book.notes ?? "",
    coverUrl: book.coverUrl ?? "",
    description: book.description ?? "",
    isWishlist: book.isWishlist,
    dateAdded: book.dateAdded ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

export function exportFilename(list: BookListKind, format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  const base = list === "wishlist" ? "bookshelf-wishlist" : "bookshelf-library";
  const ext = format === "xlsx" ? "xlsx" : format;
  return `${base}-${date}.${ext}`;
}

export function exportContentType(format: ExportFormat): string {
  switch (format) {
    case "json":
      return "application/json; charset=utf-8";
    case "csv":
      return "text/csv; charset=utf-8";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
}

export function buildExportBody(
  books: BookDocument[],
  list: BookListKind,
  format: ExportFormat,
): string | Buffer {
  switch (format) {
    case "json":
      return booksToJson(books, list);
    case "csv":
      return booksToCsv(books);
    case "xlsx":
      return booksToExcelBuffer(books);
  }
}
