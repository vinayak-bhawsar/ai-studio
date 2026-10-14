"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MessageSquare,
  Mic,
  Volume2,
  Play,
  Pause,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  Globe,
  Radio,
  FileText,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { resolveMediaUrl } from "@/src/features/storyboard/services/storyboardService";
import { productionService } from "../services/productionService";
import { characterService } from "@/src/features/characters/services/characterService";
import { CharacterResponse } from "@/src/features/characters/types/character";
import {
  DialogueItem,
  DialogueVoiceGenerateRequest,
  ShotAudioMixRequest,
  ShotAudioMixResponse,
} from "../types/production";

interface ShotDialogueSectionProps {
  projectId: string;
  sceneId: string;
  shotId: string;
  shotNumber: number;
  shotVideoUrl?: string | null;
  onShotVideoUpdated?: (newVideoUrl: string) => void;
  onRefreshScenes?: () => Promise<void>;
}

// Available voice presets mapped to backend voice_service
const VOICE_OPTIONS = [
  { group: "Female Voices", id: "luna", label: "Luna (Soft, Warm)" },
  { group: "Female Voices", id: "asteria", label: "Asteria (Clear, Melodic)" },
  { group: "Female Voices", id: "stella", label: "Stella (Bright, Expressive)" },
  { group: "Female Voices", id: "athena", label: "Athena (Regal, Authoritative)" },
  { group: "Male Voices", id: "zeus", label: "Zeus (Deep, Commanding)" },
  { group: "Male Voices", id: "orion", label: "Orion (Crisp, Narrator)" },
  { group: "Male Voices", id: "arcas", label: "Arcas (Casual, Natural)" },
  { group: "Male Voices", id: "perseus", label: "Perseus (Bold, Heroic)" },
];

const LANGUAGE_OPTIONS = [
  { id: "en", label: "English (en)" },
  { id: "hi", label: "हिन्दी / Hindi (hi)" },
  { id: "es", label: "Español (es)" },
  { id: "fr", label: "Français (fr)" },
  { id: "de", label: "Deutsch (de)" },
  { id: "ja", label: "日本語 / Japanese (ja)" },
];

const EMOTION_OPTIONS = [
  { id: "neutral", label: "Neutral / Natural" },
  { id: "dramatic", label: "Dramatic" },
  { id: "whispering", label: "Whispering" },
  { id: "excited", label: "Excited" },
  { id: "sad", label: "Sad / Melancholy" },
  { id: "angry", label: "Angry / Fierce" },
  { id: "hopeful", label: "Hopeful" },
  { id: "mysterious", label: "Mysterious" },
  { id: "intense", label: "Intense / Urgent" },
];

export function ShotDialogueSection({
  projectId,
  sceneId,
  shotId,
  shotNumber,
  shotVideoUrl,
  onShotVideoUpdated,
  onRefreshScenes,
}: ShotDialogueSectionProps) {
  const { accessToken } = useAuth();

  // Dialogues list state
  const [dialogues, setDialogues] = useState<DialogueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available Characters in project
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);

  // Voice Generation State
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatingLineId, setGeneratingLineId] = useState<string | null>(null);
  const [voiceResultMsg, setVoiceResultMsg] = useState<string | null>(null);

  // Audio Mixing State
  const [isMixingAudio, setIsMixingAudio] = useState(false);
  const [mixResult, setMixResult] = useState<ShotAudioMixResponse | null>(null);
  const [showMixSettings, setShowMixSettings] = useState(false);
  const [duckAmbient, setDuckAmbient] = useState(true);
  const [ambientVolume, setAmbientVolume] = useState(0.25);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [forceRemix, setForceRemix] = useState(false);

  // Populate from screenplay
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateMsg, setPopulateMsg] = useState<string | null>(null);

  // Active audio player
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Load project characters for the speaker dropdown
  useEffect(() => {
    let active = true;
    if (!accessToken || !projectId) return;

    characterService
      .getCharacters(projectId, accessToken)
      .then((res) => {
        if (active) {
          setCharacters(Array.isArray(res) ? res : []);
        }
      })
      .catch((err) => {
        console.warn("Failed to load project characters:", err);
      });

    return () => {
      active = false;
    };
  }, [projectId, accessToken]);

  // 2. Fetch shot dialogues
  const loadDialogues = useCallback(async () => {
    if (!accessToken || !projectId || !shotId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productionService.getShotDialogues(projectId, shotId, accessToken);
      setDialogues(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dialogues";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, projectId, shotId]);

  useEffect(() => {
    loadDialogues();
  }, [loadDialogues]);

  // Handle Play / Pause for Dialogue Audio
  const togglePlayAudio = (url: string) => {
    const fullUrl = resolveMediaUrl(url);
    if (!fullUrl) return;

    if (currentlyPlayingAudio === fullUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentlyPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(fullUrl);
      audioRef.current = audio;
      audio.onended = () => setCurrentlyPlayingAudio(null);
      audio.onerror = () => setCurrentlyPlayingAudio(null);
      audio.play().catch((e) => console.warn("Audio play failed:", e));
      setCurrentlyPlayingAudio(fullUrl);
    }
  };

  // Add new dialogue row
  const handleAddDialogue = () => {
    const defaultChar = characters[0];
    const newLine: DialogueItem = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      scene_id: sceneId,
      shot_id: shotId,
      character_id: defaultChar?.id || null,
      character_name: defaultChar?.name || "Narrator",
      text: "",
      language: "en",
      voice_id: defaultChar ? (defaultChar.role?.toLowerCase().includes("female") ? "luna" : "zeus") : "zeus",
      emotion_tone: "neutral",
      start_time: dialogues.length > 0 ? (dialogues[dialogues.length - 1].start_time || 0) + 2.0 : 0.0,
      status: "pending",
    };
    setDialogues((prev) => [...prev, newLine]);
  };

  // Update a field in a dialogue row
  const handleUpdateLine = (index: number, updates: Partial<DialogueItem>) => {
    setDialogues((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Delete a dialogue row
  const handleDeleteLine = async (index: number) => {
    const updated = dialogues.filter((_, idx) => idx !== index);
    setDialogues(updated);

    // Save immediately to backend so deletion persists
    if (accessToken && projectId && shotId) {
      try {
        await productionService.updateShotDialogues(projectId, shotId, updated, accessToken);
      } catch (err) {
        console.error("Failed to persist line deletion:", err);
      }
    }
  };

  // Save changes to backend (PUT /projects/{id}/shots/{id}/dialogues)
  const handleSaveDialogues = async () => {
    if (!accessToken || !projectId || !shotId || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Validate that all lines have non-empty text
      const cleanDialogues = dialogues.map((d) => ({
        ...d,
        scene_id: sceneId,
        shot_id: shotId,
        character_name: d.character_name.trim() || "Character",
        text: d.text.trim() || "...",
      }));

      const res = await productionService.updateShotDialogues(
        projectId,
        shotId,
        cleanDialogues,
        accessToken
      );
      setDialogues(Array.isArray(res) ? res : cleanDialogues);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save dialogues";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Voice for Shot or Single Line
  const handleGenerateVoice = async (targetDialogueId?: string) => {
    if (!accessToken || !projectId || !shotId || isGeneratingVoice) return;

    setIsGeneratingVoice(true);
    setGeneratingLineId(targetDialogueId || null);
    setError(null);
    setVoiceResultMsg(null);

    try {
      // First ensure any unsaved text changes are saved
      await productionService.updateShotDialogues(projectId, shotId, dialogues, accessToken);

      const reqData: DialogueVoiceGenerateRequest = {
        dialogue_id: targetDialogueId || null,
        force_regenerate: Boolean(targetDialogueId), // force when explicitly regenerating a single line
      };

      const res = await productionService.generateShotVoice(projectId, shotId, reqData, accessToken);

      if (res && Array.isArray(res.dialogues)) {
        setDialogues(res.dialogues);
      } else {
        await loadDialogues();
      }

      setVoiceResultMsg(
        res.message ||
          `Synthesized ${res.completed_dialogues}/${res.total_dialogues} dialogue audio lines.`
      );
      setTimeout(() => setVoiceResultMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to synthesize voice";
      setError(msg);
    } finally {
      setIsGeneratingVoice(false);
      setGeneratingLineId(null);
    }
  };

  // Mix Dialogue with Shot Video
  const handleMixAudio = async () => {
    if (!accessToken || !projectId || !shotId || isMixingAudio) return;

    setIsMixingAudio(true);
    setError(null);
    setMixResult(null);

    try {
      const mixPayload: ShotAudioMixRequest = {
        duck_ambient: duckAmbient,
        ambient_volume: ambientVolume,
        speech_volume: speechVolume,
        force_remix: forceRemix,
      };

      const res = await productionService.mixShotAudio(projectId, shotId, mixPayload, accessToken);
      setMixResult(res);

      if (res.status === "completed" && res.video_url) {
        if (onShotVideoUpdated) {
          onShotVideoUpdated(res.video_url);
        }
        if (onRefreshScenes) {
          onRefreshScenes();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Audio mixing failed";
      setError(msg);
    } finally {
      setIsMixingAudio(false);
    }
  };

  // Populate from approved screenplay
  const handlePopulateFromScreenplay = async () => {
    if (!accessToken || !projectId || isPopulating) return;

    setIsPopulating(true);
    setPopulateMsg(null);
    setError(null);

    try {
      const res = await productionService.populateDialogues(projectId, accessToken);
      setPopulateMsg(res.message || `Mapped ${res.populated_dialogues} dialogues into shots.`);
      await loadDialogues();
      if (onRefreshScenes) {
        await onRefreshScenes();
      }
      setTimeout(() => setPopulateMsg(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to populate dialogues from screenplay";
      setError(msg);
    } finally {
      setIsPopulating(false);
    }
  };

  const completedAudioCount = useMemo(() => {
    return dialogues.filter((d) => d.status === "completed" && Boolean(d.audio_url)).length;
  }, [dialogues]);

  return (
    <div className="space-y-4">
      {/* Dialogue Header Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Shot #{shotNumber} Character Dialogue & Voice
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-mono">
                  {dialogues.length} {dialogues.length === 1 ? "Line" : "Lines"}
                </span>
                {completedAudioCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{completedAudioCount} Voiced</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Craft spoken character lines, synthesize natural voices, and mix with ambient video audio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePopulateFromScreenplay}
              disabled={isPopulating}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Extract dialogues from approved screenplay and map them to storyboard shots"
            >
              {isPopulating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              )}
              <span>Sync from Script</span>
            </button>

            <button
              onClick={handleAddDialogue}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>

            {dialogues.length > 0 && (
              <>
                <button
                  onClick={handleSaveDialogues}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  ) : null}
                  <span>{saveSuccess ? "Saved" : "Save Changes"}</span>
                </button>

                <button
                  onClick={() => handleGenerateVoice()}
                  disabled={isGeneratingVoice}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Generate natural voice audio for all dialogue lines"
                >
                  {isGeneratingVoice && !generatingLineId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Voice</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Informative Disclaimer */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-300">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
          <span>
            <strong>Dialogue Audio & Voice Synthesis:</strong> Generates character-specific speech with multi-language & emotion support. Generates mixed dubbed video clips with ambient background ducking.
          </span>
        </div>

        {/* Notifications */}
        {populateMsg && (
          <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{populateMsg}</span>
          </div>
        )}

        {voiceResultMsg && (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-600" />
            <span>{voiceResultMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[11px] underline font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dialogue Lines Editor List */}
        {isLoading ? (
          <div className="py-8 flex items-center justify-center text-zinc-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 mr-2" />
            <span>Loading shot dialogues...</span>
          </div>
        ) : dialogues.length === 0 ? (
          <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto" />
            <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              No Dialogues Defined for Shot #{shotNumber}
            </h5>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Add dialogue lines spoken by characters during this shot, or sync them directly from the approved screenplay.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleAddDialogue}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Line</span>
              </button>
              <button
                onClick={handlePopulateFromScreenplay}
                disabled={isPopulating}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sync from Script</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {dialogues.map((line, index) => {
              const isLineGenerating = isGeneratingVoice && generatingLineId === line.id;
              const hasAudio = Boolean(line.audio_url);
              const audioResolved = resolveMediaUrl(line.audio_url);
              const isPlaying = currentlyPlayingAudio === audioResolved;

              return (
                <div
                  key={line.id || index}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 space-y-2.5 transition-all"
                >
                  {/* Row Controls: Character, Voice, Language, Tone, Start Time */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {/* Character / Speaker */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Speaker
                      </label>
                      <select
                        value={line.character_id || (line.character_name ? `name:${line.character_name}` : "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("name:")) {
                            handleUpdateLine(index, {
                              character_id: null,
                              character_name: val.replace("name:", ""),
                            });
                          } else {
                            const c = characters.find((char) => char.id === val);
                            if (c) {
                              const autoVoice = c.role?.toLowerCase().includes("female") ? "luna" : "zeus";
                              handleUpdateLine(index, {
                                character_id: c.id,
                                character_name: c.name,
                                voice_id: line.voice_id || autoVoice,
                              });
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      >
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.role || "Character"})
                          </option>
                        ))}
                        {(!characters.some((c) => c.name === line.character_name) && line.character_name) && (
                          <option value={`name:${line.character_name}`}>
                            {line.character_name}
                          </option>
                        )}
                        <option value="name:Narrator">Narrator</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Language
                      </label>
                      <select
                        value={line.language || "en"}
                        onChange={(e) => handleUpdateLine(index, { language: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Voice Model */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Voice
                      </label>
                      <select
                        value={line.voice_id || "zeus"}
                        onChange={(e) => handleUpdateLine(index, { voice_id: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                      >
                        <optgroup label="Female Voices">
                          {VOICE_OPTIONS.filter((v) => v.group === "Female Voices").map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Male Voices">
                          {VOICE_OPTIONS.filter((v) => v.group === "Male Voices").map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Emotion / Tone */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Emotion / Tone
                      </label>
                      <select
                        value={line.emotion_tone || "neutral"}
                        onChange={(e) => handleUpdateLine(index, { emotion_tone: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      >
                        {EMOTION_OPTIONS.map((em) => (
                          <option key={em.id} value={em.id}>
                            {em.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time (Seconds) */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Start (s)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={line.start_time ?? 0}
                        onChange={(e) =>
                          handleUpdateLine(index, { start_time: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 text-xs font-mono font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Dialogue Spoken Text */}
                  <div>
                    <textarea
                      value={line.text}
                      onChange={(e) => handleUpdateLine(index, { text: e.target.value })}
                      rows={2}
                      placeholder={
                        line.language === "hi"
                          ? "यहाँ संवाद लिखें (उदा. समय बहुत कम है, हमें तुरंत निकलना होगा...)"
                          : "Enter spoken dialogue line (e.g. We must cross the valley before sunrise...)"
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Row Footer: Audio status, Playback, Single-line voice render, Delete */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      {hasAudio ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => line.audio_url && togglePlayAudio(line.audio_url)}
                            className="px-2 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-950/60 dark:hover:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-green-200 dark:border-green-800 cursor-pointer transition-colors"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3 h-3 fill-current" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Listen Audio</span>
                              </>
                            )}
                          </button>
                          {line.duration_seconds && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              {line.duration_seconds.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-zinc-400" />
                          <span>Voice pending synthesis</span>
                        </span>
                      )}

                      {line.error && (
                        <span className="text-[10px] text-red-500 line-clamp-1 max-w-xs">
                          {line.error}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGenerateVoice(line.id)}
                        disabled={isGeneratingVoice || !line.text.trim()}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                        title="Synthesize / regenerate voice for this line only"
                      >
                        {isLineGenerating ? (
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                        ) : (
                          <RefreshCw className="w-3 h-3 text-zinc-500" />
                        )}
                        <span>{hasAudio ? "Regenerate" : "Generate"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLine(index)}
                        className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete dialogue line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mix Dialogue into Shot Video Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Audio Mixing & Dialogue Dubbing
                </h4>
                {mixResult?.status === "completed" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                    Dubbed Video Ready
                  </span>
                )}
                {mixResult?.status === "skipped" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    Clip Preserved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Mix synthesized character dialogue directly into the generated shot video with automatic ambient audio ducking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMixSettings(!showMixSettings)}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Mixing Controls</span>
              {showMixSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={handleMixAudio}
              disabled={isMixingAudio || !shotVideoUrl}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title={
                !shotVideoUrl
                  ? "Generate the video clip first before mixing dialogue audio"
                  : "Mix synthesized dialogue audio into the video"
              }
            >
              {isMixingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mixing Audio Track...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Mix Dialogue with Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video requirement warning if video not yet rendered */}
        {!shotVideoUrl && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Shot #{shotNumber} video has not been rendered yet. Render the shot video first to mix character dialogue.
            </span>
          </div>
        )}

        {/* Mixing status banner */}
        {mixResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              mixResult.status === "completed"
                ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {mixResult.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-zinc-500 shrink-0" />
              )}
              <span>
                {mixResult.status === "skipped"
                  ? "Original video clip preserved: No completed dialogue audio to mix into this shot."
                  : mixResult.message || "Dialogue audio successfully mixed into the shot video."}
              </span>
            </div>
            {mixResult.video_url && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                Duck Ambient: {mixResult.ambient_preserved ? "Preserved" : "Default"}
              </span>
            )}
          </div>
        )}

        {/* Expandable Mixing Controls */}
        {showMixSettings && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ambient Ducking Toggle */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={duckAmbient}
                  onChange={(e) => setDuckAmbient(e.target.checked)}
                  className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Ambient Ducking</span>
              </label>
              <p className="text-[10px] text-zinc-500">
                Lowers ambient environment tone while character dialogue is actively speaking.
              </p>
            </div>

            {/* Ambient Volume Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  Ambient Level: {Math.round(ambientVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400">
                Background audio volume during speech (default: 25%)
              </p>
            </div>

            {/* Speech Volume Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  Speech Volume: {Math.round(speechVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400">
                Gain boost for character voice track (default: 100%)
              </p>
            </div>

            {/* Force Remix Option */}
            <div className="sm:col-span-3 pt-1 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceRemix}
                  onChange={(e) => setForceRemix(e.target.checked)}
                  className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Force re-mix audio even if already dubbed</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
