"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { awardEasterEggAction } from "@/actions/easter-eggs";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function EasterEggDetector() {
  const { data: session } = useSession();
  const konamiIndex = useRef(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const expectedKey = KONAMI_CODE[konamiIndex.current];
      if (e.key === expectedKey) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI_CODE.length) {
          konamiIndex.current = 0;
          triggerEgg("easter_egg_konami");
        }
      } else {
        konamiIndex.current = 0;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const hour = new Date().getHours();
    if (hour >= 2 && hour < 5) {
      triggerEgg("easter_egg_midnight");
    }
  }, [session?.user?.id]);

  return null;
}

async function triggerEgg(eggId: string) {
  const result = await awardEasterEggAction(eggId);
  if (result.success && result.data) {
    alert(`Easter egg found: ${result.data.name}!\n\n${result.data.description}`);
  }
}
