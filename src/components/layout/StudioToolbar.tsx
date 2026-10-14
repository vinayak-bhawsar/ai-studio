"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Palette,
  Users,
  Image as ImageIcon,
  Clapperboard,
  Scissors,
  Share2,
  Check,
  Layers,
} from "lucide-react";

export type StudioStage =
  | "screenplay"
  | "stylebook"
  | "characters"
  | "environments"
  | "storyboard"
  | "shots"
  | "editor";

interface StudioToolbarProps {
  projectId: string;
  activeStage: StudioStage;
  versionText?: string;
  isStyleBookSkipped?: boolean;
  isScreenplayReady?: boolean;
  onExport?: () => void;
  onStageChange?: (stage: StudioStage) => void;
}

export function StudioToolbar({
  projectId,
  activeStage,
  versionText = "script • version 1 of 1",
  isStyleBookSkipped = false,
  isScreenplayReady = true,
  onExport,
  onStageChange,
}: StudioToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleExportClick = () => {
    if (onExport) {
      onExport();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    {
      id: "screenplay" as StudioStage,
      label: "Script Writing",
      href: `/projects/${projectId}`,
      icon: FileText,
    },
    {
      id: "characters" as StudioStage,
      label: "Characters",
      href: `/projects/${projectId}/production-design/characters`,
      icon: Users,
    },
    {
      id: "environments" as StudioStage,
      label: "Environments",
      href: `/projects/${projectId}/production-design/environments`,
      icon: ImageIcon,
    },
    {
      id: "stylebook" as StudioStage,
      label: "Style Book",
      href: `/projects/${projectId}/production-design`,
      icon: Palette,
    },
    {
      id: "storyboard" as StudioStage,
      label: "Storyboard",
      href: `/projects/${projectId}/storyboard`,
      icon: Layers,
    },
    {
      id: "shots" as StudioStage,
      label: "Production Studio",
      href: `/projects/${projectId}/shots`,
      icon: Clapperboard,
    },
    {
      id: "editor" as StudioStage,
      label: "Editor",
      href: `/projects/${projectId}/editor`,
      icon: Scissors,
    },
  ];

  return (
    <div className="sticky bottom-0 z-30 w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center select-none pt-1.5 pb-2">
      {/* Top indicator text line */}
      <div className="mb-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 pointer-events-auto">
        {versionText}
      </div>

      {/* Toolbar icons */}
      <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto overflow-x-auto max-w-full px-4 relative">
        {navItems.map((item) => {
          const isActive = activeStage === item.id;
          const Icon = item.icon;
          const isItemDisabled = item.id === "characters" && !isScreenplayReady;

          if (isActive) {
            return (
              <div
                key={item.id}
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs rounded-full transition-all flex-shrink-0"
              >
                <div className="absolute -top-3.5 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full" />
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === "stylebook" && isStyleBookSkipped && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-full">
                    Skipped
                  </span>
                )}
              </div>
            );
          }

          if (isItemDisabled) {
            return (
              <button
                key={item.id}
                type="button"
                disabled
                className="relative p-2 text-zinc-300 dark:text-zinc-700 opacity-40 cursor-not-allowed rounded-full flex-shrink-0"
                title="Generate screenplay completely first"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          }

          if (onStageChange) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStageChange(item.id)}
                className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                title={
                  item.id === "stylebook"
                    ? isStyleBookSkipped
                      ? "Style Book (Skipped — click to configure)"
                      : "Style Book (Optional)"
                    : item.label
                }
              >
                <Icon className="w-4 h-4" />
                {item.id === "stylebook" && isStyleBookSkipped && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-full transition-colors flex-shrink-0"
              title={
                item.id === "stylebook"
                  ? isStyleBookSkipped
                    ? "Style Book (Skipped — click to configure)"
                    : "Style Book (Optional)"
                  : item.label
              }
            >
              <Icon className="w-4 h-4" />
              {item.id === "stylebook" && isStyleBookSkipped && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Export / Share button */}
        {onExport && (
          <button
            type="button"
            onClick={handleExportClick}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-full transition-colors flex-shrink-0 cursor-pointer border-l border-zinc-200 dark:border-zinc-700 pl-2 ml-1"
            title="Export Script / Assets"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
          {/* Moon icon placeholder matching image, theme toggle */}
        </div>
      </div>
    </div>
  );
}
