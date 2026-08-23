"use client";

import { useEffect } from "react";

export function PanelSpotlight() {
  useEffect(() => {
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let active: HTMLElement | null = null;
    let frame = 0;
    let latestEvent: PointerEvent | null = null;
    const move = (event: PointerEvent) => {
      latestEvent = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const currentEvent = latestEvent;
        if (!currentEvent) return;
        const panel =
          currentEvent.target instanceof Element
            ? (currentEvent.target.closest(".panel") as HTMLElement | null)
            : null;
        if (active && active !== panel) {
          active.style.removeProperty("--pointer-x");
          active.style.removeProperty("--pointer-y");
        }
        active = panel;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty(
          "--pointer-x",
          `${currentEvent.clientX - rect.left}px`,
        );
        panel.style.setProperty(
          "--pointer-y",
          `${currentEvent.clientY - rect.top}px`,
        );
      });
    };
    const leave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      latestEvent = null;
      active?.style.removeProperty("--pointer-x");
      active?.style.removeProperty("--pointer-y");
      active = null;
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return null;
}
