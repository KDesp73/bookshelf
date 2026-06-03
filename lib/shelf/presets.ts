import type { ShelfAppearance, ShelfPreset } from "@/types/shelf";
import { SHELF_PRESETS } from "@/types/shelf";

export interface ShelfThemeVars {
  background: string;
  surface: string;
  border: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
}

export const SHELF_PRESET_VARS: Record<ShelfPreset, ShelfThemeVars> = {
  default: {
    background: "#f6f1ea",
    surface: "rgba(255, 255, 255, 0.65)",
    border: "rgba(214, 211, 209, 0.8)",
    accent: "#92400e",
    accentSoft: "rgba(251, 191, 36, 0.18)",
    text: "#292524",
    muted: "#78716c",
  },
  warm: {
    background: "#f8ead8",
    surface: "rgba(255, 248, 238, 0.82)",
    border: "rgba(217, 119, 6, 0.22)",
    accent: "#b45309",
    accentSoft: "rgba(251, 146, 60, 0.22)",
    text: "#431407",
    muted: "#9a3412",
  },
  forest: {
    background: "#edf4ec",
    surface: "rgba(255, 255, 255, 0.72)",
    border: "rgba(22, 101, 52, 0.18)",
    accent: "#166534",
    accentSoft: "rgba(74, 222, 128, 0.18)",
    text: "#14532d",
    muted: "#3f6212",
  },
  ocean: {
    background: "#e8f2fb",
    surface: "rgba(255, 255, 255, 0.78)",
    border: "rgba(37, 99, 235, 0.18)",
    accent: "#1d4ed8",
    accentSoft: "rgba(96, 165, 250, 0.2)",
    text: "#1e3a8a",
    muted: "#475569",
  },
  midnight: {
    background: "#111827",
    surface: "rgba(31, 41, 55, 0.88)",
    border: "rgba(148, 163, 184, 0.18)",
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.12)",
    text: "#f8fafc",
    muted: "#94a3b8",
  },
  rose: {
    background: "#fdf2f8",
    surface: "rgba(255, 255, 255, 0.78)",
    border: "rgba(219, 39, 119, 0.16)",
    accent: "#be185d",
    accentSoft: "rgba(244, 114, 182, 0.18)",
    text: "#831843",
    muted: "#9d174d",
  },
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidShelfColor(value: string | undefined): boolean {
  if (!value) return true;
  return HEX_COLOR.test(value.trim());
}

export function normalizeShelfAppearance(input: Partial<ShelfAppearance>): ShelfAppearance {
  const preset = SHELF_PRESETS.includes(input.preset as ShelfPreset)
    ? (input.preset as ShelfPreset)
    : "default";

  return {
    preset,
    accentColor: isValidShelfColor(input.accentColor)
      ? input.accentColor?.trim() || undefined
      : undefined,
    backgroundColor: isValidShelfColor(input.backgroundColor)
      ? input.backgroundColor?.trim() || undefined
      : undefined,
    customCss: input.customCss?.trim() || undefined,
  };
}

export function buildShelfStyleVars(
  appearance: ShelfAppearance,
): Record<string, string> {
  const preset = SHELF_PRESET_VARS[appearance.preset] ?? SHELF_PRESET_VARS.default;

  return {
    "--shelf-bg": appearance.backgroundColor ?? preset.background,
    "--shelf-surface": preset.surface,
    "--shelf-border": preset.border,
    "--shelf-accent": appearance.accentColor ?? preset.accent,
    "--shelf-accent-soft": preset.accentSoft,
    "--shelf-text": preset.text,
    "--shelf-muted": preset.muted,
  };
}
