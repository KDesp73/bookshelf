"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "blog-markdown space-y-4 text-stone-800 dark:text-stone-200",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-stone-700 dark:text-stone-300">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-amber-800 underline underline-offset-2 dark:text-amber-300"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-stone-700 dark:text-stone-300">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-300 pl-4 italic text-stone-600 dark:border-amber-700 dark:text-stone-400">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-stone-100 p-4 font-mono text-sm text-stone-900 dark:bg-stone-900 dark:text-stone-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-sm text-stone-900 dark:bg-stone-900 dark:text-stone-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
          hr: () => <hr className="border-stone-200 dark:border-stone-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
