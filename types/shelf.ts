export const SHELF_PRESETS = [
  "default",
  "warm",
  "forest",
  "ocean",
  "midnight",
  "rose",
] as const;

export type ShelfPreset = (typeof SHELF_PRESETS)[number];

export interface ShelfAppearance {
  preset: ShelfPreset;
  accentColor?: string;
  backgroundColor?: string;
  customCss?: string;
}

export const DEFAULT_SHELF_APPEARANCE: ShelfAppearance = {
  preset: "default",
};
