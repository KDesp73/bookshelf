import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Sign in to manage your library and connect with other readers.
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-stone-500">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Create one
        </Link>
        {" · "}
        <Link
          href="/discover"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Browse collections
        </Link>
      </p>
    </div>
  );
}
