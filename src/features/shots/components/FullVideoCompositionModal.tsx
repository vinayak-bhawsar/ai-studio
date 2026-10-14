"use client";

import { X, Film } from "lucide-react";
import { FullVideoCompositionSection } from "./FullVideoCompositionSection";
import { SceneResponse } from "@/src/features/storyboard/types/storyboard";
import { VideoComposeResponse } from "../types/production";

interface FullVideoCompositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  scenes?: SceneResponse[];
  onNavigateToShots?: () => void;
  onNavigateToStoryboard?: () => void;
  onCompositionUpdated?: (comp: VideoComposeResponse) => void;
}

export function FullVideoCompositionModal({
  isOpen,
  onClose,
  projectId,
  scenes = [],
  onNavigateToShots,
  onNavigateToStoryboard,
  onCompositionUpdated,
}: FullVideoCompositionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Full Video Composition & Master Export
              </h2>
              <p className="text-xs text-zinc-500">
                Chronological timeline clip assembly and master video playback.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close composition modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <FullVideoCompositionSection
          projectId={projectId}
          scenes={scenes}
          onNavigateToShots={() => {
            onClose();
            if (onNavigateToShots) onNavigateToShots();
          }}
          onNavigateToStoryboard={() => {
            onClose();
            if (onNavigateToStoryboard) onNavigateToStoryboard();
          }}
          onCompositionUpdated={onCompositionUpdated}
          embeddedInModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
