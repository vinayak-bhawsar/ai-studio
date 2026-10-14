"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Clapperboard,
  Video,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Film,
  Layers,
  Settings,
  User,
  Users,
  MapPin,
  RefreshCw,
  Sliders,
  AlertTriangle,
  SkipForward,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { SceneResponse, ShotResponse } from "@/src/features/storyboard/types/storyboard";
import { resolveMediaUrl } from "@/src/features/storyboard/services/storyboardService";
import {
  ProductionShotConfigResponse,
  ProductionSettingsUpdateRequest,
  ProductionSettings,
  VideoComposeResponse,
} from "../types/production";
import { productionService } from "../services/productionService";
import { FullVideoCompositionModal } from "./FullVideoCompositionModal";
import { ShotDialogueSection } from "./ShotDialogueSection";

interface HyperdreamProductionStudioProps {
  projectId: string;
  scenes: SceneResponse[];
  initialSceneId?: string | null;
  initialShotId?: string | null;
  onNavigateToStoryboard?: () => void;
  onRefreshScenes?: () => Promise<void>;
  onSkip?: () => void;
}

export function HyperdreamProductionStudio({
  projectId,
  scenes,
  initialSceneId,
  initialShotId,
  onNavigateToStoryboard,
  onRefreshScenes,
  onSkip,
}: HyperdreamProductionStudioProps) {
  const { accessToken } = useAuth();

  // Scene and Shot selection
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    initialSceneId || scenes[0]?.id || null
  );
  const [selectedShotId, setSelectedShotId] = useState<string | null>(
    initialShotId || null
  );

  // Sync if scenes load or change
  useEffect(() => {
    if (!selectedSceneId && scenes.length > 0) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const currentScene: SceneResponse | null = useMemo(() => {
    return scenes.find((s) => s.id === selectedSceneId) || scenes[0] || null;
  }, [scenes, selectedSceneId]);

  const currentShots: ShotResponse[] = useMemo(() => {
    if (!currentScene || !currentScene.shots) return [];
    return [...currentScene.shots].sort((a, b) => a.shot_number - b.shot_number);
  }, [currentScene]);

  // Sync shot selection
  useEffect(() => {
    if (currentShots.length > 0) {
      const exists = currentShots.some((s) => s.id === selectedShotId);
      if (!exists) {
        setSelectedShotId(currentShots[0].id);
      }
    } else {
      setSelectedShotId(null);
    }
  }, [currentShots, selectedShotId]);

  const currentShot: ShotResponse | null = useMemo(() => {
    return currentShots.find((s) => s.id === selectedShotId) || currentShots[0] || null;
  }, [currentShots, selectedShotId]);

  // Loaded Shot Production Config State
  const [shotConfig, setShotConfig] = useState<ProductionShotConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form Edit State for Production Settings
  const [duration, setDuration] = useState<number>(4);
  const [resolution, setResolution] = useState<"720p">("720p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [motionIntensity, setMotionIntensity] = useState<string>("dynamic");
  const [promptOverride, setPromptOverride] = useState<string>("");

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Single Video Generation State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerateError, setVideoGenerateError] = useState<string | null>(null);

  // Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  // Full Video Composition State
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [compositionData, setCompositionData] = useState<VideoComposeResponse | null>(null);

  // Shot Tab & Dialogue State
  const [shotTab, setShotTab] = useState<"settings" | "dialogue">("dialogue");
  const [dubbedVideoUrl, setDubbedVideoUrl] = useState<string | null>(null);
  const [isPopulatingDialogues, setIsPopulatingDialogues] = useState(false);
  const [populateToolbarMsg, setPopulateToolbarMsg] = useState<string | null>(null);

  // Reset dubbed video override when active shot changes
  useEffect(() => {
    setDubbedVideoUrl(null);
  }, [selectedShotId]);

  const handlePopulateDialoguesFromToolbar = async () => {
    if (!accessToken || !projectId || isPopulatingDialogues) return;
    setIsPopulatingDialogues(true);
    setPopulateToolbarMsg(null);
    try {
      const res = await productionService.populateDialogues(projectId, accessToken);
      setPopulateToolbarMsg(res.message || `Mapped ${res.populated_dialogues} dialogues into shots.`);
      if (onRefreshScenes) {
        await onRefreshScenes();
      }
      setTimeout(() => setPopulateToolbarMsg(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to populate dialogues";
      setPopulateToolbarMsg(`Error: ${msg}`);
      setTimeout(() => setPopulateToolbarMsg(null), 6000);
    } finally {
      setIsPopulatingDialogues(false);
    }
  };

  // Load initial composition status to know if a master video is available
  useEffect(() => {
    let isCancelled = false;
    if (!accessToken || !projectId) return;

    productionService
      .getComposition(projectId, accessToken)
      .then((data) => {
        if (!isCancelled && data) {
          setCompositionData(data);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [projectId, accessToken]);

  // Polling refs
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const isPollInFlightRef = useRef(false);

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollCountRef.current = 0;
    isPollInFlightRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // Load Production Config whenever selected shot changes
  useEffect(() => {
    let isCancelled = false;
    clearPolling();

    if (!accessToken || !projectId || !currentShot) {
      setShotConfig(null);
      return;
    }

    const loadConfig = async () => {
      setIsLoadingConfig(true);
      setConfigError(null);
      setVideoGenerateError(null);
      try {
        const config = await productionService.getProductionConfig(
          projectId,
          currentShot.id,
          accessToken
        );

        if (!isCancelled) {
          setShotConfig(config);

          // Populate form settings
          const s = config.production_settings;
          setDuration(s?.duration_seconds && [4, 5, 6, 8].includes(s.duration_seconds) ? s.duration_seconds : 4);
          setResolution("720p");
          setAspectRatio(
            s?.aspect_ratio === "9:16" || s?.aspect_ratio === "1:1"
              ? s.aspect_ratio
              : "16:9"
          );
          setMotionIntensity(s?.motion_intensity || "dynamic");
          setPromptOverride(s?.prompt_override || "");

          // Only poll if video generation is actively running ("generating")
          if (config.video_status === "generating") {
            setIsGeneratingVideo(true);
            startPolling(currentShot.id);
          } else {
            clearPolling();
            setIsGeneratingVideo(false);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load shot production config";
          setConfigError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConfig(false);
        }
      }
    };

    loadConfig();

    return () => {
      isCancelled = true;
      clearPolling();
    };
  }, [projectId, currentShot?.id, accessToken, clearPolling]);

  // Polling function for async video generation
  const startPolling = useCallback(
    (shotId: string) => {
      clearPolling();
      if (!accessToken || !projectId) return;

      setIsGeneratingVideo(true);
      pollCountRef.current = 0;

      pollingTimerRef.current = setInterval(async () => {
        // Prevent overlapping requests if a previous poll request is still in flight
        if (isPollInFlightRef.current) return;

        // Safety timeout: stop after 60 polls (approx. 3 minutes)
        pollCountRef.current += 1;
        if (pollCountRef.current > 60) {
          console.warn("Polling timed out for shot video status:", shotId);
          clearPolling();
          setIsGeneratingVideo(false);
          setVideoGenerateError("Video generation status check timed out. Please refresh or check status again.");
          return;
        }

        isPollInFlightRef.current = true;
        try {
          const statusRes = await productionService.getVideoStatus(
            projectId,
            shotId,
            accessToken
          );

          if (statusRes.status === "completed" || statusRes.status === "failed") {
            clearPolling();
            setIsGeneratingVideo(false);

            // Refetch fresh config to sync video_url and status
            const freshConfig = await productionService.getProductionConfig(
              projectId,
              shotId,
              accessToken
            );
            setShotConfig(freshConfig);

            if (statusRes.status === "failed") {
              setVideoGenerateError(statusRes.message || "Video generation failed.");
            }

            if (onRefreshScenes) {
              onRefreshScenes();
            }
          } else if (statusRes.status !== "generating") {
            // Stop polling immediately if status is not actively generating (e.g. pending, skipped)
            clearPolling();
            setIsGeneratingVideo(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearPolling();
          setIsGeneratingVideo(false);
        } finally {
          isPollInFlightRef.current = false;
        }
      }, 3000);
    },
    [projectId, accessToken, clearPolling, onRefreshScenes]
  );

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accessToken || !projectId || !currentShot || isSavingConfig) return;

    setIsSavingConfig(true);
    setConfigSaveSuccess(false);
    setConfigError(null);

    const updatePayload: ProductionSettingsUpdateRequest = {
      duration_seconds: duration,
      resolution,
      aspect_ratio: aspectRatio,
      motion_intensity: motionIntensity,
      prompt_override: promptOverride.trim() || null,
    };

    try {
      const updated = await productionService.updateProductionConfig(
        projectId,
        currentShot.id,
        updatePayload,
        accessToken
      );
      setShotConfig(updated);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update production settings";
      setConfigError(msg);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Generate Single Shot Video
  const handleGenerateVideo = async () => {
    if (!accessToken || !projectId || !currentShot || isGeneratingVideo) return;

    // Check start frame prerequisite
    const hasStartFrame = shotConfig?.has_start_frame || Boolean(currentShot.start_frame_url);
    if (!hasStartFrame) {
      setVideoGenerateError(
        "A start frame is required before generating video. Please render the start frame in Storyboard."
      );
      return;
    }

    setIsGeneratingVideo(true);
    setVideoGenerateError(null);

    try {
      const res = await productionService.generateVideo(
        projectId,
        currentShot.id,
        {
          force_regenerate: true,
          duration_seconds: duration,
          resolution,
          aspect_ratio: aspectRatio,
          instructions: promptOverride.trim() || undefined,
          require_start_frame: true,
        },
        accessToken
      );

      if (res.status === "completed") {
        setIsGeneratingVideo(false);
        const freshConfig = await productionService.getProductionConfig(
          projectId,
          currentShot.id,
          accessToken
        );
        setShotConfig(freshConfig);
        if (onRefreshScenes) onRefreshScenes();
      } else if (res.status === "generating") {
        // Start polling for completion
        startPolling(currentShot.id);
      } else if (res.status === "failed") {
        setIsGeneratingVideo(false);
        setVideoGenerateError(res.message || "Video generation failed.");
      } else {
        // Any other non-generating status (e.g. skipped, pending idle)
        setIsGeneratingVideo(false);
        const freshConfig = await productionService.getProductionConfig(
          projectId,
          currentShot.id,
          accessToken
        );
        setShotConfig(freshConfig);
      }
    } catch (err: unknown) {
      setIsGeneratingVideo(false);
      const msg = err instanceof Error ? err.message : "Failed to request video generation";
      setVideoGenerateError(msg);
    }
  };

  // Batch Render Videos for current scene
  const handleBatchGenerateCurrentScene = async () => {
    if (!accessToken || !projectId || isBatchGenerating || currentShots.length === 0) {
      return;
    }

    const shotIds = currentShots.map((s) => s.id);

    setIsBatchGenerating(true);
    setBatchMessage("Rendering scene shot videos with Veo...");

    try {
      const res = await productionService.generateVideosBatch(
        projectId,
        {
          shot_ids: shotIds,
          force_regenerate: false,
          duration_seconds: duration,
          resolution,
          aspect_ratio: aspectRatio,
          require_start_frame: false,
        },
        accessToken
      );

      setBatchMessage(
        `Batch complete: ${res.completed} ready, ${res.skipped} preserved, ${res.failed} failed.`
      );

      if (currentShot) {
        const freshConfig = await productionService.getProductionConfig(
          projectId,
          currentShot.id,
          accessToken
        );
        setShotConfig(freshConfig);
      }

      if (onRefreshScenes) onRefreshScenes();
      setTimeout(() => setBatchMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Batch video generation failed";
      setBatchMessage(`Error: ${msg}`);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  if (scenes.length === 0) {
    return (
      <div className="p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-12">
        <Clapperboard className="w-12 h-12 text-zinc-400 mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          No Storyboard Scenes Available
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
          Create or generate storyboard scenes first to set up your camera shots and visual references.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {onNavigateToStoryboard && (
            <button
              onClick={onNavigateToStoryboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Go to Storyboard</span>
            </button>
          )}

          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
              <span>Skip for Now</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const startFrameUrl = resolveMediaUrl(
    shotConfig?.start_frame_url || currentShot?.start_frame_url
  );
  const videoUrl = resolveMediaUrl(
    dubbedVideoUrl || shotConfig?.video_url || currentShot?.video_url
  );
  const isVideoCompleted =
    shotConfig?.video_status === "completed" ||
    (currentShot?.video_status === "completed" && Boolean(videoUrl));

  const hasStartFrame =
    shotConfig?.has_start_frame || Boolean(currentShot?.start_frame_url);

  return (
    <div className="space-y-6">
      {/* Top Studio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Production Studio
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Veo AI Video & Dialogue Dubbing
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure camera settings, generate character voices, mix audio, and assemble master film clips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Skip Production Studio and proceed to Video Editor"
            >
              <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
              <span>Skip for Now</span>
            </button>
          )}

          {batchMessage && (
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 mr-2 animate-pulse">
              {batchMessage}
            </span>
          )}

          <button
            onClick={handlePopulateDialoguesFromToolbar}
            disabled={isPopulatingDialogues}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Map dialogues from approved screenplay into storyboard shots"
          >
            {isPopulatingDialogues ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
            <span>Populate Dialogues</span>
          </button>

          <button
            onClick={handleBatchGenerateCurrentScene}
            disabled={isBatchGenerating || currentShots.length === 0}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Batch render videos for all shots in this scene"
          >
            {isBatchGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>Render Scene Videos</span>
          </button>

          <button
            onClick={() => setIsComposeModalOpen(true)}
            className={`px-3.5 py-1.5 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              compositionData?.status === "completed"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            }`}
            title="Assemble completed clips into a final master video"
          >
            <Film className="w-3.5 h-3.5" />
            <span>
              {compositionData?.status === "completed" ? "Master Video Ready" : "Create Full Video"}
            </span>
          </button>

          {onNavigateToStoryboard && (
            <button
              onClick={onNavigateToStoryboard}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Storyboard</span>
            </button>
          )}
        </div>
      </div>

      {populateToolbarMsg && (
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{populateToolbarMsg}</span>
        </div>
      )}

      {/* Master Video Banner if already composed */}
      {compositionData?.status === "completed" && compositionData.video_url && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/20 via-blue-900/10 to-transparent border border-purple-300 dark:border-purple-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Full Master Video Available
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                  {compositionData.duration_seconds ? `${compositionData.duration_seconds.toFixed(1)}s` : "Complete"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  • {compositionData.composed_shots || compositionData.total_shots || "All"} clips stitched
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                All individual shot takes have been assembled in story order with continuity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsComposeModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Watch Master Video</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        {/* Column 1: Scenes List (2 cols) */}
        <div className="lg:col-span-2 space-y-2 border-r border-zinc-100 dark:border-zinc-800/80 pr-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Scenes
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {scenes.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto">
            {scenes.map((sc) => {
              const isSelected = sc.id === selectedSceneId;
              const completedCount =
                sc.shots?.filter((s) => s.video_status === "completed").length || 0;
              const totalCount = sc.shots?.length || 0;

              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedSceneId(sc.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-2xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                      SCENE {sc.scene_number}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {completedCount}/{totalCount} videos
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 font-mono">
                    {sc.heading}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Shots Queue (3 cols) */}
        <div className="lg:col-span-3 space-y-2 border-r border-zinc-100 dark:border-zinc-800/80 pr-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Shots Queue
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {currentShots.length} shots
            </span>
          </div>

          {currentShots.length === 0 ? (
            <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center text-zinc-400 text-xs">
              No shots defined in this scene.
            </div>
          ) : (
            <div className="space-y-2 max-h-[620px] overflow-y-auto">
              {currentShots.map((sh) => {
                const isSelected = sh.id === selectedShotId;
                const thumb = resolveMediaUrl(sh.start_frame_url);
                const isCompleted = sh.video_status === "completed";
                const isGenerating = sh.video_status === "generating";

                return (
                  <button
                    key={sh.id}
                    onClick={() => setSelectedShotId(sh.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-center gap-3 ${
                      isSelected
                        ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 shadow-xs"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Shot #${sh.shot_number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Clapperboard className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          Shot #{sh.shot_number}
                        </span>
                        {isCompleted ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center gap-0.5 border border-green-200 dark:border-green-900">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Done</span>
                          </span>
                        ) : isGenerating ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center gap-0.5 border border-blue-200 dark:border-blue-900 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Render</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-400 uppercase">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {sh.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3 & 4: Center Player + Shot Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Video Player / Frame Preview Canvas */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xs flex flex-col">
            <div className="h-[340px] relative bg-black flex items-center justify-center overflow-hidden">
              {isVideoCompleted && videoUrl ? (
                <video
                  key={videoUrl}
                  controls
                  playsInline
                  src={videoUrl}
                  className="w-full h-full object-contain"
                />
              ) : isGeneratingVideo || shotConfig?.video_status === "generating" ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-3" />
                  <h4 className="text-sm font-bold mb-1">
                    Generating Cinematic Video Clip...
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Synthesizing camera movement, lighting consistency, and character actions with Veo.
                  </p>
                </div>
              ) : startFrameUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={startFrameUrl}
                    alt="Start Frame Reference"
                    className="w-full h-full object-contain opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold border border-white/20 mb-2">
                      Start Frame Ready
                    </span>
                    <button
                      onClick={handleGenerateVideo}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Render Video Clip</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-200 mb-1">
                    No Start Frame Rendered Yet
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mb-3">
                    A visual start frame is required before rendering video with Veo.
                  </p>
                  {onNavigateToStoryboard && (
                    <button
                      onClick={onNavigateToStoryboard}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Render in Storyboard</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Video Player Status Bar */}
            <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono">
                  Shot #{currentShot?.shot_number || 1}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {currentShot?.camera_framing || "Standard"} •{" "}
                  {currentShot?.camera_movement || "Static"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || !hasStartFrame}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isGeneratingVideo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isVideoCompleted ? "Regenerate Video" : "Generate Video"}</span>
                </button>
              </div>
            </div>
          </div>

          {videoGenerateError && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{videoGenerateError}</span>
            </div>
          )}

          {/* Tab Navigation: Dialogue & Voice vs Camera & Motion Settings */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setShotTab("dialogue")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                shotTab === "dialogue"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Character Dialogue & Voice</span>
            </button>

            <button
              type="button"
              onClick={() => setShotTab("settings")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                shotTab === "settings"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Production & Camera</span>
            </button>
          </div>

          {shotTab === "dialogue" && currentShot && currentScene && (
            <ShotDialogueSection
              projectId={projectId}
              sceneId={currentScene.id}
              shotId={currentShot.id}
              shotNumber={currentShot.shot_number}
              shotVideoUrl={videoUrl}
              onShotVideoUpdated={(newUrl) => {
                setDubbedVideoUrl(newUrl);
                if (currentShot) {
                  currentShot.video_url = newUrl;
                  currentShot.video_status = "completed";
                }
                if (shotConfig) {
                  shotConfig.video_url = newUrl;
                  shotConfig.video_status = "completed";
                }
              }}
              onRefreshScenes={onRefreshScenes}
            />
          )}

          {/* Configuration & References Panel */}
          {shotTab === "settings" && (
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Shot Production Settings
                </h3>
              </div>

              {configSaveSuccess && (
                <span className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settings Saved</span>
                </span>
              )}
            </div>

            {isLoadingConfig ? (
              <div className="py-6 flex items-center justify-center text-zinc-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 mr-2" />
                <span>Loading shot configuration...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Settings Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Duration */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Duration
                    </label>
                    <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
                      {[4, 5, 6, 8].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setDuration(sec)}
                          className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all ${
                            duration === sec
                              ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Resolution
                    </label>
                    <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
                      {(["720p"] as const).map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setResolution(res)}
                          className="flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs cursor-default"
                        >
                          {res} (HD)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Aspect Ratio
                    </label>
                    <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
                      {(["16:9", "9:16", "1:1"] as const).map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all ${
                            aspectRatio === ar
                              ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motion Intensity */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Camera Motion
                    </label>
                    <select
                      value={motionIntensity}
                      onChange={(e) => setMotionIntensity(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                    >
                      <option value="subtle">Subtle</option>
                      <option value="dynamic">Dynamic</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>
                </div>

                {/* Prompt Override */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Director Instructions / Prompt Override
                  </label>
                  <textarea
                    value={promptOverride}
                    onChange={(e) => setPromptOverride(e.target.value)}
                    rows={2}
                    placeholder="Specific motion or lighting directives for the video generation model..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-4 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Settings</span>
                  </button>
                </div>
              </form>
            )}

            {configError && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            {/* Continuity References Section */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Continuity References
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Environment Reference */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {shotConfig?.environment?.reference_images?.[0] ? (
                      <img
                        src={resolveMediaUrl(
                          shotConfig.environment.reference_images[0]
                        )!}
                        alt="Environment"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Environment Location
                    </span>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {shotConfig?.environment?.name || currentScene?.environment?.name || "Standard Set"}
                    </h5>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">
                      {shotConfig?.environment?.environment_type || currentScene?.time_of_day || ""}
                    </p>
                  </div>
                </div>

                {/* Cast References */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {shotConfig?.cast?.[0]?.reference_images?.[0] ? (
                      <img
                        src={resolveMediaUrl(
                          shotConfig.cast[0].reference_images[0]
                        )!}
                        alt="Cast"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider block">
                      Cast Reference
                    </span>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {shotConfig?.cast && shotConfig.cast.length > 0
                        ? shotConfig.cast.map((c: { name: string }) => c.name).join(", ")
                        : "No specific character"}
                    </h5>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">
                      {shotConfig?.cast?.[0]?.role || "In-frame actor"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Full Video Composition Modal */}
      <FullVideoCompositionModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        projectId={projectId}
        scenes={scenes}
        onNavigateToStoryboard={onNavigateToStoryboard}
        onCompositionUpdated={(comp) => setCompositionData(comp)}
      />
    </div>
  );
}
