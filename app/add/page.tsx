import Link from "next/link";
import { ManualEntryForm } from "@/components/books/manual-entry-form";

export default function AddPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Add manually</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          For books without a scannable ISBN or missing from public APIs
        </p>
      </div>
      <ManualEntryForm />
      <p className="text-center text-sm text-stone-500">
        Have an ISBN?{" "}
        <Link
          href="/scan"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Scan or look it up
        </Link>
      </p>
    </div>
  );
}
