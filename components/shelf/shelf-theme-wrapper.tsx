import type { ReactNode } from "react";
import type { ShelfAppearance } from "@/types/shelf";
import { buildShelfStyleVars } from "@/lib/shelf/presets";
import { scopeShelfCss } from "@/lib/shelf/css";

interface ShelfThemeWrapperProps {
  username: string;
  appearance: ShelfAppearance;
  children: ReactNode;
  className?: string;
}

export function ShelfThemeWrapper({
  username,
  appearance,
  children,
  className,
}: ShelfThemeWrapperProps) {
  const scopeSelector = `.bookshelf-themed[data-shelf="${username}"]`;
  const scopedCss = appearance.customCss
    ? scopeShelfCss(appearance.customCss, scopeSelector)
    : "";

  return (
    <div
      data-shelf={username}
      className={`bookshelf-themed shelf-root rounded-2xl ${className ?? ""}`.trim()}
      style={buildShelfStyleVars(appearance)}
    >
      {scopedCss ? (
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      ) : null}
      {children}
    </div>
  );
}
