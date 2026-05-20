"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, Keyboard } from "lucide-react";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch {
    // Audio may be blocked until user gesture on some browsers
  }
}

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onManualEntry?: () => void;
  disabled?: boolean;
}

export function BarcodeScanner({
  onScan,
  onManualEntry,
  disabled = false,
}: BarcodeScannerProps) {
  const containerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }
    scannerRef.current = null;
    setActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (disabled || scannedRef.current) return;

    setError(null);
    await stopScanner();

    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: Math.floor(size * 0.45) };
          },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          const digits = decodedText.replace(/\D/g, "");
          if (digits.length !== 13 || scannedRef.current) return;

          scannedRef.current = true;
          playBeep();
          void stopScanner().then(() => onScan(digits));
        },
        () => {
          // scan failure per frame — expected while searching
        },
      );
      setActive(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access camera";
      setError(message);
      setActive(false);
    }
  }, [containerId, disabled, onScan, stopScanner]);

  useEffect(() => {
    void startScanner();
    return () => {
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-stone-300 bg-black shadow-inner dark:border-stone-600">
        <div id={containerId} className="min-h-[280px] w-full" />
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80 text-stone-200">
            <Camera className="mr-2 h-5 w-5 animate-pulse" />
            Starting camera…
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}. Allow camera access or enter ISBN manually.
        </p>
      )}

      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        Align the ISBN barcode inside the frame. Scanning stops automatically on
        success.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            scannedRef.current = false;
            void startScanner();
          }}
          disabled={disabled}
        >
          Scan again
        </Button>
        {onManualEntry && (
          <Button type="button" variant="secondary" onClick={onManualEntry}>
            <Keyboard className="h-4 w-4" />
            Enter ISBN manually
          </Button>
        )}
      </div>
    </div>
  );
}
