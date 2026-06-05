"use client";

import { useState, useTransition } from "react";
import { sendPromotionalBroadcastAction } from "@/actions/promotional-email";
import { MarkdownEditor } from "@/components/blog/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromotionalEmailFormProps {
  recipientCount: number;
}

export function PromotionalEmailForm({ recipientCount }: PromotionalEmailFormProps) {
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSend() {
    setError(null);
    setSuccess(null);

    if (recipientCount === 0) {
      setError("No users have opted in to promotional emails.");
      return;
    }

    const confirmed = window.confirm(
      `Send this email to ${recipientCount} opted-in ${recipientCount === 1 ? "user" : "users"}?`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await sendPromotionalBroadcastAction({
        subject,
        bodyMarkdown: body,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      const { sent, failed, errors } = result.data;
      let message = `Sent to ${sent} ${sent === 1 ? "recipient" : "recipients"}.`;
      if (failed > 0) {
        message += ` ${failed} failed.`;
      }
      if (errors.length > 0) {
        message += ` ${errors[0]}`;
      }
      setSuccess(message);
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <div className="mb-6 rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-medium">
          {recipientCount}{" "}
          {recipientCount === 1 ? "user has" : "users have"} opted in to promotional emails.
        </p>
        <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
          Only opted-in users will receive this broadcast. Each email includes a link to manage
          preferences in Settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="promo-subject">Subject</Label>
          <Input
            id="promo-subject"
            value={subject}
            disabled={pending}
            maxLength={200}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="What's new on BookShelf"
          />
        </div>

        <MarkdownEditor
          value={body}
          onChange={setBody}
          disabled={pending}
          label="Message (Markdown)"
          inputId="promo-body"
          placeholder={
            "Share an update with your readers…\n\n## New this month\n\n- Feature one\n- Feature two\n\n[Visit BookShelf](https://example.com)"
          }
        />

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending || recipientCount === 0}
            onClick={handleSend}
          >
            {pending ? "Sending…" : "Send promotional email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
