"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder or nothing until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 opacity-50">
        <div className="p-1.5 w-7 h-7" />
        <div className="p-1.5 w-7 h-7" />
        <div className="p-1.5 w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === "light" 
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white" 
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === "system" 
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white" 
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
          theme === "dark" 
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white" 
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
