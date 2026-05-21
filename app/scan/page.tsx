import { ScanFlow } from "@/components/scan/scan-flow";

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">Scan ISBN</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Point your camera at the barcode on the back cover
        </p>
      </div>
      <ScanFlow />
    </div>
  );
}
