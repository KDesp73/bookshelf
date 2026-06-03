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

export const SHELF_PRESET_VARS_DARK: Record<ShelfPreset, ShelfThemeVars> = {
  default: {
    background: "#0c0a09",
    surface: "rgba(28, 25, 23, 0.85)",
    border: "rgba(68, 64, 60, 0.6)",
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.12)",
    text: "#f5f5f4",
    muted: "#a8a29e",
  },
  warm: {
    background: "#1c1410",
    surface: "rgba(41, 31, 24, 0.88)",
    border: "rgba(180, 83, 9, 0.25)",
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.12)",
    text: "#fef3c7",
    muted: "#d6a06a",
  },
  forest: {
    background: "#0a120d",
    surface: "rgba(20, 35, 26, 0.88)",
    border: "rgba(34, 197, 94, 0.18)",
    accent: "#4ade80",
    accentSoft: "rgba(74, 222, 128, 0.12)",
    text: "#dcfce7",
    muted: "#86efac",
  },
  ocean: {
    background: "#0a1018",
    surface: "rgba(15, 28, 46, 0.88)",
    border: "rgba(59, 130, 246, 0.2)",
    accent: "#60a5fa",
    accentSoft: "rgba(96, 165, 250, 0.12)",
    text: "#dbeafe",
    muted: "#93c5fd",
  },
  midnight: SHELF_PRESET_VARS.midnight,
  rose: {
    background: "#150810",
    surface: "rgba(40, 18, 30, 0.88)",
    border: "rgba(244, 114, 182, 0.18)",
    accent: "#f472b6",
    accentSoft: "rgba(244, 114, 182, 0.12)",
    text: "#fce7f3",
    muted: "#f9a8d4",
  },
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function varsToCssProperties(vars: ShelfThemeVars): string {
  return [
    `--shelf-bg: ${vars.background}`,
    `--shelf-surface: ${vars.surface}`,
    `--shelf-border: ${vars.border}`,
    `--shelf-accent: ${vars.accent}`,
    `--shelf-accent-soft: ${vars.accentSoft}`,
    `--shelf-text: ${vars.text}`,
    `--shelf-muted: ${vars.muted}`,
  ].join("; ");
}

export function buildShelfPresetStylesheet(): string {
  return SHELF_PRESETS.map((preset) => {
    const light = SHELF_PRESET_VARS[preset];
    const dark = SHELF_PRESET_VARS_DARK[preset];
    return [
      `.bookshelf-themed[data-preset="${preset}"] { ${varsToCssProperties(light)} }`,
      `html.dark .bookshelf-themed[data-preset="${preset}"] { ${varsToCssProperties(dark)} }`,
    ].join("\n");
  }).join("\n");
}

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
  const vars: Record<string, string> = {};

  if (appearance.backgroundColor) {
    vars["--shelf-bg"] = appearance.backgroundColor;
  }

  if (appearance.accentColor) {
    vars["--shelf-accent"] = appearance.accentColor;
  }

  return vars;
}
