import { useEffect } from "react";

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

const HORIZONTAL_THRESHOLD = 60; // px minimi per contare come swipe
const VERTICAL_TOLERANCE = 60; // px massimi di movimento verticale

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [role="button"], [contenteditable="true"]',
    ),
  );
}

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) return;
      if (isInteractive(event.target)) return;
      const t = event.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }

    function onTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const t = event.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > VERTICAL_TOLERANCE) return;
      if (dx > HORIZONTAL_THRESHOLD) onSwipeRight?.();
      else if (dx < -HORIZONTAL_THRESHOLD) onSwipeLeft?.();
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
