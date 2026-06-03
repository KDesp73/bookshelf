import { buildShelfPresetStylesheet } from "@/lib/shelf/presets";

export function ShelfPresetStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: buildShelfPresetStylesheet() }} />
  );
}
