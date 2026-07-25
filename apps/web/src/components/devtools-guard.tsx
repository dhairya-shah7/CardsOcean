"use client";

import { useEffect } from "react";

export function DevToolsGuard() {
  useEffect(() => {
    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C/K, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      
      // Ctrl + Shift + I / J / C / K / L
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "K" || e.key === "L" ||
         e.key === "i" || e.key === "j" || e.key === "c" || e.key === "k" || e.key === "l")
      ) {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        return false;
      }

      // Ctrl + S (Save Page)
      if (e.ctrlKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    // 3. Print Console Warning
    try {
      console.clear();
      console.log(
        "%cSTOP!",
        "color: #a855f7; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 0 #000;"
      );
      console.log(
        "%cThis is a browser feature intended for developers. Attempting to view source, edit code, or inject scripts here is blocked and monitored.",
        "color: #475569; font-size: 16px; font-weight: 500;"
      );
    } catch {}

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
