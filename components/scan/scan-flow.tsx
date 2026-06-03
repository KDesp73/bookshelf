"use client";

import { useState, useTransition } from "react";
import { lookupIsbnAction } from "@/actions/books";
import type { BookInput } from "@/types/book";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { BookPreviewForm } from "@/components/books/book-preview-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type ScanStep = "scan" | "manual-isbn" | "preview" | "existing";

export function ScanFlow() {
  const [step, setStep] = useState<ScanStep>("scan");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState("");
  const [preview, setPreview] = useState<BookInput | null>(null);
  const [existingTitle, setExistingTitle] = useState<string | null>(null);
  const [existingIsWishlist, setExistingIsWishlist] = useState(false);

  function resolveIsbn(isbn: string) {
    setError(null);
    setExistingTitle(null);
    setExistingIsWishlist(false);
    startTransition(async () => {
      const result = await lookupIsbnAction(isbn);
      if (!result.success) {
        setError(result.error);
        setStep("manual-isbn");
        return;
      }

      if (result.data.type === "existing") {
        setExistingTitle(result.data.book.title);
        setExistingIsWishlist(result.data.book.isWishlist);
        setStep("existing");
        return;
      }

      setPreview(result.data.preview);
      setStep("preview");
    });
  }

  if (step === "preview" && preview) {
    return (
      <div className="space-y-4">
        <h2 className="text-center font-serif text-xl font-semibold">
          Confirm & save
        </h2>
        <BookPreviewForm initial={preview} />
        <div className="text-center">
          <Button variant="ghost" onClick={() => setStep("scan")}>
            Scan another
          </Button>
        </div>
      </div>
    );
  }

  if (step === "existing") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <CheckCircle2 className="mx-auto h-10 w-10 text-amber-700 dark:text-amber-400" />
        <h2 className="font-serif text-lg font-semibold">
          {existingIsWishlist ? "Already in wishlist" : "Already in library"}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <strong>{existingTitle}</strong> is already on your{" "}
          {existingIsWishlist ? "wishlist" : "shelf"}.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => setStep("scan")}>Scan another</Button>
          <Button variant="outline" asChild>
            <Link href={existingIsWishlist ? "/wishlist" : "/"}>
              {existingIsWishlist ? "View wishlist" : "View library"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (step === "manual-isbn") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="font-serif text-xl font-semibold">Enter ISBN</h2>
        <div className="grid gap-2">
          <Label htmlFor="manual-isbn">ISBN-10 or ISBN-13</Label>
          <Input
            id="manual-isbn"
            inputMode="numeric"
            value={manualIsbn}
            onChange={(e) => setManualIsbn(e.target.value)}
            placeholder="9780143127550"
          />
        </div>
        {error && (
          <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => resolveIsbn(manualIsbn)}
            disabled={pending || !manualIsbn.trim()}
          >
            {pending ? "Looking up…" : "Look up book"}
          </Button>
          <Button variant="outline" onClick={() => setStep("scan")}>
            Back to camera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending && (
        <p className="text-center text-sm text-stone-600 dark:text-stone-400">
          Fetching book metadata…
        </p>
      )}
      {error && !pending && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <BarcodeScanner
        onScan={resolveIsbn}
        onManualEntry={() => setStep("manual-isbn")}
        disabled={pending}
      />
    </div>
  );
}
