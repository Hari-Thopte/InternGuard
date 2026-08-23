"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileNav({ items }: { items: string[][] }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const trigger = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => firstLink.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => trigger.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = menu.current?.querySelectorAll<HTMLAnchorElement>(
        'a[href]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={trigger}
        type="button"
        className="icon-button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-x-0 bottom-0 top-16 z-30 cursor-default bg-canvas/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              ref={menu}
              id="mobile-navigation"
              aria-label="Mobile primary"
              className="absolute inset-x-0 top-full z-40 border-b border-line bg-canvas/95 p-4 shadow-panel backdrop-blur-xl"
              initial={reduced ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="shell grid gap-2 px-0">
                {items.map(([label, href], index) => (
                  <motion.div
                    key={href}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduced ? 0 : index * 0.035 }}
                  >
                    <Link
                      ref={index === 0 ? firstLink : undefined}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-xl border border-transparent px-4 text-sm font-semibold text-muted hover:border-line hover:bg-raised hover:text-ink"
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
                <Link
                  href="/analyze"
                  onClick={() => setOpen(false)}
                  className="button-primary mt-2 w-full"
                >
                  Analyze opportunity <ArrowUpRight size={16} />
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
