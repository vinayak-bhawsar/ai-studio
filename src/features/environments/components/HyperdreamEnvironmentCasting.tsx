"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Sparkles,
  Wand2,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RotateCcw,
  Plus,
  Compass,
  SkipForward,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import {
  environmentService,
  getEnvironmentImageUrl,
  resolveImageUrl,
} from "../services/environmentService";
import { EnvironmentResponse } from "../types/environment";
import { AddEnvironmentModal } from "./AddEnvironmentModal";
import { EnvironmentCastingShimmer } from "@/src/components/shared/StudioShimmers";

interface HyperdreamEnvironmentCastingProps {
  projectId: string;
  environments: EnvironmentResponse[];
  onEnvironmentsUpdated: (newEnvironments: EnvironmentResponse[]) => void;
  isLoadingEnvironments?: boolean;
  loadingMessage?: string;
  isBatchGeneratingImages?: boolean;
  externalGeneratingCardIds?: Set<string>;
  externalBatchProgress?: { completed: number; total: number } | null;
  externalBatchMessage?: string | null;
  fetchError?: string | null;
  onRefreshEnvironments?: () => void;
  onBatchComplete?: (successful: number, total: number) => void;
  onConfirmSelections?: () => void;
  onSkip?: () => void;
}

type CardStatus = "idle" | "generating" | "completed" | "failed";

export function HyperdreamEnvironmentCasting({
  projectId,
  environments,
  onEnvironmentsUpdated,
  isLoadingEnvironments = false,
  loadingMessage,
  isBatchGeneratingImages = false,
  externalGeneratingCardIds,
  externalBatchProgress,
  externalBatchMessage,
  fetchError = null,
  onRefreshEnvironments,
  onBatchComplete,
  onConfirmSelections,
  onSkip,
}: HyperdreamEnvironmentCastingProps) {
  const { accessToken } = useAuth();

  const [generatingCardIds, setGeneratingCardIds] = useState<Set<string>>(new Set());
  const [cardStatusMap, setCardStatusMap] = useState<Record<string, CardStatus>>({});
  const [cardErrorMap, setCardErrorMap] = useState<Record<string, string>>({});
  const [failedImageMap, setFailedImageMap] = useState<Record<string, boolean>>({});

  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const isBatchActive = isBatchGenerating || Boolean(isBatchGeneratingImages);
  const effectiveBatchProgress = batchProgress || externalBatchProgress;
  const effectiveBatchMessage = batchMessage || externalBatchMessage;

  const effectiveGeneratingCardIds = useMemo(() => {
    if (!externalGeneratingCardIds || externalGeneratingCardIds.size === 0) {
      return generatingCardIds;
    }
    const combined = new Set(generatingCardIds);
    externalGeneratingCardIds.forEach((id) => combined.add(id));
    return combined;
  }, [generatingCardIds, externalGeneratingCardIds]);

  const [isExtractingEnvironments, setIsExtractingEnvironments] = useState(false);
  const [extractInstructions, setExtractInstructions] = useState("");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);

  // Count environments with existing images
  const setStats = useMemo(() => {
    const total = environments.length;
    const withImages = environments.filter((e) => getEnvironmentImageUrl(e) !== null).length;
    return { total, withImages, pending: total - withImages };
  }, [environments]);

  const toggleExpandCard = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 1. Batch Image Generation (Generate All Images)
  const handleGenerateAllImages = useCallback(
    async (forceRegenerate = false) => {
      if (!accessToken || !projectId || isBatchGenerating) return;

      const targetEnvironments = forceRegenerate
        ? environments
        : environments.filter((e) => getEnvironmentImageUrl(e) === null);

      if (targetEnvironments.length === 0 && !forceRegenerate) {
        const confirmAll = window.confirm(
          "All locations already have generated images. Would you like to regenerate images for all locations?"
        );
        if (confirmAll) {
          handleGenerateAllImages(true);
        }
        return;
      }

      const targetIds = targetEnvironments.map((e) => e.id);
      setIsBatchGenerating(true);
      setBatchMessage(`Generating images for ${targetIds.length} environments using Nano Banana 2.1...`);
      setBatchProgress({ completed: 0, total: targetIds.length });

      setGeneratingCardIds((prev) => {
        const next = new Set(prev);
        targetIds.forEach((id) => next.add(id));
        return next;
      });

      setCardStatusMap((prev) => {
        const next = { ...prev };
        targetIds.forEach((id) => {
          next[id] = "generating";
        });
        return next;
      });

      setCardErrorMap((prev) => {
        const next = { ...prev };
        targetIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      try {
        const res = await environmentService.generateEnvironmentImagesBatch(
          projectId,
          {
            environment_ids: targetIds,
            force_regenerate: forceRegenerate,
          },
          accessToken
        );

        if (res && res.results) {
          const { results, successful_count, failed_count } = res;

          const updatedMap = new Map<string, EnvironmentResponse>();
          results.forEach((item) => {
            if (item.environment) {
              updatedMap.set(item.environment_id, item.environment);
            }
          });

          const updatedEnvironments = environments.map((e) => {
            if (updatedMap.has(e.id)) {
              return updatedMap.get(e.id)!;
            }
            return e;
          });
          onEnvironmentsUpdated(updatedEnvironments);

          setCardStatusMap((prev) => {
            const next = { ...prev };
            results.forEach((item) => {
              if (item.status === "completed" || item.image_url) {
                next[item.environment_id] = "completed";
              } else if (item.status === "failed") {
                next[item.environment_id] = "failed";
              }
            });
            return next;
          });

          setCardErrorMap((prev) => {
            const next = { ...prev };
            results.forEach((item) => {
              if (item.status === "failed" && item.error) {
                next[item.environment_id] = item.error;
              }
            });
            return next;
          });

          setBatchProgress({ completed: targetIds.length, total: targetIds.length });
          setBatchMessage(
            `Generation finished: ${successful_count} succeeded, ${failed_count} failed.`
          );
          if (onBatchComplete) {
            onBatchComplete(successful_count, targetIds.length);
          }
        } else {
          throw new Error("Failed to generate environment images.");
        }
      } catch (err: any) {
        const errorMsg = err?.message || "Batch image generation failed.";
        setBatchMessage(errorMsg);

        setCardStatusMap((prev) => {
          const next = { ...prev };
          targetIds.forEach((id) => {
            if (next[id] === "generating") {
              next[id] = "failed";
            }
          });
          return next;
        });

        setCardErrorMap((prev) => {
          const next = { ...prev };
          targetIds.forEach((id) => {
            if (!next[id]) {
              next[id] = errorMsg;
            }
          });
          return next;
        });
      } finally {
        setIsBatchGenerating(false);
        setGeneratingCardIds((prev) => {
          const next = new Set(prev);
          targetIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [accessToken, projectId, isBatchGenerating, environments, onEnvironmentsUpdated]
  );

  // 2. Single Environment Image Generation
  const handleGenerateSingleImage = useCallback(
    async (environmentId: string) => {
      if (!accessToken || !projectId || generatingCardIds.has(environmentId)) return;

      setGeneratingCardIds((prev) => new Set(prev).add(environmentId));
      setCardStatusMap((prev) => ({ ...prev, [environmentId]: "generating" }));
      setCardErrorMap((prev) => {
        const next = { ...prev };
        delete next[environmentId];
        return next;
      });
      setFailedImageMap((prev) => {
        const next = { ...prev };
        delete next[environmentId];
        return next;
      });

      const targetEnv = environments.find((e) => e.id === environmentId);
      const isRegenerating = targetEnv ? getEnvironmentImageUrl(targetEnv) !== null : false;

      try {
        const item = await environmentService.generateSingleEnvironmentImage(
          projectId,
          environmentId,
          accessToken,
          { force_regenerate: isRegenerating }
        );

        if (item) {
          if (item.status === "completed" || item.image_url) {
            setCardStatusMap((prev) => ({ ...prev, [environmentId]: "completed" }));

            if (item.environment) {
              const updated = environments.map((e) =>
                e.id === environmentId ? item.environment! : e
              );
              onEnvironmentsUpdated(updated);
            } else if (item.image_url) {
              const updated = environments.map((e) => {
                if (e.id === environmentId) {
                  return {
                    ...e,
                    reference_images: [item.image_url!],
                  };
                }
                return e;
              });
              onEnvironmentsUpdated(updated);
            }
          } else {
            setCardStatusMap((prev) => ({ ...prev, [environmentId]: "failed" }));
            setCardErrorMap((prev) => ({
              ...prev,
              [environmentId]: item.error || "Failed to generate image.",
            }));
          }
        } else {
          throw new Error("Failed to generate image.");
        }
      } catch (err: any) {
        const errorMsg = err?.message || "Image generation failed.";
        setCardStatusMap((prev) => ({ ...prev, [environmentId]: "failed" }));
        setCardErrorMap((prev) => ({ ...prev, [environmentId]: errorMsg }));
      } finally {
        setGeneratingCardIds((prev) => {
          const next = new Set(prev);
          next.delete(environmentId);
          return next;
        });
      }
    },
    [accessToken, projectId, generatingCardIds, environments, onEnvironmentsUpdated]
  );

  // 3. Extract Environments from Screenplay
  const handleExtractEnvironments = async () => {
    if (!accessToken || !projectId || isExtractingEnvironments) return;

    setIsExtractingEnvironments(true);
    setExtractError(null);
    try {
      const items = await environmentService.generateEnvironment(
        projectId,
        extractInstructions.trim() ? { instructions: extractInstructions.trim() } : {},
        accessToken
      );

      if (items && items.length > 0) {
        onEnvironmentsUpdated([...environments, ...items]);
        if (onRefreshEnvironments) onRefreshEnvironments();
      } else {
        setExtractError("No environments were returned from the screenplay extraction.");
      }
    } catch (err: any) {
      console.error("Failed to extract environments:", err);
      const msg = err?.message || "Failed to extract environments from screenplay. Please ensure a screenplay has been generated in Script Writing first.";
      setExtractError(msg);
    } finally {
      setIsExtractingEnvironments(false);
    }
  };

  // 4. Manually Add Environment Submit
  const handleAddEnvironmentSubmit = async (data: {
    name: string;
    environment_type: string;
    time_of_day: string;
    description: string;
    architecture: string;
    lighting: string;
    materials: string;
    atmosphere: string;
  }) => {
    if (!accessToken || !projectId) return;

    setIsAddingEnvironment(true);
    try {
      const instructionParts: string[] = [`Create location set: Name: ${data.name}`];
      if (data.environment_type) instructionParts.push(`Type: ${data.environment_type}`);
      if (data.time_of_day) instructionParts.push(`Time of Day: ${data.time_of_day}`);
      if (data.description) instructionParts.push(`Description: ${data.description}`);
      if (data.architecture) instructionParts.push(`Architecture: ${data.architecture}`);
      if (data.lighting) instructionParts.push(`Lighting: ${data.lighting}`);
      if (data.materials) instructionParts.push(`Materials: ${data.materials}`);
      if (data.atmosphere) instructionParts.push(`Atmosphere: ${data.atmosphere}`);

      const instructions = instructionParts.join(". ");

      let items: EnvironmentResponse[] = [];
      try {
        items = await environmentService.generateEnvironment(
          projectId,
          { instructions },
          accessToken
        );
      } catch (err: any) {
        // If backend /generate requires an existing screenplay version and none exists yet,
        // construct a local manual environment record so manual creation succeeds reliably
        if (
          err?.status === 404 ||
          (err?.message && (err.message.includes("screenplay") || err.message.includes("scenes")))
        ) {
          const manualItem: EnvironmentResponse = {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `env-${Date.now()}`,
            project_id: projectId,
            name: data.name,
            environment_type: data.environment_type || "Interior",
            time_of_day: data.time_of_day || "Daylight",
            description: data.description || "",
            architecture: data.architecture || "",
            lighting: data.lighting || "",
            materials: data.materials || "",
            atmosphere: data.atmosphere || "",
            visual_description: [data.description, data.architecture, data.lighting].filter(Boolean).join(". "),
            source_screenplay_version_id: null,
            reference_images: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          items = [manualItem];
        } else {
          throw err;
        }
      }

      if (items && items.length > 0) {
        onEnvironmentsUpdated([...environments, ...items]);
        if (onRefreshEnvironments) onRefreshEnvironments();
      }
    } finally {
      setIsAddingEnvironment(false);
    }
  };

  if (isLoadingEnvironments) {
    return (
      <EnvironmentCastingShimmer
        loadingMessage={loadingMessage || "AI is extracting and preparing environment locations..."}
      />
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 border border-red-200 dark:border-red-900/60 rounded-3xl bg-red-50/50 dark:bg-red-950/20 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-3 shadow-2xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Unable to Load Locations
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mb-4 leading-relaxed">
          {fetchError}
        </p>
        {onRefreshEnvironments && (
          <button
            onClick={onRefreshEnvironments}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Hyperdream Studio Header Control Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-sm">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Environment Casting Studio
              </h2>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Nano Banana 2.1
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Environment lookbook visual sheets and AI set art casting for your film locations.
            </p>
          </div>
        </div>

        {/* Action Controls & Statistics */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {environments.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {setStats.withImages} / {setStats.total} Images Ready
              </span>
            </div>
          )}

          {onSkip && (
            <button
              onClick={onSkip}
              className="px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Skip Environment Casting and proceed to Style Book"
            >
              <SkipForward className="w-4 h-4 text-zinc-500" />
              <span>Skip for Now</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Add Environment</span>
          </button>

          {environments.length > 0 && (
            <button
              onClick={() => handleGenerateAllImages(false)}
              disabled={isBatchActive}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isBatchActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {isBatchActive
                  ? "Generating All..."
                  : setStats.pending === 0
                  ? "Regenerate All Images"
                  : "Generate All Images"}
              </span>
            </button>
          )}

          {environments.length > 0 && onConfirmSelections && (
            <button
              onClick={onConfirmSelections}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Confirm environment selections and proceed to Storyboard"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Continue to Storyboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Generation Progress Indicator */}
      {isBatchActive && (
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 space-y-2.5 animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span>{effectiveBatchMessage || "Batch concept art generation in progress using Nano Banana 2.1..."}</span>
            </div>
            {effectiveBatchProgress && (
              <span>
                {effectiveBatchProgress.completed} / {effectiveBatchProgress.total}
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{
                width: `${
                  effectiveBatchProgress && effectiveBatchProgress.total > 0
                    ? Math.max(10, (effectiveBatchProgress.completed / effectiveBatchProgress.total) * 100)
                    : 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Environments Cards Grid */}
      {environments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {environments.map((env) => {
            const rawImgUrl = getEnvironmentImageUrl(env);
            const isGeneratingThisCard = effectiveGeneratingCardIds.has(env.id);
            const status = cardStatusMap[env.id] || (rawImgUrl ? "completed" : "idle");
            const cardError = cardErrorMap[env.id];
            const isImageFailed = failedImageMap[env.id];

            const isExpanded = expandedCardIds.has(env.id);

            return (
              <div
                key={env.id}
                className={`group bg-white dark:bg-zinc-900 border ${
                  status === "failed"
                    ? "border-red-300 dark:border-red-900/60"
                    : isGeneratingThisCard
                    ? "border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                } rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                {/* Top Image Frame (3:4 Ratio Matching Character Casting) */}
                <div className="relative aspect-[3/4] w-full bg-zinc-900 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {rawImgUrl && !isImageFailed && !isGeneratingThisCard ? (
                    <img
                      src={rawImgUrl}
                      alt={env.name}
                      onError={() => {
                        setFailedImageMap((prev) => ({ ...prev, [env.id]: true }));
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : isGeneratingThisCard ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-blue-400 space-y-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 animate-ping absolute inset-0" />
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white tracking-wide block">
                          Rendering Set Art
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Nano Banana 2.1
                        </span>
                      </div>
                    </div>
                  ) : status === "failed" || isImageFailed ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-red-400 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300">
                        Generation Failed
                      </span>
                      <button
                        onClick={() => handleGenerateSingleImage(env.id)}
                        className="mt-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  ) : (
                    /* Empty Placeholder State */
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-zinc-400 block">
                          Unset Environment
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          No set art generated yet
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Overlay Badge (Top Right) */}
                  <div className="absolute top-3 right-3 z-10">
                    {isGeneratingThisCard ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating</span>
                      </span>
                    ) : status === "completed" && rawImgUrl && !isImageFailed ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : status === "failed" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800/80 text-zinc-300 backdrop-blur-md shadow-sm border border-zinc-700/50">
                        Unset
                      </span>
                    )}
                  </div>

                  {/* Environment Type Tag (Top Left) */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-zinc-950/80 text-blue-400 border border-blue-500/30 backdrop-blur-md shadow-sm">
                      {env.environment_type || "Location"}
                    </span>
                  </div>
                </div>

                {/* Environment Metadata Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {env.name}
                      </h3>
                      {env.time_of_day && (
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {env.time_of_day}
                        </span>
                      )}
                    </div>

                    {env.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {env.description}
                      </p>
                    )}
                  </div>

                  {/* Expandable Architecture & Lighting Details */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                    {env.architecture && (
                      <div className="line-clamp-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          Architecture:{" "}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {env.architecture}
                        </span>
                      </div>
                    )}

                    {isExpanded && (
                      <>
                        {env.lighting && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Lighting:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {env.lighting}
                            </span>
                          </div>
                        )}
                        {env.materials && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Materials:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {env.materials}
                            </span>
                          </div>
                        )}
                        {env.atmosphere && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Atmosphere:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {env.atmosphere}
                            </span>
                          </div>
                        )}
                        {env.visual_description && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Visual Style:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {env.visual_description}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {(env.lighting || env.materials || env.atmosphere || env.visual_description) && (
                      <button
                        onClick={() => toggleExpandCard(env.id)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 pt-1 cursor-pointer"
                      >
                        <span>{isExpanded ? "Show Less" : "Show Full Details"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {cardError && (
                    <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-[11px] text-red-600 dark:text-red-400">
                      {cardError}
                    </div>
                  )}

                  {/* Card Bottom Individual Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleGenerateSingleImage(env.id)}
                      disabled={isGeneratingThisCard || isBatchGenerating}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === "completed" && rawImgUrl && !isImageFailed
                          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                          : status === "failed"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isGeneratingThisCard ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : status === "completed" && rawImgUrl && !isImageFailed ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Regenerate Image</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Generate Image</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed Add Environment Card */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 min-h-[360px] flex flex-col items-center justify-center text-center bg-zinc-50/40 hover:bg-blue-50/30 dark:bg-zinc-900/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center text-zinc-500 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400 transition-colors mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Add Environment
            </span>
          </button>
        </div>
      ) : (
        /* Empty Roster State */
        <div className="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
            No Environments Defined Yet
          </h3>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Extract architectural set locations directly from your screenplay to generate Nano Banana 2.1 set art.
          </p>

          {extractError && (
            <div className="mb-4 max-w-md w-full p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          <div className="w-full max-w-sm mb-4">
            <input
              type="text"
              value={extractInstructions}
              onChange={(e) => setExtractInstructions(e.target.value)}
              placeholder="Optional casting notes (e.g. Cyberpunk theme)..."
              className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

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
              onClick={handleExtractEnvironments}
              disabled={isExtractingEnvironments}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isExtractingEnvironments ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>Extract Environments from Screenplay</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Add Environment Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Environment Modal */}
      <AddEnvironmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEnvironmentSubmit}
        isSubmitting={isAddingEnvironment}
      />
    </div>
  );
}
