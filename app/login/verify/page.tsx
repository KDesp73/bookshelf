import Link from "next/link";
import { redirect } from "next/navigation";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { getLoginVerifyContextAction } from "@/actions/auth";

interface LoginVerifyPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

function normalizeCallbackUrl(value?: string): string {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

export default async function LoginVerifyPage({ searchParams }: LoginVerifyPageProps) {
  const params = await searchParams;
  const callbackUrlFromQuery = normalizeCallbackUrl(params.callbackUrl);
  const context = await getLoginVerifyContextAction();

  if (!context.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrlFromQuery)}`);
  }

  const callbackUrl = normalizeCallbackUrl(context.callbackUrl || callbackUrlFromQuery);

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Check your email</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Enter the code to finish signing in.
        </p>
      </div>

      <TwoFactorForm callbackUrl={callbackUrl} maskedEmail={context.email} />

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/"
          className="font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
