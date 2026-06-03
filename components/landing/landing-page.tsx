import Link from "next/link";
import {
  BookOpen,
  Compass,
  Heart,
  ScanLine,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: ScanLine,
    title: "Catalog your shelf",
    description:
      "Scan ISBN barcodes or add books manually. Metadata is pulled from Open Library, Google Books, and more.",
  },
  {
    icon: Star,
    title: "Rate like Letterboxd",
    description:
      "Half-star ratings from 0.5 to 5 on the books you've read. Your ratings show on your public profile.",
  },
  {
    icon: Users,
    title: "Share your collection",
    description:
      "Get a public profile at /u/yourname. Friends can browse your shelf — your personal notes stay private.",
  },
  {
    icon: Heart,
    title: "Discover readers",
    description:
      "Browse other people's collections, search by username, and like shelves that inspire your next read.",
  },
];

export function LandingPage() {
  return (
    <div className="-mx-4 -mt-6">
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-amber-100/60 to-transparent px-4 py-16 dark:border-stone-800 dark:from-amber-950/30 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Your books, your people
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-amber-950 dark:text-amber-50 sm:text-5xl">
              A social home for your reading life
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
              BookShelf is a personal library you can share. Catalog what you
              own, rate what you&apos;ve read, and explore other readers&apos;
              collections — like Letterboxd, but for books.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Create your shelf</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/discover">
                  <Compass className="h-4 w-4" />
                  Browse collections
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
            Everything you need
          </h2>
          <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
            Built for readers who want more than a spreadsheet — a shelf that
            looks good and connects you to other book people.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40"
              >
                <div className="mb-4 inline-flex rounded-lg bg-amber-100 p-2.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="scroll-mt-20 border-t border-stone-200/80 bg-white/40 px-4 py-16 dark:border-stone-800 dark:bg-stone-900/20 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
                About BookShelf
              </h2>
              <div className="mt-4 space-y-4 text-stone-600 dark:text-stone-400">
                <p className="leading-relaxed">
                  BookShelf started as a simple way to track a personal library
                  — scan a barcode, pull in cover art and metadata, filter by
                  what you&apos;ve read. It grew into something social: a place
                  to show off your shelf and see what others are reading.
                </p>
                <p className="leading-relaxed">
                  Each account gets a private library for managing books and a
                  public profile for sharing. You control your catalog; the
                  community discovers it through profiles and likes.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200/80 bg-background/80 p-6 dark:border-stone-700">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                  <BookOpen className="h-5 w-5 text-amber-800" />
                  How it works
                </h3>
                <ol className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      1. Sign up
                    </span>{" "}
                    — create an account and pick a username.
                  </li>
                  <li>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      2. Add books
                    </span>{" "}
                    — scan ISBNs or enter them manually.
                  </li>
                  <li>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      3. Rate &amp; organize
                    </span>{" "}
                    — mark reading status, add tags, rate your reads.
                  </li>
                  <li>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      4. Share
                    </span>{" "}
                    — your profile goes live; others can discover and like your
                    shelf.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
                <h3 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
                  What stays private
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  Personal notes on books are never shown on public profiles.
                  Only you see them when managing your library.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-8 dark:border-stone-600 dark:bg-stone-900/30">
            <p className="font-serif text-lg text-stone-800 dark:text-stone-200">
              Ready to shelve your first book?
            </p>
            <Button asChild>
              <Link href="/register">Get started — it&apos;s free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
