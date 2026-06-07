import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm token={token} />;
}
