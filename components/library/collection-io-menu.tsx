"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Upload,
} from "lucide-react";
import { importCollectionAction } from "@/actions/collection-io";
import type { BookListKind } from "@/types/book";
import type { ExportFormat } from "@/types/export";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectionIOMenuProps {
  list: BookListKind;
  showImport?: boolean;
  includeWishlistExports?: boolean;
  className?: string;
}

const FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  icon: typeof FileJson;
}[] = [
  { format: "json", label: "JSON", icon: FileJson },
  { format: "csv", label: "CSV", icon: FileText },
  { format: "xlsx", label: "Excel", icon: FileSpreadsheet },
];

function exportHref(list: BookListKind, format: ExportFormat): string {
  return `/api/export?list=${list}&format=${format}`;
}

export function CollectionIOMenu({
  list,
  showImport = true,
  includeWishlistExports = false,
  className,
}: CollectionIOMenuProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const listLabel = list === "wishlist" ? "wishlist" : "library";

  function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("list", list);

    startTransition(async () => {
      const result = await importCollectionAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { imported, skipped, failed } = result.data;
      setMessage(
        `Imported ${imported} book${imported === 1 ? "" : "s"}` +
          (skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : "") +
          (failed ? `, ${failed} failed` : "") +
          ".",
      );

      if (result.data.errors.length > 0) {
        setError(result.data.errors.join(" "));
      }

      router.refresh();
    });
  }

  function renderExportItems(targetList: BookListKind, label: string) {
    return (
      <>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {FORMAT_OPTIONS.map(({ format, label: formatLabel, icon: Icon }) => (
          <DropdownMenuItem key={`${targetList}-${format}`} asChild>
            <a href={exportHref(targetList, format)} download>
              <Icon className="h-4 w-4" />
              {formatLabel}
            </a>
          </DropdownMenuItem>
        ))}
      </>
    );
  }

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto">
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {includeWishlistExports ? (
              <>
                {renderExportItems("library", "Library")}
                <DropdownMenuSeparator />
                {renderExportItems("wishlist", "Wishlist")}
              </>
            ) : (
              renderExportItems(list, list === "wishlist" ? "Wishlist" : "Library")
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {showImport ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center sm:w-auto"
            onClick={() => {
              setImportOpen(true);
              setMessage(null);
              setError(null);
            }}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
        ) : null}
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Import collection</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-stone-600 dark:text-stone-400">
            Upload a BookShelf JSON export or a Goodreads CSV export. Books
            already in your {listLabel} (matched by ISBN) are skipped.
          </p>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept="application/json,.json,text/csv,.csv"
              required
              className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-amber-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-50 hover:file:bg-amber-900 dark:text-stone-300"
            />

            {message ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
            ) : null}
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setImportOpen(false)}
                disabled={pending}
              >
                Close
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Importing…" : "Import"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
