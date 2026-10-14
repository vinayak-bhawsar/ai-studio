"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Layers,
  Wand2,
  Sparkles,
  Plus,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Video,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Clapperboard,
  SkipForward,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import {
  StoryboardResponse,
  SceneResponse,
  ShotResponse,
  SceneCreateRequest,
  SceneUpdateRequest,
  ShotCreateRequest,
  ShotUpdateRequest,
} from "../types/storyboard";
import { storyboardService, resolveMediaUrl } from "../services/storyboardService";
import { SceneModal } from "./SceneModal";
import { ShotModal } from "./ShotModal";
import { StoryboardShimmer } from "@/src/components/shared/StudioShimmers";

interface HyperdreamStoryboardProps {
  projectId: string;
  storyboard: StoryboardResponse | null;
  onStoryboardUpdated: (data: StoryboardResponse) => void;
  isLoadingStoryboard?: boolean;
  onNavigateToProduction?: (sceneId: string, shotId: string) => void;
  onSkip?: () => void;
  fetchError?: string | null;
  onRetry?: () => void;
}

export function HyperdreamStoryboard({
  projectId,
  storyboard,
  onStoryboardUpdated,
  isLoadingStoryboard = false,
  onNavigateToProduction,
  onSkip,
  fetchError,
  onRetry,
}: HyperdreamStoryboardProps) {
  const { accessToken } = useAuth();

  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Per-shot frame generating tracking
  const [generatingFramesMap, setGeneratingFramesMap] = useState<
    Record<string, "start" | "end" | null>
  >({});
  const [frameErrorMap, setFrameErrorMap] = useState<Record<string, string>>({});

  // Batch frame generating (Render All Frames button)
  const [isBatchGeneratingFrames, setIsBatchGeneratingFrames] = useState(false);
  const [batchFrameMessage, setBatchFrameMessage] = useState<string | null>(null);

  // Top-Level Bulk Image Generating (Generate / Regenerate Images across all scenes)
  const [isBulkGeneratingImages, setIsBulkGeneratingImages] = useState(false);
  const [bulkImageProgress, setBulkImageProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [bulkImageMessage, setBulkImageMessage] = useState<string | null>(null);
  const [bulkImageError, setBulkImageError] = useState<string | null>(null);
  const [failedShotFrames, setFailedShotFrames] = useState<
    Array<{ shot: ShotResponse; frameType: "start" | "end"; error: string }>
  >([]);

  // Storyboard ref to always read latest data during async batch loop
  const storyboardRef = useRef(storyboard);
  useEffect(() => {
    storyboardRef.current = storyboard;
  }, [storyboard]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Modals state
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [sceneModalMode, setSceneModalMode] = useState<"create" | "edit">("create");
  const [editingScene, setEditingScene] = useState<SceneResponse | null>(null);

  const [isShotModalOpen, setIsShotModalOpen] = useState(false);
  const [shotModalMode, setShotModalMode] = useState<"create" | "edit">("create");
  const [editingShot, setEditingShot] = useState<ShotResponse | null>(null);

  const scenes = useMemo(() => {
    if (!storyboard || !storyboard.scenes) return [];
    return [...storyboard.scenes].sort((a, b) => a.scene_number - b.scene_number);
  }, [storyboard]);

  const currentScene: SceneResponse | null = useMemo(() => {
    if (scenes.length === 0) return null;
    const clampedIndex = Math.min(selectedSceneIndex, scenes.length - 1);
    return scenes[clampedIndex] || null;
  }, [scenes, selectedSceneIndex]);

  const currentShots: ShotResponse[] = useMemo(() => {
    if (!currentScene || !currentScene.shots) return [];
    return [...currentScene.shots].sort((a, b) => a.shot_number - b.shot_number);
  }, [currentScene]);

  // All shots across all scenes in project
  const allShots = useMemo(() => {
    if (!storyboard || !storyboard.scenes) return [];
    return storyboard.scenes.flatMap((sc) => sc.shots || []);
  }, [storyboard]);

  // Check if every shot in project already has both start and end frames
  const isAllImagesExist = useMemo(() => {
    if (allShots.length === 0) return false;
    return allShots.every(
      (sh) => Boolean(sh.start_frame_url) && Boolean(sh.end_frame_url)
    );
  }, [allShots]);

  // Helper to immutably update a shot's image in the storyboard state in real time
  const updateShotInStoryboard = useCallback(
    (shotId: string, frameType: "start" | "end", imageUrl: string) => {
      const currentSb = storyboardRef.current;
      if (!currentSb || !currentSb.scenes) return;

      const updatedScenes = currentSb.scenes.map((scene) => {
        const hasShot = scene.shots?.some((s) => s.id === shotId);
        if (!hasShot) return scene;

        const updatedShots = scene.shots?.map((shot) => {
          if (shot.id === shotId) {
            return {
              ...shot,
              [frameType === "start" ? "start_frame_url" : "end_frame_url"]: imageUrl,
            };
          }
          return shot;
        });

        return {
          ...scene,
          shots: updatedShots,
        };
      });

      const updatedSb: StoryboardResponse = {
        ...currentSb,
        scenes: updatedScenes,
      };

      storyboardRef.current = updatedSb;
      onStoryboardUpdated(updatedSb);
    },
    [onStoryboardUpdated]
  );

  // Handle Generate Storyboard from Screenplay
  const handleGenerateStoryboard = async (forceRegenerate: boolean = false) => {
    if (!accessToken || !projectId || isGeneratingStoryboard) return;

    setIsGeneratingStoryboard(true);
    setGenerateError(null);
    try {
      const data = await storyboardService.generateStoryboard(
        projectId,
        { force_regenerate: forceRegenerate },
        accessToken
      );
      onStoryboardUpdated(data);
      setSelectedSceneIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate storyboard";
      setGenerateError(msg);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Generate Frame for specific shot
  const handleGenerateFrame = async (
    shot: ShotResponse,
    frameType: "start" | "end"
  ) => {
    if (!accessToken || !projectId) return;

    setGeneratingFramesMap((prev) => ({ ...prev, [shot.id]: frameType }));
    setFrameErrorMap((prev) => {
      const updated = { ...prev };
      delete updated[shot.id];
      return updated;
    });

    try {
      await storyboardService.generateShotFrame(
        projectId,
        shot.id,
        { frame_type: frameType, force_regenerate: true },
        accessToken
      );

      // Refresh full storyboard to sync persistence
      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      onStoryboardUpdated(freshSb);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to render frame";
      setFrameErrorMap((prev) => ({ ...prev, [shot.id]: msg }));
    } finally {
      setGeneratingFramesMap((prev) => {
        const updated = { ...prev };
        delete updated[shot.id];
        return updated;
      });
    }
  };

  // Batch Frame Generation for all shots in current scene or all scenes
  const handleBatchGenerateFrames = async () => {
    if (!accessToken || !projectId || isBatchGeneratingFrames) return;

    setIsBatchGeneratingFrames(true);
    setBatchFrameMessage("Rendering visual start frames with Nano Banana...");
    try {
      const res = await storyboardService.generateFramesBatch(
        projectId,
        { frame_type: "start", force_regenerate: false },
        accessToken
      );

      setBatchFrameMessage(
        `Batch completed: ${res.completed}/${res.total} start frames generated.`
      );

      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      onStoryboardUpdated(freshSb);

      setTimeout(() => setBatchFrameMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to batch render frames";
      setBatchFrameMessage(`Error: ${msg}`);
    } finally {
      setIsBatchGeneratingFrames(false);
    }
  };

  // Top-Level Bulk Image Generation (orchestrates start and end frame generation across all scenes)
  interface FrameTask {
    shot: ShotResponse;
    sceneNumber: number;
    frameType: "start" | "end";
    force: boolean;
  }

  const executeImageTasks = async (tasks: FrameTask[]) => {
    if (!accessToken || !projectId || tasks.length === 0) return;

    setIsBulkGeneratingImages(true);
    setBulkImageError(null);
    setBulkImageProgress({ current: 0, total: tasks.length });

    let completedCount = 0;
    const failures: Array<{ shot: ShotResponse; frameType: "start" | "end"; error: string }> = [];

    for (let i = 0; i < tasks.length; i++) {
      if (!isMountedRef.current) break;

      const task = tasks[i];
      const shotLabel = `Shot #${task.shot.shot_number} ${task.frameType === "start" ? "Start" : "End"} Frame`;
      setBulkImageProgress({ current: i + 1, total: tasks.length });
      setBulkImageMessage(
        `Generating images: ${i + 1}/${tasks.length} (Scene ${task.sceneNumber}, ${shotLabel})...`
      );

      // Indicate loading on the specific shot card frame
      setGeneratingFramesMap((prev) => ({ ...prev, [task.shot.id]: task.frameType }));

      try {
        const res = await storyboardService.generateShotFrame(
          projectId,
          task.shot.id,
          { frame_type: task.frameType, force_regenerate: task.force },
          accessToken
        );

        completedCount++;

        // Immediately update this shot's image in the storyboard state
        if (res.image_url) {
          updateShotInStoryboard(task.shot.id, task.frameType, res.image_url);
        }

        // Clear any previous error for this shot
        setFrameErrorMap((prev) => {
          const updated = { ...prev };
          delete updated[task.shot.id];
          return updated;
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to generate image";
        failures.push({ shot: task.shot, frameType: task.frameType, error: errMsg });
        setFrameErrorMap((prev) => ({
          ...prev,
          [task.shot.id]: `${task.frameType} frame: ${errMsg}`,
        }));
      } finally {
        setGeneratingFramesMap((prev) => {
          const updated = { ...prev };
          delete updated[task.shot.id];
          return updated;
        });
      }
    }

    if (!isMountedRef.current) return;

    // Synchronize full storyboard with backend after batch completes
    try {
      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      if (isMountedRef.current) {
        storyboardRef.current = freshSb;
        onStoryboardUpdated(freshSb);
      }
    } catch (e) {
      console.error("Failed to sync fresh storyboard after bulk generation:", e);
    }

    if (failures.length === 0) {
      setBulkImageMessage(
        `Successfully generated all ${completedCount} images across all scenes.`
      );
      setBulkImageError(null);
      setFailedShotFrames([]);
      setTimeout(() => {
        if (isMountedRef.current) setBulkImageMessage(null);
      }, 5000);
    } else if (completedCount > 0) {
      setBulkImageMessage(null);
      setBulkImageError(
        `Generated ${completedCount}/${tasks.length} images. ${failures.length} frame(s) failed.`
      );
      setFailedShotFrames(failures);
    } else {
      setBulkImageMessage(null);
      setBulkImageError(
        `Failed to generate images: ${failures[0]?.error || "Unknown error"}.`
      );
      setFailedShotFrames(failures);
    }

    setIsBulkGeneratingImages(false);
    setBulkImageProgress(null);
  };

  const handleGenerateAllImages = async (forceRegenerate: boolean = false) => {
    if (!accessToken || !projectId || isBulkGeneratingImages) return;

    const currentSb = storyboardRef.current || storyboard;
    const scenesList = currentSb?.scenes || [];

    const tasks: FrameTask[] = [];

    for (const sc of scenesList) {
      const scShots = sc.shots || [];
      for (const sh of scShots) {
        if (forceRegenerate) {
          // If force regeneration requested (or all already exist), regenerate both
          tasks.push({ shot: sh, sceneNumber: sc.scene_number, frameType: "start", force: true });
          tasks.push({ shot: sh, sceneNumber: sc.scene_number, frameType: "end", force: true });
        } else {
          // Otherwise generate missing ones
          if (!sh.start_frame_url) {
            tasks.push({ shot: sh, sceneNumber: sc.scene_number, frameType: "start", force: false });
          }
          if (!sh.end_frame_url) {
            tasks.push({ shot: sh, sceneNumber: sc.scene_number, frameType: "end", force: false });
          }
        }
      }
    }

    if (tasks.length === 0) {
      setBulkImageMessage("All shots already have start and end frame images.");
      setTimeout(() => setBulkImageMessage(null), 4000);
      return;
    }

    await executeImageTasks(tasks);
  };

  const handleRetryFailedImages = async () => {
    if (failedShotFrames.length === 0 || isBulkGeneratingImages) return;
    const retryTasks: FrameTask[] = failedShotFrames.map((f) => ({
      shot: f.shot,
      sceneNumber: 1,
      frameType: f.frameType,
      force: true,
    }));
    await executeImageTasks(retryTasks);
  };

  // Scene CRUD
  const handleOpenAddScene = () => {
    setEditingScene(null);
    setSceneModalMode("create");
    setIsSceneModalOpen(true);
  };

  const handleOpenEditScene = (sc: SceneResponse) => {
    setEditingScene(sc);
    setSceneModalMode("edit");
    setIsSceneModalOpen(true);
  };

  const handleSceneModalSubmit = async (
    data: SceneCreateRequest | SceneUpdateRequest
  ) => {
    if (!accessToken || !projectId) return;

    if (sceneModalMode === "create") {
      await storyboardService.createScene(
        projectId,
        data as SceneCreateRequest,
        accessToken
      );
    } else if (editingScene) {
      await storyboardService.updateScene(
        projectId,
        editingScene.id,
        data as SceneUpdateRequest,
        accessToken
      );
    }

    const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
    onStoryboardUpdated(freshSb);
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!accessToken || !projectId) return;
    if (!confirm("Are you sure you want to delete this scene and all its shots?")) {
      return;
    }

    try {
      await storyboardService.deleteScene(projectId, sceneId, accessToken);
      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      onStoryboardUpdated(freshSb);
      setSelectedSceneIndex(0);
    } catch (err) {
      console.error("Failed to delete scene:", err);
    }
  };

  // Shot CRUD
  const handleOpenAddShot = () => {
    setEditingShot(null);
    setShotModalMode("create");
    setIsShotModalOpen(true);
  };

  const handleOpenEditShot = (sh: ShotResponse) => {
    setEditingShot(sh);
    setShotModalMode("edit");
    setIsShotModalOpen(true);
  };

  const handleShotModalSubmit = async (
    data: ShotCreateRequest | ShotUpdateRequest
  ) => {
    if (!accessToken || !projectId || !currentScene) return;

    if (shotModalMode === "create") {
      await storyboardService.createShot(
        projectId,
        currentScene.id,
        data as ShotCreateRequest,
        accessToken
      );
    } else if (editingShot) {
      await storyboardService.updateShot(
        projectId,
        editingShot.id,
        data as ShotUpdateRequest,
        accessToken
      );
    }

    const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
    onStoryboardUpdated(freshSb);
  };

  const handleDeleteShot = async (shotId: string) => {
    if (!accessToken || !projectId) return;
    if (!confirm("Are you sure you want to delete this visual shot?")) return;

    try {
      await storyboardService.deleteShot(projectId, shotId, accessToken);
      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      onStoryboardUpdated(freshSb);
    } catch (err) {
      console.error("Failed to delete shot:", err);
    }
  };

  const handleMoveShot = async (
    shot: ShotResponse,
    direction: "up" | "down"
  ) => {
    if (!accessToken || !projectId || currentShots.length < 2) return;

    const currentIndex = currentShots.findIndex((s) => s.id === shot.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentShots.length) return;

    const otherShot = currentShots[targetIndex];

    try {
      // Swap shot numbers
      await storyboardService.updateShot(
        projectId,
        shot.id,
        { shot_number: otherShot.shot_number },
        accessToken
      );
      await storyboardService.updateShot(
        projectId,
        otherShot.id,
        { shot_number: shot.shot_number },
        accessToken
      );

      const freshSb = await storyboardService.getStoryboard(projectId, accessToken);
      onStoryboardUpdated(freshSb);
    } catch (err) {
      console.error("Failed to reorder shots:", err);
    }
  };

  if (isLoadingStoryboard || isGeneratingStoryboard) {
    return (
      <StoryboardShimmer
        message="AI is translating scenes into cinematic storyboard sequences..."
      />
    );
  }

  // Error State: Failed to load storyboard
  if (fetchError && (!storyboard || scenes.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto w-full py-12 px-4">
        <div className="p-8 border border-red-200 dark:border-red-900 rounded-3xl bg-red-50/50 dark:bg-red-950/20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 mb-3 shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Failed to Load Storyboard
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 max-w-md mb-5 leading-relaxed">
            {fetchError}
          </p>
          <div className="flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Retry Loading
              </button>
            )}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Skip for Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty State: No Scenes Yet
  if (!storyboard || scenes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto w-full py-12 px-4">
        <div className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            No Storyboard Generated Yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Translate your screenplay scenes into visual shot compositions, camera framings, and start/end frame references.
          </p>

          {generateError && (
            <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 max-w-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generateError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-zinc-500" />
                <span>Skip for Now</span>
              </button>
            )}

            <button
              onClick={() => handleGenerateStoryboard(false)}
              disabled={isGeneratingStoryboard}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingStoryboard ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating Screenplay...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Storyboard</span>
                </>
              )}
            </button>
            <button
              onClick={handleOpenAddScene}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scene Manually</span>
            </button>
          </div>
        </div>

        <SceneModal
          isOpen={isSceneModalOpen}
          onClose={() => setIsSceneModalOpen(false)}
          onSubmit={handleSceneModalSubmit}
          initialData={editingScene}
          mode={sceneModalMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Storyboard Sequences
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {scenes.length} Scenes • {storyboard.total_shots || 0} Shots
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visual composition guides and reference keyframes derived from your screenplay.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Skip Storyboard and proceed to Production Studio"
            >
              <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
              <span>Skip for Now</span>
            </button>
          )}

          {bulkImageMessage && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse mr-2">
              {bulkImageMessage}
            </span>
          )}

          {batchFrameMessage && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse mr-2">
              {batchFrameMessage}
            </span>
          )}

          <button
            onClick={handleBatchGenerateFrames}
            disabled={isBatchGeneratingFrames || isBulkGeneratingImages}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Generate start frames for all shots"
          >
            {isBatchGeneratingFrames ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Render All Frames</span>
          </button>

          <button
            onClick={() => handleGenerateAllImages(isAllImagesExist)}
            disabled={isBulkGeneratingImages || isBatchGeneratingFrames || isGeneratingStoryboard}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={
              isAllImagesExist
                ? "Regenerate all storyboard start and end frames across all scenes"
                : "Generate all required storyboard start and end frames across all scenes"
            }
          >
            {isBulkGeneratingImages ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isBulkGeneratingImages
                ? bulkImageProgress
                  ? `Images (${bulkImageProgress.current}/${bulkImageProgress.total})`
                  : "Generating..."
                : isAllImagesExist
                ? "Regenerate"
                : "Generate"}
            </span>
          </button>

          <button
            onClick={handleOpenAddScene}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {bulkImageError && (
        <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bulkImageError}</span>
          </div>
          {failedShotFrames.length > 0 && !isBulkGeneratingImages && (
            <button
              onClick={handleRetryFailedImages}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Retry Failed ({failedShotFrames.length})
            </button>
          )}
        </div>
      )}

      {generateError && (
        <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

      {/* Main Layout: Scenes Tabs + Scene Shots Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scene Selector Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Scenes List
            </span>
            <span className="text-xs text-zinc-400">
              {scenes.length} {scenes.length === 1 ? "Scene" : "Scenes"}
            </span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {scenes.map((sc, idx) => {
              const isSelected = idx === selectedSceneIndex;
              const shotCount = sc.shots?.length || 0;
              const hasStartFrames =
                sc.shots?.filter((s) => Boolean(s.start_frame_url)).length || 0;

              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs"
                      : "bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Scene {sc.scene_number}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditScene(sc);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit scene heading"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(sc.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete scene"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1 font-mono">
                    {sc.heading}
                  </h4>

                  {sc.description && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                      {sc.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span>
                      {shotCount} {shotCount === 1 ? "shot" : "shots"}
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{hasStartFrames}/{shotCount} keyframes</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Scene Shots Board (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentScene && (
            <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono">
                    SCENE {currentScene.scene_number}
                  </span>
                  <h3 className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                    {currentScene.heading}
                  </h3>
                </div>
                {currentScene.narrative_purpose && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Goal:</span>{" "}
                    {currentScene.narrative_purpose}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddShot}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shot</span>
                </button>
              </div>
            </div>
          )}

          {/* Shots List */}
          {currentShots.length === 0 ? (
            <div className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-center">
              <Clapperboard className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                No visual shots in this scene yet
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                Add camera angles and framing breakdown for Scene {currentScene?.scene_number}.
              </p>
              <button
                onClick={handleOpenAddShot}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Shot</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentShots.map((shot, idx) => {
                const isGeneratingFrame = generatingFramesMap[shot.id];
                const frameErr = frameErrorMap[shot.id];
                const startImageUrl = resolveMediaUrl(shot.start_frame_url);
                const endImageUrl = resolveMediaUrl(shot.end_frame_url);

                return (
                  <div
                    key={shot.id}
                    onClick={() => setSelectedShotId(shot.id)}
                    className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all space-y-4 cursor-pointer ${
                      selectedShotId === shot.id
                        ? "border-blue-500 ring-1 ring-blue-500/20 shadow-sm"
                        : "border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Shot Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono">
                          Shot #{shot.shot_number}
                        </span>
                        {shot.camera_framing && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {shot.camera_framing}
                          </span>
                        )}
                        {shot.camera_movement && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {shot.camera_movement}
                          </span>
                        )}
                        {shot.camera_angle && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {shot.camera_angle}
                          </span>
                        )}
                      </div>

                      {/* Controls: Reorder, Edit, Delete, Production */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveShot(shot, "up")}
                          disabled={idx === 0}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                          title="Move Shot Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveShot(shot, "down")}
                          disabled={idx === currentShots.length - 1}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                          title="Move Shot Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditShot(shot)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          title="Edit Shot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShot(shot.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Delete Shot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {onNavigateToProduction && currentScene && (
                          <button
                            onClick={() =>
                              onNavigateToProduction(currentScene.id, shot.id)
                            }
                            className="ml-2 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Open this shot in Production Studio"
                          >
                            <Video className="w-3 h-3 text-purple-600" />
                            <span>Produce Video</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Frame Visuals Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Frame */}
                      <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden flex flex-col">
                        <div className="h-44 relative bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {startImageUrl ? (
                            <img
                              src={startImageUrl}
                              alt={`Shot #${shot.shot_number} Start Frame`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                              <span className="text-[11px] font-semibold text-zinc-500">
                                No Start Frame Rendered
                              </span>
                            </div>
                          )}

                          {isGeneratingFrame === "start" && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
                              <span className="text-xs font-semibold">
                                Rendering Start Frame...
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              Start Frame
                            </span>
                            {startImageUrl && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            )}
                          </div>
                          <button
                            onClick={() => handleGenerateFrame(shot, "start")}
                            disabled={Boolean(isGeneratingFrame)}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>{startImageUrl ? "Regenerate" : "Generate"}</span>
                          </button>
                        </div>
                      </div>

                      {/* End Frame (Optional) */}
                      <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden flex flex-col">
                        <div className="h-44 relative bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {endImageUrl ? (
                            <img
                              src={endImageUrl}
                              alt={`Shot #${shot.shot_number} End Frame`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                              <span className="text-[11px] font-semibold text-zinc-500">
                                Optional End Frame
                              </span>
                            </div>
                          )}

                          {isGeneratingFrame === "end" && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
                              <span className="text-xs font-semibold">
                                Rendering End Frame...
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              End Frame
                            </span>
                            {endImageUrl && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            )}
                          </div>
                          <button
                            onClick={() => handleGenerateFrame(shot, "end")}
                            disabled={Boolean(isGeneratingFrame)}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>{endImageUrl ? "Regenerate" : "Generate"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {frameErr && (
                      <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{frameErr}</span>
                      </div>
                    )}

                    {/* Shot Text Content */}
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          Description:
                        </span>{" "}
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {shot.description}
                        </span>
                      </div>

                      {shot.action && (
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            Action:
                          </span>{" "}
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {shot.action}
                          </span>
                        </div>
                      )}

                      {shot.composition && (
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            Composition:
                          </span>{" "}
                          <span className="text-zinc-600 dark:text-zinc-400 italic">
                            {shot.composition}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SceneModal
        isOpen={isSceneModalOpen}
        onClose={() => setIsSceneModalOpen(false)}
        onSubmit={handleSceneModalSubmit}
        initialData={editingScene}
        mode={sceneModalMode}
      />

      <ShotModal
        isOpen={isShotModalOpen}
        onClose={() => setIsShotModalOpen(false)}
        onSubmit={handleShotModalSubmit}
        initialData={editingShot}
        mode={shotModalMode}
        sceneHeading={currentScene?.heading}
      />
    </div>
  );
}
