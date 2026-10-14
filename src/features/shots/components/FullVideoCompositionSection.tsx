"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Film,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Sparkles,
  Clapperboard,
  Layers,
  Video,
  Info,
  ChevronRight,
  Clock,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { productionService } from "../services/productionService";
import { resolveMediaUrl } from "@/src/features/storyboard/services/storyboardService";
import { VideoComposeResponse } from "../types/production";
import { SceneResponse, ShotResponse } from "@/src/features/storyboard/types/storyboard";

interface FullVideoCompositionSectionProps {
  projectId: string;
  scenes?: SceneResponse[];
  onNavigateToShots?: () => void;
  onNavigateToStoryboard?: () => void;
  onCompositionUpdated?: (comp: VideoComposeResponse) => void;
  embeddedInModal?: boolean;
  onClose?: () => void;
}

export function FullVideoCompositionSection({
  projectId,
  scenes = [],
  onNavigateToShots,
  onNavigateToStoryboard,
  onCompositionUpdated,
  embeddedInModal = false,
  onClose,
}: FullVideoCompositionSectionProps) {
  const { accessToken } = useAuth();

  const [composition, setComposition] = useState<VideoComposeResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [allowPartial, setAllowPartial] = useState(false);
  const [selectedPreviewShot, setSelectedPreviewShot] = useState<ShotResponse | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollInFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  // Flatten all shots across all scenes in chronological order
  const allShots = useMemo(() => {
    return scenes.flatMap((sc) => sc.shots || []).sort((a, b) => a.shot_number - b.shot_number);
  }, [scenes]);

  const completedShots = useMemo(() => {
    return allShots.filter((s) => s.video_status === "completed" && Boolean(s.video_url));
  }, [allShots]);

  const pendingShots = useMemo(() => {
    return allShots.filter((s) => s.video_status !== "completed" || !s.video_url);
  }, [allShots]);

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    isPollInFlightRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearPolling();
    };
  }, [clearPolling]);

  // Load initial composition status on mount
  const loadCompositionStatus = useCallback(async () => {
    if (!accessToken || !projectId) return;
    setIsLoadingStatus(true);
    setComposeError(null);
    try {
      const data = await productionService.getComposition(projectId, accessToken);
      if (isMountedRef.current) {
        setComposition(data);
        if (onCompositionUpdated) onCompositionUpdated(data);
      }
    } catch (err) {
      console.warn("No existing composition found or failed to load status:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingStatus(false);
      }
    }
  }, [accessToken, projectId, onCompositionUpdated]);

  useEffect(() => {
    loadCompositionStatus();
  }, [loadCompositionStatus]);

  // Polling for active composition processing
  const startCompositionPolling = useCallback(() => {
    clearPolling();
    if (!accessToken || !projectId) return;

    pollingTimerRef.current = setInterval(async () => {
      if (isPollInFlightRef.current) return;
      isPollInFlightRef.current = true;

      try {
        const statusRes = await productionService.getCompositionStatus(projectId, accessToken);

        if (isMountedRef.current) {
          setComposition(statusRes);
          if (onCompositionUpdated) onCompositionUpdated(statusRes);

          if (statusRes.status === "completed") {
            clearPolling();
            setIsComposing(false);
            setComposeError(null);
          } else if (statusRes.status === "failed") {
            clearPolling();
            setIsComposing(false);
            setComposeError(statusRes.message || "Video composition failed on server.");
          }
        }
      } catch (err) {
        console.error("Composition polling error:", err);
        if (isMountedRef.current) {
          clearPolling();
          setIsComposing(false);
        }
      } finally {
        isPollInFlightRef.current = false;
      }
    }, 2500);
  }, [accessToken, projectId, clearPolling, onCompositionUpdated]);

  // Trigger Compose Video Request
  const handleComposeVideo = async (forceRecompose: boolean = false) => {
    if (!accessToken || !projectId || isComposing) return;

    setIsComposing(true);
    setComposeError(null);

    try {
      const res = await productionService.composeFullVideo(
        projectId,
        {
          allow_partial: allowPartial,
          force_recompose: forceRecompose,
        },
        accessToken
      );

      setComposition(res);
      if (onCompositionUpdated) onCompositionUpdated(res);

      if (res.status === "completed") {
        setIsComposing(false);
      } else if (res.status === "processing" || res.status === "pending") {
        startCompositionPolling();
      } else if (res.status === "failed") {
        setIsComposing(false);
        setComposeError(res.message || "Failed to assemble complete video.");
      }
    } catch (err: unknown) {
      setIsComposing(false);
      const msg = err instanceof Error ? err.message : "Failed to compose video.";
      setComposeError(msg);
    }
  };

  const finalVideoUrl = resolveMediaUrl(composition?.video_url);
  const isCompleted = composition?.status === "completed" && Boolean(finalVideoUrl);
  const isProcessing = isComposing || composition?.status === "processing";

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Full Video Composition
                </h3>
                {isCompleted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Master Video Ready</span>
                  </span>
                ) : isProcessing ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Assembling Clips...</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {completedShots.length}/{allShots.length} Clips Rendered
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Stitches all scene and shot clips in chronological order into a seamless master video.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isCompleted ? (
              <>
                {finalVideoUrl && (
                  <a
                    href={finalVideoUrl}
                    download="master_video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>Download MP4</span>
                  </a>
                )}
                <button
                  onClick={() => handleComposeVideo(true)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Re-stitch all clips into a new master video"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Recompose Master</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleComposeVideo(false)}
                disabled={isProcessing || allShots.length === 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Assembling Master...</span>
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>Create Full Video</span>
                  </>
                )}
              </button>
            )}

            {embeddedInModal && onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Validation / Incomplete Warning */}
        {pendingShots.length > 0 && !isCompleted && !isProcessing && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {pendingShots.length} shot{pendingShots.length > 1 ? "s" : ""} pending video render:
                </span>{" "}
                <span className="text-amber-700 dark:text-amber-400">
                  {pendingShots.map((s) => `Shot #${s.shot_number}`).join(", ")}.
                </span>
                <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-0.5">
                  By default, full video assembly requires all clips to be rendered to preserve narrative continuity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowPartial}
                  onChange={(e) => setAllowPartial(e.target.checked)}
                  className="rounded border-amber-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Compose available {completedShots.length} clips anyway</span>
              </label>

              {onNavigateToShots && (
                <button
                  onClick={onNavigateToShots}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  Render in Shots
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {composeError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{composeError}</span>
            </div>
            <button
              onClick={() => handleComposeVideo(false)}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Player Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xs flex flex-col">
            <div className="h-[360px] relative bg-black flex items-center justify-center overflow-hidden">
              {isCompleted && finalVideoUrl ? (
                <video
                  key={finalVideoUrl}
                  controls
                  playsInline
                  src={finalVideoUrl}
                  className="w-full h-full object-contain"
                />
              ) : selectedPreviewShot?.video_url ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video
                    key={selectedPreviewShot.video_url}
                    controls
                    playsInline
                    src={resolveMediaUrl(selectedPreviewShot.video_url) || undefined}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                    Single Clip Preview: Shot #{selectedPreviewShot.shot_number}
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-3" />
                  <h4 className="text-sm font-bold mb-1">
                    Stitching Timeline Clips...
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Combining visual shots, syncing transitions, and rendering master mp4 file with FFmpeg.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <Film className="w-10 h-10 text-zinc-600 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-300 mb-1">
                    No Master Video Composed Yet
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mb-3">
                    Click &ldquo;Create Full Video&rdquo; to assemble all rendered shot clips in scene sequence.
                  </p>
                  <button
                    onClick={() => handleComposeVideo(false)}
                    disabled={completedShots.length === 0}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Assemble Now ({completedShots.length} ready)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Player Info Bar */}
            <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-purple-400 font-mono flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>{isCompleted ? "Combined Master Video" : "Individual Takes"}</span>
                </span>
                {isCompleted && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{composition?.duration_seconds ? `${composition.duration_seconds.toFixed(1)}s` : "N/A"}</span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-zinc-500" />
                      <span>{composition?.resolution || "720p"}</span>
                    </span>
                  </>
                )}
              </div>

              {isCompleted && finalVideoUrl && (
                <a
                  href={finalVideoUrl}
                  download="master_video.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sequence Shots Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Timeline Sequence
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                {completedShots.length}/{allShots.length} Ready
              </span>
            </div>
            {isCompleted && selectedPreviewShot && (
              <button
                onClick={() => setSelectedPreviewShot(null)}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
              >
                Switch back to Master
              </button>
            )}
          </div>

          {allShots.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-zinc-400 text-xs">
              No scenes or shots available. Create scenes in Storyboard first.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {allShots.map((sh, idx) => {
                const thumb = resolveMediaUrl(sh.start_frame_url);
                const clipUrl = resolveMediaUrl(sh.video_url);
                const isClipReady = sh.video_status === "completed" && Boolean(clipUrl);
                const isSelected = selectedPreviewShot?.id === sh.id;

                return (
                  <div
                    key={sh.id}
                    onClick={() => {
                      if (isClipReady) setSelectedPreviewShot(sh);
                    }}
                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 shadow-xs"
                        : isClipReady
                        ? "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-70"
                    }`}
                  >
                    {/* Index & Thumb */}
                    <span className="text-[10px] font-mono font-bold text-zinc-400 w-4 text-center">
                      {idx + 1}
                    </span>

                    <div className="w-12 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Shot #${sh.shot_number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      {isClipReady && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-current opacity-80" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                          Shot #{sh.shot_number}
                        </span>
                        {isClipReady ? (
                          <div className="flex items-center gap-1">
                            {Boolean(sh.asset_metadata?.dialogue_mixed) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                Dubbed
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                              Ready
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-zinc-400 uppercase font-mono">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {sh.description || "No description"}
                      </p>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
