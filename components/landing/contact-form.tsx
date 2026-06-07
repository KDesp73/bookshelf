"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitContactForm } from "@/actions/contact";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <p className="font-serif text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          Message sent!
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          We&apos;ll get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Name
        </label>
        <Input id="name" name="name" placeholder="Your name" required />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help?"
          rows={4}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
