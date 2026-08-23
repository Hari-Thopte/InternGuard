"use client";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";

const THEME_EVENT = "ig-theme-updated";
const subscribe = (onChange: () => void) => {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};
const getTheme = () => document.documentElement.dataset.theme !== "light";
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, () => true);
  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("ig-theme", next ? "dark" : "light");
    } catch {
      // The visual theme can still change when persistent storage is blocked.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9, rotate: -30 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="icon-button cursor-pointer"
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      aria-pressed={!dark}
    >
      <motion.span
        key={dark ? "dark" : "light"}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        {dark ? <Sun size={17} /> : <Moon size={17} />}
      </motion.span>
    </motion.button>
  );
}
