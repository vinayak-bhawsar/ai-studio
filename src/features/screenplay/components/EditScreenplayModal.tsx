"use client";

import { useState } from "react";
import { Loader2, X, Plus, Trash2, Edit3, Film, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { screenplayService } from "../services/screenplayService";
import {
  ScreenplayContent,
  ScreenplayResponse,
  ScreenplayScene,
  DialogueLine,
} from "../types/screenplay";

interface EditScreenplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  conversationId: string;
  screenplayData: ScreenplayResponse;
  onSaveSuccess: (updated: ScreenplayResponse) => void;
}

export function EditScreenplayModal({
  isOpen,
  onClose,
  projectId,
  conversationId,
  screenplayData,
  onSaveSuccess,
}: EditScreenplayModalProps) {
  const { accessToken } = useAuth();
  const initialScript = screenplayData.screenplay;

  const [title, setTitle] = useState(initialScript.title || "UNTITLED SHORT");
  const [logline, setLogline] = useState(initialScript.logline || "");
  const [scenes, setScenes] = useState<ScreenplayScene[]>(
    initialScript.scenes && initialScript.scenes.length > 0
      ? initialScript.scenes
      : [
          {
            scene_number: 1,
            heading: "EXT. LOCATION - NIGHT",
            action: "Write your scene action description here...",
            dialogue: [{ character: "CHARACTER", line: "Dialogue line..." }],
          },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    setScenes((prev) => [
      ...prev,
      {
        scene_number: nextNum,
        heading: `INT. NEW SCENE ${nextNum} - DAY`,
        action: "",
        dialogue: [],
      },
    ]);
  };

  const handleRemoveScene = (idx: number) => {
    setScenes((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, scene_number: i + 1 }))
    );
  };

  const handleSceneChange = (idx: number, field: keyof ScreenplayScene, val: string) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  };

  const handleAddDialogue = (sceneIdx: number) => {
    setScenes((prev) =>
      prev.map((s, i) => {
        if (i !== sceneIdx) return s;
        return {
          ...s,
          dialogue: [...s.dialogue, { character: "CHARACTER", line: "" }],
        };
      })
    );
  };

  const handleRemoveDialogue = (sceneIdx: number, dlgIdx: number) => {
    setScenes((prev) =>
      prev.map((s, i) => {
        if (i !== sceneIdx) return s;
        return {
          ...s,
          dialogue: s.dialogue.filter((_, d) => d !== dlgIdx),
        };
      })
    );
  };

  const handleDialogueChange = (
    sceneIdx: number,
    dlgIdx: number,
    field: keyof DialogueLine,
    val: string
  ) => {
    setScenes((prev) =>
      prev.map((s, i) => {
        if (i !== sceneIdx) return s;
        const newDlg = s.dialogue.map((d, dIdx) =>
          dIdx === dlgIdx ? { ...d, [field]: val } : d
        );
        return { ...s, dialogue: newDlg };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !projectId || !conversationId) return;

    setErrorMessage(null);
    setIsSaving(true);

    const payload: ScreenplayContent = {
      title: title.trim() || "UNTITLED SHORT",
      logline: logline.trim(),
      characters: initialScript.characters || [],
      scenes: scenes.map((s, idx) => ({
        scene_number: idx + 1,
        heading: s.heading.trim() || `SCENE ${idx + 1}`,
        action: s.action.trim(),
        dialogue: s.dialogue
          .filter((d) => d.character.trim() && d.line.trim())
          .map((d) => ({
            character: d.character.trim().toUpperCase(),
            line: d.line.trim(),
          })),
      })),
    };

    try {
      const res = await screenplayService.updateScreenplay(
        projectId,
        conversationId,
        payload,
        accessToken
      );
      if (res && res.screenplay) {
        onSaveSuccess(res);
        onClose();
      } else {
        setErrorMessage("Failed to update screenplay. Please check fields.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while saving.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog Box */}
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Edit Screenplay</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Modify structured scenes, sluglines, and dialogue cues.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Logline */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Screenplay Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. UNTITLED SHORT"
                className="w-full px-3.5 py-2 text-xs font-mono border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600 text-zinc-900 dark:text-zinc-100 bg-transparent dark:bg-zinc-900 shadow-2xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Logline
              </label>
              <textarea
                rows={2}
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="Brief summary logline..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600 text-zinc-900 dark:text-zinc-100 bg-transparent dark:bg-zinc-900 shadow-2xs"
              />
            </div>
          </div>

          {/* Scenes Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Scenes ({scenes.length})
              </h4>
              <button
                type="button"
                onClick={handleAddScene}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>
            </div>

            <div className="space-y-6">
              {scenes.map((scene, sIdx) => (
                <div
                  key={sIdx}
                  className="p-4 bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700">
                      SCENE #{sIdx + 1}
                    </span>
                    {scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScene(sIdx)}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Remove scene"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Scene Heading Slugline */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Scene Heading (Slugline)
                    </label>
                    <input
                      type="text"
                      required
                      value={scene.heading}
                      onChange={(e) =>
                        handleSceneChange(sIdx, "heading", e.target.value)
                      }
                      placeholder="e.g. EXT. ABANDONED HOTEL - NIGHT"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-600 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Scene Action */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Action Description
                    </label>
                    <textarea
                      rows={3}
                      value={scene.action}
                      onChange={(e) =>
                        handleSceneChange(sIdx, "action", e.target.value)
                      }
                      placeholder="Describe what happens in the scene..."
                      className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-600 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  {/* Scene Dialogue Lines */}
                  <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Dialogue Lines
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddDialogue(sIdx)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </button>
                    </div>

                    {scene.dialogue?.map((dlg, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      >
                        <input
                          type="text"
                          value={dlg.character}
                          onChange={(e) =>
                            handleDialogueChange(
                              sIdx,
                              dIdx,
                              "character",
                              e.target.value
                            )
                          }
                          placeholder="CHARACTER"
                          className="w-32 px-2 py-1 text-xs font-mono font-bold uppercase border border-zinc-200 dark:border-zinc-600 rounded-md focus:outline-none focus:border-blue-600 text-zinc-900 dark:text-zinc-100 bg-transparent dark:bg-zinc-800"
                        />
                        <input
                          type="text"
                          value={dlg.line}
                          onChange={(e) =>
                            handleDialogueChange(
                              sIdx,
                              dIdx,
                              "line",
                              e.target.value
                            )
                          }
                          placeholder="Spoken dialogue line..."
                          className="flex-1 px-2 py-1 text-xs font-mono border border-zinc-200 dark:border-zinc-600 rounded-md focus:outline-none focus:border-blue-600 text-zinc-800 dark:text-zinc-200 bg-transparent dark:bg-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDialogue(sIdx, dIdx)}
                          className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Screenplay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
