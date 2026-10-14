"use client";

import { useState, useEffect } from "react";
import {
  Edit3,
  Maximize2,
  Minimize2,
  Lock,
  SkipForward,
} from "lucide-react";
import { ScreenplayResponse } from "../types/screenplay";
import { StudioToolbar } from "@/src/components/layout/StudioToolbar";
import { EditScreenplayModal } from "./EditScreenplayModal";

interface ScreenplayDocumentProps {
  projectId?: string;
  screenplayData: ScreenplayResponse;
  onEditScript?: (updated?: ScreenplayResponse) => void;
  onStageChange?: (stage: any) => void;
  onSkip?: () => void;
  showToolbar?: boolean;
}

export function ScreenplayDocument({
  projectId = "",
  screenplayData,
  onEditScript,
  onStageChange,
  onSkip,
  showToolbar = false,
}: ScreenplayDocumentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState<ScreenplayResponse>(screenplayData);

  useEffect(() => {
    setCurrentData(screenplayData);
  }, [screenplayData]);

  const script = currentData?.screenplay || { title: "Untitled Short", logline: "", characters: [], scenes: [] };
  const version = currentData?.version || 1;
  const isLocked = currentData?.is_locked || false;

  const handleCopy = () => {
    let fullText = `${script.title?.toUpperCase() || "UNTITLED SHORT"}\n\n`;
    if (script.logline) {
      fullText += `LOGLINE: ${script.logline}\n\n`;
    }
    fullText += `FADE IN:\n\n`;

    script.scenes?.forEach((scene) => {
      fullText += `${scene.heading?.toUpperCase()}\n\n`;
      if (scene.action) {
        fullText += `${scene.action}\n\n`;
      }
      scene.dialogue?.forEach((dlg) => {
        fullText += `    ${dlg.character?.toUpperCase()}\n`;
        fullText += `  ${dlg.line}\n\n`;
      });
    });

    navigator.clipboard.writeText(fullText);
  };

  const handleSaveSuccess = (updated: ScreenplayResponse) => {
    setCurrentData(updated);
    if (onEditScript) {
      onEditScript(updated);
    }
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-zinc-950 relative select-text min-h-0 ${
        isFullscreen
          ? "fixed inset-0 z-50 p-6 md:p-12 overflow-y-auto"
          : "h-full w-full flex-1 overflow-y-auto"
      }`}
    >
      {/* Top Document Header matching reference screenshot */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-4 shrink-0 sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs z-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
            {script.title || "Untitled Short"}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md">
            &lt; v{version}/{version} &gt;
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked</span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Edit script</span>
            </button>
          )}

          {(onSkip || onStageChange) && (
            <button
              onClick={() => {
                if (onSkip) onSkip();
                else if (onStageChange) onStageChange("characters");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Skip Script Writing and proceed to Character Casting"
            >
              <SkipForward className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Skip for Now</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Screenplay Document Page */}
      <div 
        className="flex-1 px-6 sm:px-12 md:px-16 py-8 sm:py-12 max-w-4xl mx-auto w-full text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-300 space-y-4 pb-32"
        style={{ fontFamily: '"Inter", sans-serif', fontOpticalSizing: 'auto' }}
      >
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black dark:text-white">
            {script.title || "UNTITLED SHORT"}
          </h1>
          {script.logline && (
            <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 italic">
              {script.logline}
            </div>
          )}
        </div>

        {/* Scenes List */}
        {script.scenes && script.scenes.length > 0 ? (
          script.scenes.map((scene, sIdx) => (
            <div key={sIdx} className="space-y-3 pt-4">
              {/* Scene Slugline */}
              <div className="uppercase tracking-wide text-zinc-800 dark:text-zinc-400 pt-2">
                {scene.heading || `SCENE ${scene.scene_number}`}
              </div>

              {/* Scene Action Description */}
              {scene.action && (
                <div className="whitespace-pre-wrap max-w-[85ch]">
                  {scene.action}
                </div>
              )}

              {/* Dialogue Block */}
              {scene.dialogue && scene.dialogue.length > 0 && (
                <div className="space-y-2 pt-1">
                  {scene.dialogue.map((dlg, dIdx) => (
                    <div key={dIdx} className="max-w-[85ch]">
                      <span className="uppercase text-zinc-900 dark:text-zinc-200">{dlg.character}</span>
                      {' '}
                      <span className="text-zinc-900 dark:text-zinc-300">{dlg.line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-zinc-400 dark:text-zinc-600 italic">No scenes present in this screenplay.</div>
        )}
      </div>

      {/* Floating Bottom Studio Toolbar matching reference image (only rendered when showToolbar is true) */}
      {showToolbar && (
        <StudioToolbar
          projectId={projectId}
          activeStage="screenplay"
          versionText={`script • version ${version} of ${version}`}
          onExport={handleCopy}
          onStageChange={onStageChange}
        />
      )}

      {/* Edit Screenplay Modal */}
      {isEditModalOpen && (
        <EditScreenplayModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={projectId}
          conversationId={currentData.conversation_id}
          screenplayData={currentData}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
