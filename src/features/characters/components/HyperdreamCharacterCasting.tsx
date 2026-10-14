"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Loader2,
  Sparkles,
  Wand2,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RotateCcw,
  UserPlus,
  Plus,
  SkipForward,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { characterService, getCharacterImageUrl, resolveImageUrl } from "../services/characterService";
import { CharacterResponse } from "../types/character";
import { AddCharacterModal } from "./AddCharacterModal";
import { CharacterCastingShimmer } from "@/src/components/shared/StudioShimmers";

interface HyperdreamCharacterCastingProps {
  projectId: string;
  characters: CharacterResponse[];
  onCharactersUpdated: (newCharacters: CharacterResponse[]) => void;
  isLoadingCharacters?: boolean;
  loadingMessage?: string;
  isBatchGeneratingImages?: boolean;
  externalGeneratingCardIds?: Set<string>;
  externalBatchProgress?: { completed: number; total: number } | null;
  externalBatchMessage?: string | null;
  fetchError?: string | null;
  onRefreshCharacters?: () => void;
  onBatchComplete?: (successful: number, total: number) => void;
  onSkip?: () => void;
}

type CardStatus = "idle" | "generating" | "completed" | "failed";

export function HyperdreamCharacterCasting({
  projectId,
  characters,
  onCharactersUpdated,
  isLoadingCharacters = false,
  loadingMessage,
  isBatchGeneratingImages = false,
  externalGeneratingCardIds,
  externalBatchProgress,
  externalBatchMessage,
  fetchError = null,
  onRefreshCharacters,
  onBatchComplete,
  onSkip,
}: HyperdreamCharacterCastingProps) {
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

  const [isExtractingCharacters, setIsExtractingCharacters] = useState(false);
  const [extractInstructions, setExtractInstructions] = useState("");
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);

  const handleAddCharacterSubmit = async (data: {
    name: string;
    role: string;
    age: string;
    description: string;
    appearance: string;
    wardrobe: string;
    personality: string;
  }) => {
    if (!accessToken || !projectId) return;

    setIsAddingCharacter(true);
    try {
      const instructionParts: string[] = [`Create character: Name: ${data.name}`];
      if (data.role) instructionParts.push(`Role: ${data.role}`);
      if (data.age) instructionParts.push(`Age: ${data.age}`);
      if (data.description) instructionParts.push(`Description: ${data.description}`);
      if (data.appearance) instructionParts.push(`Appearance: ${data.appearance}`);
      if (data.wardrobe) instructionParts.push(`Wardrobe: ${data.wardrobe}`);
      if (data.personality) instructionParts.push(`Personality: ${data.personality}`);

      const instructions = instructionParts.join(". ");

      const items = await characterService.generateCharacter(
        projectId,
        { instructions },
        accessToken
      );

      if (items && items.length > 0) {
        onCharactersUpdated([...characters, ...items]);
        if (onRefreshCharacters) onRefreshCharacters();
      }
    } finally {
      setIsAddingCharacter(false);
    }
  };

  // Count characters with existing images
  const castStats = useMemo(() => {
    const total = characters.length;
    const withImages = characters.filter((c) => getCharacterImageUrl(c) !== null).length;
    return { total, withImages, pending: total - withImages };
  }, [characters]);

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

      // Filter characters to generate: either all if force, or only those without images
      const targetCharacters = forceRegenerate
        ? characters
        : characters.filter((c) => {
            const hasImg = getCharacterImageUrl(c) !== null;
            return !hasImg;
          });

      if (targetCharacters.length === 0 && !forceRegenerate) {
        // All characters already have images, prompt to regenerate all
        const confirmAll = window.confirm(
          "All characters already have generated images. Would you like to regenerate images for all characters?"
        );
        if (confirmAll) {
          handleGenerateAllImages(true);
        }
        return;
      }

      const targetIds = targetCharacters.map((c) => c.id);
      setIsBatchGenerating(true);
      setBatchMessage(`Generating images for ${targetIds.length} characters using Nano Banana 2.1...`);
      setBatchProgress({ completed: 0, total: targetIds.length });

      // Mark status for target cards as generating
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
        const res = await characterService.generateCharacterImagesBatch(
          projectId,
          {
            character_ids: targetIds,
            force_regenerate: forceRegenerate,
          },
          accessToken
        );

        if (res && res.results) {
          const { results, successful_count, failed_count } = res;

          // Map updated images into characters list
          const updatedMap = new Map<string, CharacterResponse>();
          results.forEach((item) => {
            if (item.character) {
              updatedMap.set(item.character_id, item.character);
            }
          });

          // Update parent state with merged character objects
          const updatedCharacters = characters.map((c) => {
            if (updatedMap.has(c.id)) {
              return updatedMap.get(c.id)!;
            }
            return c;
          });
          onCharactersUpdated(updatedCharacters);

          // Update status map & errors for each item result
          setCardStatusMap((prev) => {
            const next = { ...prev };
            results.forEach((item) => {
              if (item.status === "completed" || item.image_url) {
                next[item.character_id] = "completed";
              } else if (item.status === "failed") {
                next[item.character_id] = "failed";
              }
            });
            return next;
          });

          setCardErrorMap((prev) => {
            const next = { ...prev };
            results.forEach((item) => {
              if (item.status === "failed" && item.error) {
                next[item.character_id] = item.error;
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
          throw new Error("Failed to generate character images.");
        }
      } catch (err: any) {
        const errorMsg = err?.message || "Batch generation failed. Please try again.";
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
    [accessToken, projectId, isBatchGenerating, characters, onCharactersUpdated]
  );

  // 2. Individual Single Character Image Generation
  const handleGenerateSingleImage = useCallback(
    async (characterId: string) => {
      if (!accessToken || !projectId || generatingCardIds.has(characterId)) return;

      setGeneratingCardIds((prev) => new Set(prev).add(characterId));
      setCardStatusMap((prev) => ({ ...prev, [characterId]: "generating" }));
      setCardErrorMap((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });
      setFailedImageMap((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });

      try {
        const item = await characterService.generateSingleCharacterImage(
          projectId,
          characterId,
          accessToken
        );

        if (item) {
          if (item.status === "completed" || item.image_url) {
            setCardStatusMap((prev) => ({ ...prev, [characterId]: "completed" }));

            // Update state with returned character record
            if (item.character) {
              const updatedCharacters = characters.map((c) =>
                c.id === characterId ? item.character! : c
              );
              onCharactersUpdated(updatedCharacters);
            } else if (item.image_url) {
              const updatedCharacters = characters.map((c) => {
                if (c.id === characterId) {
                  return {
                    ...c,
                    reference_images: [item.image_url!],
                  };
                }
                return c;
              });
              onCharactersUpdated(updatedCharacters);
            }
          } else {
            setCardStatusMap((prev) => ({ ...prev, [characterId]: "failed" }));
            setCardErrorMap((prev) => ({
              ...prev,
              [characterId]: item.error || "Failed to generate character image.",
            }));
          }
        } else {
          throw new Error("Failed to generate image.");
        }
      } catch (err: any) {
        const errorMsg = err?.message || "Image generation failed.";
        setCardStatusMap((prev) => ({ ...prev, [characterId]: "failed" }));
        setCardErrorMap((prev) => ({ ...prev, [characterId]: errorMsg }));
      } finally {
        setGeneratingCardIds((prev) => {
          const next = new Set(prev);
          next.delete(characterId);
          return next;
        });
      }
    },
    [accessToken, projectId, generatingCardIds, characters, onCharactersUpdated]
  );

  // 3. Extract Characters from Screenplay if list is empty
  const handleExtractCharacters = async () => {
    if (!accessToken || !projectId || isExtractingCharacters) return;

    setIsExtractingCharacters(true);
    try {
      const items = await characterService.generateCharacter(
        projectId,
        extractInstructions.trim() ? { instructions: extractInstructions.trim() } : {},
        accessToken
      );

      if (items && items.length > 0) {
        onCharactersUpdated([...characters, ...items]);
        if (onRefreshCharacters) onRefreshCharacters();
      }
    } catch (err) {
      console.error("Failed to extract characters:", err);
    } finally {
      setIsExtractingCharacters(false);
    }
  };

  if (isLoadingCharacters) {
    return (
      <CharacterCastingShimmer
        loadingMessage={loadingMessage || "AI is casting characters from your screenplay..."}
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
          Unable to Load Characters
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mb-4 leading-relaxed">
          {fetchError}
        </p>
        {onRefreshCharacters && (
          <button
            onClick={onRefreshCharacters}
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Character Casting Studio
              </h2>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Nano Banana 2.1
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Character lookbook visual sheets and AI portrait casting for your film roster.
            </p>
          </div>
        </div>

        {/* Action Controls & Statistics */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {characters.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {castStats.withImages} / {castStats.total} Images Ready
              </span>
            </div>
          )}

          {onSkip && (
            <button
              onClick={onSkip}
              className="px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Skip Character Casting and proceed to Environment Casting"
            >
              <SkipForward className="w-4 h-4 text-zinc-500" />
              <span>Skip for Now</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Add Character</span>
          </button>

          {characters.length > 0 && (
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
                  : castStats.pending === 0
                  ? "Regenerate All Images"
                  : "Generate All Images"}
              </span>
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
              <span>{effectiveBatchMessage || "Batch portrait generation in progress using Nano Banana 2.1..."}</span>
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

      {/* Characters Cards Grid */}
      {characters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => {
            const rawImgUrl = getCharacterImageUrl(character);
            const isGeneratingThisCard = effectiveGeneratingCardIds.has(character.id);
            const status = cardStatusMap[character.id] || (rawImgUrl ? "completed" : "idle");
            const cardError = cardErrorMap[character.id];
            const isImageFailed = failedImageMap[character.id];

            const isExpanded = expandedCardIds.has(character.id);

            return (
              <div
                key={character.id}
                className={`group bg-white dark:bg-zinc-900 border ${
                  status === "failed"
                    ? "border-red-300 dark:border-red-900/60"
                    : isGeneratingThisCard
                    ? "border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                } rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                {/* Top Character Image Section (3:4 Cinematic Portrait Ratio) */}
                <div className="relative aspect-[3/4] w-full bg-zinc-900 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {rawImgUrl && !isImageFailed && !isGeneratingThisCard ? (
                    <img
                      src={rawImgUrl}
                      alt={character.name}
                      onError={() => {
                        setFailedImageMap((prev) => ({ ...prev, [character.id]: true }));
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
                          Rendering Portrait
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
                        onClick={() => handleGenerateSingleImage(character.id)}
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
                        <User className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-zinc-400 block">
                          Uncast Character
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          No portrait generated yet
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
                        Uncast
                      </span>
                    )}
                  </div>

                  {/* Role Tag (Top Left) */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-zinc-950/80 text-blue-400 border border-blue-500/30 backdrop-blur-md shadow-sm">
                      {character.role || "Cast Member"}
                    </span>
                  </div>
                </div>

                {/* Character Metadata Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {character.name}
                      </h3>
                      {character.age && (
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {character.age}
                        </span>
                      )}
                    </div>

                    {character.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {character.description}
                      </p>
                    )}
                  </div>

                  {/* Additional Appearance / Wardrobe Details */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                    {character.appearance && (
                      <div className="line-clamp-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          Appearance:{" "}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {character.appearance}
                        </span>
                      </div>
                    )}

                    {isExpanded && (
                      <>
                        {character.wardrobe && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Wardrobe:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {character.wardrobe}
                            </span>
                          </div>
                        )}
                        {character.personality && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Personality:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {character.personality}
                            </span>
                          </div>
                        )}
                        {character.visual_style && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Visual Style:{" "}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {character.visual_style}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {(character.wardrobe || character.personality || character.visual_style) && (
                      <button
                        onClick={() => toggleExpandCard(character.id)}
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
                      onClick={() => handleGenerateSingleImage(character.id)}
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

          {/* Dashed Add Character Card */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 min-h-[360px] flex flex-col items-center justify-center text-center bg-zinc-50/40 hover:bg-blue-50/30 dark:bg-zinc-900/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center text-zinc-500 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400 transition-colors mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Add Character
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
            No Characters Defined Yet
          </h3>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Extract full character casting sheets directly from your screenplay to generate Nano Banana 2.1 portraits.
          </p>

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
              onClick={handleExtractCharacters}
              disabled={isExtractingCharacters}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isExtractingCharacters ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>Extract Characters from Screenplay</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Add Character Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Character Modal */}
      <AddCharacterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCharacterSubmit}
        isSubmitting={isAddingCharacter}
      />
    </div>
  );
}
