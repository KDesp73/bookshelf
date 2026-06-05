import { AdminNav } from "@/components/admin/admin-nav";
import { PromotionalEmailForm } from "@/components/admin/promotional-email-form";
import { countPromotionalRecipients } from "@/lib/admin/promotional-recipients";
import { getEmailConfigError, isEmailConfigured } from "@/lib/email/resend-client";

export default async function AdminEmailsPage() {
  let recipientCount = 0;
  let dbError: string | null = null;

  try {
    recipientCount = await countPromotionalRecipients();
  } catch {
    dbError = "Could not load recipients. Check your database connection.";
  }

  const emailConfigError = getEmailConfigError();
  const emailReady = isEmailConfigured() && !emailConfigError;

  return (
    <>
      <AdminNav current="emails" />

      <div className="space-y-2">
        <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
          Promotional emails
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Compose a Markdown message and send it to everyone who opted in under Settings →
          Privacy &amp; email.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : null}

      {!emailReady ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {emailConfigError ??
            "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM before sending."}
        </div>
      ) : null}

      {!dbError && emailReady ? (
        <PromotionalEmailForm recipientCount={recipientCount} />
      ) : null}
    </>
  );
}
