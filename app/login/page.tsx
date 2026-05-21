import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next;

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Sign in to add, scan, and edit books in your library.
        </p>
      </div>

      <LoginForm nextPath={nextPath} />

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Continue as guest
        </Link>
      </p>
    </div>
  );
}
