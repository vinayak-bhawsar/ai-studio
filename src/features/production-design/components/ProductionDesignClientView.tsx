"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Palette,
  Sparkles,
  Wand2,
  Camera,
  Sun,
  Layers,
  Compass,
  ChevronLeft,
  Save,
  MessageSquareShare,
  CheckCircle2,
  Edit,
  SkipForward,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "@/src/features/projects/services/projectService";
import { stylebookService } from "@/src/features/production-design/services/stylebookService";
import { StyleBookResponse, StyleBookContent } from "@/src/features/production-design/types/stylebook";
import { Project } from "@/src/features/projects/types/project";
import { useConversations } from "@/src/features/chat/hooks/useConversations";
import { useChat } from "@/src/features/chat/hooks/useChat";
import { ChatPanel } from "@/src/features/chat/components/ChatPanel";
import { StudioToolbar } from "@/src/components/layout/StudioToolbar";
import { EditStyleBookModal } from "./EditStyleBookModal";

interface ProductionDesignClientViewProps {
  projectId: string;
}

export function ProductionDesignClientView({
  projectId,
}: ProductionDesignClientViewProps) {
  const { accessToken } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [styleBookData, setStyleBookData] = useState<StyleBookResponse | null>(null);
  const [editState, setEditState] = useState<StyleBookContent | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptIdea, setPromptIdea] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const [isStyleBookSkipped, setIsStyleBookSkipped] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`stylebook_skipped_${projectId}`) === "true";
    }
    return false;
  });

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`stylebook_skipped_${projectId}`, "true");
    }
    setIsStyleBookSkipped(true);
    router.push(`/projects/${projectId}/storyboard`);
  };

  const handleProceed = () => {
    router.push(`/projects/${projectId}/storyboard`);
  };

  const { conversations, activeConversationId } = useConversations({ projectId });

  const {
    messages,
    isLoadingHistory,
    isStreaming,
    streamingReasoning,
    streamingReasoningSteps,
    streamingContent,
    error: chatError,
    sendMessage,
  } = useChat({
    projectId,
    conversationId: activeConversationId,
  });

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  useEffect(() => {
    let isMounted = true;
    if (!accessToken || !projectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const projRes = await projectService.getProject(projectId, accessToken);
        if (projRes.success && projRes.data && isMounted) {
          setProject(projRes.data);
        }

        const styleRes = await stylebookService.getStyleBook(projectId, accessToken);
        if (styleRes && styleRes.style_book && isMounted) {
          setStyleBookData(styleRes);
          setEditState(styleRes.style_book);
          setHasChanges(false);
        }
      } catch {
        if (isMounted) {
          setStyleBookData(null);
          setEditState(null);
          setHasChanges(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId, accessToken]);

  const handleGenerate = async () => {
    if (!accessToken || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await stylebookService.generateStyleBook(
        projectId,
        promptIdea.trim() ? { idea: promptIdea.trim() } : {},
        accessToken
      );
      if (res && res.style_book) {
        setStyleBookData(res);
        setEditState(res.style_book);
        setHasChanges(false);
        setIsSelected(false);
      }
    } catch (err) {
      console.error("Failed to generate stylebook:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManually = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveModal = async (data: StyleBookContent) => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const res = await stylebookService.updateStyleBook(projectId, data, accessToken);
      if (res && res.style_book) {
        setStyleBookData(res);
        setEditState(res.style_book);
        setHasChanges(false);
        setIsSelected(false);
      }
    } catch (err) {
      console.error("Failed to save stylebook:", err);
    } finally {
      setIsSaving(false);
      setIsEditModalOpen(false);
    }
  };

  const handleSendToChat = async () => {
    if (!editState || isSendingToChat) return;
    setIsSendingToChat(true);
    try {
      const message = `Style Book selected:

Aesthetic: ${editState.aesthetic?.preset || 'N/A'}
Aspect Ratio: ${editState.composition_and_framing?.aspect_ratio || 'N/A'}
Composition Rules: ${editState.composition_and_framing?.composition_rules?.join(', ') || 'N/A'}
Framing: ${editState.composition_and_framing?.framing || 'N/A'}
Color Palette: ${editState.color_palette?.colors?.join(', ') || 'N/A'}
Lighting: ${editState.lighting?.style || 'N/A'}
Camera: ${editState.camera?.lens || 'N/A'}
Texture: ${editState.texture?.style || 'N/A'}
Mood: ${editState.mood || 'N/A'}`;

      await sendMessage(message);
      setIsSelected(false);
    } catch (err) {
      console.error("Failed to send to chat:", err);
    } finally {
      setIsSendingToChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-zinc-950 select-none">
      {/* Left Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-14 border-b border-zinc-200/80 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-950 flex-shrink-0">
          <span className="text-xs font-bold text-zinc-600 truncate max-w-xs">
            {project ? project.title : "Untitled Short"}
          </span>

          <span className="text-xs font-extrabold text-zinc-900 tracking-tight">
            Style Book & Production Design
          </span>

          <Link
            href={`/projects/${projectId}`}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Script Writing</span>
          </Link>
        </div>

        {/* Left Style Book Canvas */}
        <div className="flex-1 bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
          <div className="max-w-4xl mx-auto w-full space-y-6 pb-20">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-100 gap-4">
              <div className="flex items-center gap-2.5 text-zinc-900">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Production Design Style Book</h2>
                  <p className="text-xs text-zinc-500">
                    Visual aesthetics, color palettes, lighting rules, and camera cinematography.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                {editState && (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Manually</span>
                    </button>
                    <button
                      onClick={handleSendToChat}
                      disabled={!isSelected || isSendingToChat}
                      className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      {isSendingToChat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquareShare className="w-3.5 h-3.5" />
                      )}
                      <span>Send to Chat</span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editState ? "Regenerate Style Book" : "Generate Style Book"}</span>
                </button>

                <button
                  onClick={handleSkip}
                  className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Skip Style Book and proceed directly to Storyboard"
                >
                  <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Skip for Now</span>
                </button>

                <button
                  onClick={handleProceed}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Storyboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {editState ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsSelected(!isSelected)}
                    className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Style Book Selected</span>
                      </>
                    ) : (
                      <span>Select Style Book</span>
                    )}
                  </button>
                </div>
                <div
                  onClick={() => setIsSelected(!isSelected)}
                  className={`transition-all duration-200 rounded-3xl cursor-pointer border ${
                    isSelected ? "border-emerald-500 bg-emerald-50/20 shadow-[0_0_0_4px_rgba(16,185,129,0.1)] p-4 -m-4" : "border-transparent p-4 -m-4 hover:bg-zinc-50/50"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pointer-events-auto">
                    {/* Aesthetic Preset Card */}
                    <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 mb-1">
                        <Compass className="w-4 h-4 text-blue-600" />
                        <span>Visual Aesthetic & Direction</span>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Preset</label>
                        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-blue-950 dark:text-blue-100 px-3 py-2 rounded-lg truncate">
                          {editState.aesthetic?.preset || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                        <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[4rem]">
                          {editState.aesthetic?.description || editState.mood || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Color Palette Card */}
                    <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                        <Palette className="w-4 h-4 text-blue-600" />
                        <span>Color Palette</span>
                      </div>
                      {editState.color_palette?.colors && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {editState.color_palette.colors.map((hex: string, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                              <div
                                className="w-10 h-10 rounded-xl border-2 border-zinc-200/50 shadow-2xs transition-transform"
                                style={{ backgroundColor: hex }}
                              />
                              <div className="w-16 text-[10px] font-mono text-center text-zinc-600 uppercase">
                                {hex}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Palette Description</label>
                        <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[3rem]">
                          {editState.color_palette?.description || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Lighting Atmosphere Card */}
                    <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                        <Sun className="w-4 h-4 text-blue-600" />
                        <span>Lighting & Atmosphere</span>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Style</label>
                        <div className="w-full bg-white border border-zinc-200 text-xs font-bold text-zinc-800 px-3 py-2 rounded-lg truncate">
                          {editState.lighting?.style || 'N/A'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Intensity</label>
                          <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                            {editState.lighting?.intensity || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                        <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[3rem]">
                          {editState.lighting?.description || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Camera Cinematography Card */}
                    <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Camera & Lens Specifications</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Lens Type</label>
                          <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                            {editState.camera?.lens || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Movement</label>
                          <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                            {editState.camera?.movement || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Depth of Field</label>
                          <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                            {editState.camera?.depth_of_field || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                        <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[3rem]">
                          {editState.camera?.description || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Composition & Texture Card */}
                    <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 mb-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Composition, Framing & Texture</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Aspect Ratio</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.aspect_ratio || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Composition Rules</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.composition_rules?.join(', ') || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Framing</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.framing || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Shot Scale</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.shot_scale || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Camera Angle</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.camera_angle || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Composition Description</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.composition_and_framing?.composition || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Texture / Grain Style</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg truncate">
                              {editState.texture?.style || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Texture Description</label>
                            <div className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[5rem]">
                              {editState.texture?.description || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 mb-4 shadow-2xs">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-1">
                  No Style Book Generated Yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
                  Define the visual aesthetic, color palette, lighting rules, and camera direction for your film.
                </p>

                <div className="w-full max-w-sm mb-4">
                  <input
                    type="text"
                    value={promptIdea}
                    onChange={(e) => setPromptIdea(e.target.value)}
                    placeholder="Optional style prompt (e.g. 70s neo-noir film grain)..."
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 text-zinc-900 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={handleAddManually}
                    className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    Add Manually
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span>Generate Style Book</span>
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <SkipForward className="w-4 h-4 text-zinc-500" />
                    <span>Skip for Now</span>
                  </button>
                  <button
                    onClick={handleProceed}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Proceed to Storyboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <StudioToolbar
            projectId={projectId}
            activeStage="stylebook"
            isStyleBookSkipped={isStyleBookSkipped}
            versionText={isStyleBookSkipped ? "style book • skipped (optional)" : "style book • version 1 of 1"}
          />
        </div>
      </div>

      {/* Right AI Chat Assistant Panel */}
      <div className="w-full lg:w-[420px] flex flex-col justify-between bg-zinc-50/40 h-full min-h-0 flex-shrink-0 overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
        <ChatPanel
          conversationTitle={activeConversation?.title}
          messages={messages}
          isLoadingHistory={isLoadingHistory}
          isStreaming={isStreaming}
          streamingReasoning={streamingReasoning}
          streamingReasoningSteps={streamingReasoningSteps}
          streamingContent={streamingContent}
          error={chatError}
          onSendMessage={sendMessage}
          onSelectDirection={async (dir) => {
            await sendMessage(`I choose: ${dir.title}`);
          }}
        />
      </div>
      
      <EditStyleBookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={editState}
        onSave={handleSaveModal}
      />
    </div>
  );
}
