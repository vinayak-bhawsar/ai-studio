"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Palette,
  Users,
  Image as ImageIcon,
  Layers,
  Clapperboard,
  Scissors,
  Wand2,
  Camera,
  Sun,
  Compass,
  Video,
  Film,
  CheckCircle2,
  Edit,
  MessageSquareShare,
  SkipForward,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "@/src/features/projects/services/projectService";
import { Project } from "@/src/features/projects/types/project";
import { useConversations } from "@/src/features/chat/hooks/useConversations";
import { useChat } from "@/src/features/chat/hooks/useChat";
import { chatService } from "@/src/features/chat/services/chatService";
import { ChatPanel } from "@/src/features/chat/components/ChatPanel";
import { ChatActionItem, CreativeDirectionItem } from "@/src/features/chat/types/chat";
import { screenplayService } from "@/src/features/screenplay/services/screenplayService";
import { ScreenplayResponse } from "@/src/features/screenplay/types/screenplay";
import { ScreenplayDocument } from "@/src/features/screenplay/components/ScreenplayDocument";
import { stylebookService } from "@/src/features/production-design/services/stylebookService";
import { StyleBookResponse, StyleBookContent } from "@/src/features/production-design/types/stylebook";
import { EditStyleBookModal } from "@/src/features/production-design/components/EditStyleBookModal";
import { HyperdreamStyleBook } from "@/src/features/projects/components/HyperdreamStyleBook";
import { characterService, getCharacterImageUrl } from "@/src/features/characters/services/characterService";
import { CharacterResponse } from "@/src/features/characters/types/character";
import { HyperdreamCharacterCasting } from "@/src/features/characters/components/HyperdreamCharacterCasting";
import { environmentService, getEnvironmentImageUrl } from "@/src/features/environments/services/environmentService";
import { EnvironmentResponse } from "@/src/features/environments/types/environment";
import { HyperdreamEnvironmentCasting } from "@/src/features/environments/components/HyperdreamEnvironmentCasting";
import { storyboardService } from "@/src/features/storyboard/services/storyboardService";
import { StoryboardResponse } from "@/src/features/storyboard/types/storyboard";
import { HyperdreamStoryboard } from "@/src/features/storyboard/components/HyperdreamStoryboard";
import { HyperdreamProductionStudio } from "@/src/features/shots/components/HyperdreamProductionStudio";
import { FullVideoCompositionSection } from "@/src/features/shots/components/FullVideoCompositionSection";
import { StudioToolbar, StudioStage } from "@/src/components/layout/StudioToolbar";
import { ScreenplayShimmer, ProductionStudioShimmer } from "@/src/components/shared/StudioShimmers";

interface ProjectClientViewProps {
  projectId: string;
  initialStage?: StudioStage;
}

export function ProjectClientView({
  projectId,
  initialStage = "screenplay",
}: ProjectClientViewProps) {
  const { accessToken } = useAuth();

  const [activeStage, setActiveStage] = useState<StudioStage>(initialStage);

  const getStagePath = useCallback((stage: StudioStage, pId: string): string => {
    switch (stage) {
      case "screenplay":
        return `/projects/${pId}`;
      case "characters":
        return `/projects/${pId}/production-design/characters`;
      case "environments":
        return `/projects/${pId}/production-design/environments`;
      case "storyboard":
        return `/projects/${pId}/storyboard`;
      case "shots":
        return `/projects/${pId}/shots`;
      case "editor":
        return `/projects/${pId}/editor`;
      case "stylebook":
        return `/projects/${pId}/production-design`;
      default:
        return `/projects/${pId}`;
    }
  }, []);

  const isScreenplayReadyRef = useRef(false);

  const handleStageChange = useCallback(
    (newStage: StudioStage, force = false) => {
      // Guard: until script is generated completely and visible on UI, do not open character page
      if (newStage === "characters" && !isScreenplayReadyRef.current && !force) {
        console.warn("Character stage navigation blocked: screenplay is not completely generated and visible on UI.");
        return;
      }
      setActiveStage(newStage);
      if (typeof window !== "undefined") {
        const targetPath = getStagePath(newStage, projectId);
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ stage: newStage }, "", targetPath);
        }
      }
    },
    [projectId, getStagePath]
  );

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      if (path.includes("/storyboard")) {
        setActiveStage("storyboard");
      } else if (path.includes("/environments")) {
        setActiveStage("environments");
      } else if (path.includes("/characters")) {
        if (!isScreenplayReadyRef.current) {
          setActiveStage("screenplay");
          return;
        }
        setActiveStage("characters");
      } else if (path.includes("/shots")) {
        setActiveStage("shots");
      } else if (path.includes("/editor")) {
        setActiveStage("editor");
      } else if (path.includes("/production-design")) {
        setActiveStage("stylebook");
      } else if (path.endsWith(`/projects/${projectId}`)) {
        setActiveStage("screenplay");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [projectId]);
  const [project, setProject] = useState<Project | null>(null);
  const [screenplay, setScreenplay] = useState<ScreenplayResponse | null>(null);
  const [styleBookData, setStyleBookData] = useState<StyleBookResponse | null>(null);
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentResponse[]>([]);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState(false);
  const [environmentsError, setEnvironmentsError] = useState<string | null>(null);

  const [storyboardData, setStoryboardData] = useState<StoryboardResponse | null>(null);
  const [isLoadingStoryboard, setIsLoadingStoryboard] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [productionInitialSceneId, setProductionInitialSceneId] = useState<string | null>(null);
  const [productionInitialShotId, setProductionInitialShotId] = useState<string | null>(null);

  const [isStyleBookSelected, setIsStyleBookSelected] = useState(false);
  const [isSendingStyleBook, setIsSendingStyleBook] = useState(false);
  const [isStyleBookEditModalOpen, setIsStyleBookEditModalOpen] = useState(false);
  const [isStyleBookSkipped, setIsStyleBookSkipped] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`stylebook_skipped_${projectId}`) === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsStyleBookSkipped(localStorage.getItem(`stylebook_skipped_${projectId}`) === "true");
    }
  }, [projectId]);

  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingScreenplay, setIsLoadingScreenplay] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch project details
  useEffect(() => {
    let isMounted = true;
    if (!accessToken || !projectId) return;

    const fetchProject = async () => {
      setIsLoadingProject(true);
      try {
        const res = await projectService.getProject(projectId, accessToken);
        if (res.success && res.data && isMounted) {
          let projData = res.data;
          const isPlaceholder =
            !projData.title ||
            ["untitled short", "untitled", "new project"].includes(
              projData.title.trim().toLowerCase()
            );

          if (isPlaceholder) {
            try {
              const convsRes = await chatService.getConversations(projectId, 1, 5, accessToken);
              if (convsRes.success && convsRes.data?.items?.length) {
                const valid = convsRes.data.items.find(
                  (c: any) =>
                    c.title &&
                    !["untitled short", "untitled", "new chat", "new conversation"].includes(
                      c.title.trim().toLowerCase()
                    )
                );
                if (valid && valid.title.trim()) {
                  const resolvedTitle = valid.title.trim();
                  projData = { ...projData, title: resolvedTitle };
                  projectService
                    .updateProject(projectId, { title: resolvedTitle }, accessToken)
                    .catch(() => {});
                }
              }
            } catch {
              // Ignore failure to fetch conversations
            }
          }
          setProject(projData);
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        if (isMounted) setIsLoadingProject(false);
      }
    };

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [projectId, accessToken]);

  const searchParams = useSearchParams();
  const initialConvId = searchParams?.get("c") || null;

  // Hook into conversations for this specific project
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversationTitle,
  } = useConversations({ projectId, initialConversationId: initialConvId });

  const convIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => {
    convIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const [isGeneratingScreenplay, setIsGeneratingScreenplay] = useState(false);
  const [errorScreenplay, setErrorScreenplay] = useState<string | null>(null);

  const isScreenplayReady = Boolean(
    screenplay &&
    screenplay.screenplay &&
    (
      (screenplay.screenplay.scenes && screenplay.screenplay.scenes.length > 0) ||
      (screenplay.screenplay.title && screenplay.screenplay.title !== "Untitled Short")
    ) &&
    !isGeneratingScreenplay &&
    !isLoadingScreenplay
  );

  useEffect(() => {
    isScreenplayReadyRef.current = isScreenplayReady;
  }, [isScreenplayReady]);

  // If currently on characters stage before screenplay is generated and visible, redirect to screenplay
  useEffect(() => {
    if (!isLoadingProject && !isLoadingScreenplay && !isGeneratingScreenplay) {
      if (activeStage === "characters" && !isScreenplayReady) {
        handleStageChange("screenplay");
      }
    }
  }, [isLoadingProject, isLoadingScreenplay, isGeneratingScreenplay, activeStage, isScreenplayReady, handleStageChange]);

  // Workflow orchestration refs and state
  const isWorkflowBusyRef = useRef(false);
  const [, setIsWorkflowBusy] = useState(false);
  const screenplayGeneratingRef = useRef(false);
  const characterRecordsExtractingRef = useRef(false);
  const environmentRecordsExtractingRef = useRef(false);
  const isGeneratingCharacterImagesRef = useRef(false);
  const isGeneratingEnvironmentImagesRef = useRef(false);
  const screenplayPromptAskedProjectRef = useRef<string | null>(null);
  const portraitPromptAskedProjectRef = useRef<string | null>(null);
  const environmentPromptAskedProjectRef = useRef<string | null>(null);
  const stylebookPromptAskedProjectRef = useRef<string | null>(null);
  const storyboardPromptAskedProjectRef = useRef<string | null>(null);
  const shotsPromptAskedProjectRef = useRef<string | null>(null);

  const [isGeneratingCharacterImages, setIsGeneratingCharacterImages] = useState(false);
  const [generatingCharacterCardIds, setGeneratingCharacterCardIds] = useState<Set<string>>(new Set());
  const [isGeneratingEnvironmentImages, setIsGeneratingEnvironmentImages] = useState(false);
  const [generatingEnvironmentCardIds, setGeneratingEnvironmentCardIds] = useState<Set<string>>(new Set());

  // Callback refs to avoid circular dependency
  const autoPrepareCharactersRef = useRef<((title?: string) => Promise<void>) | null>(null);
  const autoPrepareEnvironmentsRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    isWorkflowBusyRef.current = false;
    screenplayGeneratingRef.current = false;
    characterRecordsExtractingRef.current = false;
    environmentRecordsExtractingRef.current = false;
    isGeneratingCharacterImagesRef.current = false;
    isGeneratingEnvironmentImagesRef.current = false;
    screenplayPromptAskedProjectRef.current = null;
    portraitPromptAskedProjectRef.current = null;
    environmentPromptAskedProjectRef.current = null;
    stylebookPromptAskedProjectRef.current = null;
    storyboardPromptAskedProjectRef.current = null;
    shotsPromptAskedProjectRef.current = null;
    setIsGeneratingCharacterImages(false);
    setIsGeneratingEnvironmentImages(false);
    setGeneratingCharacterCardIds(new Set());
    setGeneratingEnvironmentCardIds(new Set());
  }, [projectId]);

  // Load screenplay for current active conversation
  const loadScreenplay = useCallback(
    async (convId: string): Promise<ScreenplayResponse | null> => {
      if (!accessToken || !projectId || !convId) {
        setIsLoadingScreenplay(false);
        return null;
      }

      setIsLoadingScreenplay(true);
      setErrorScreenplay(null);
      try {
        const scriptData = await screenplayService.getScreenplay(
          projectId,
          convId,
          accessToken
        );
        if (convIdRef.current === convId) {
          setScreenplay(scriptData);
          if (
            scriptData?.screenplay?.title &&
            !["untitled short", "untitled", "new project"].includes(
              scriptData.screenplay.title.trim().toLowerCase()
            )
          ) {
            const cleanTitle = scriptData.screenplay.title.trim();
            setProject((prev) => (prev ? { ...prev, title: cleanTitle } : prev));
            if (accessToken && projectId) {
              projectService.updateProject(projectId, { title: cleanTitle }, accessToken).catch(() => {});
            }
          }
        }
        return scriptData;
      } catch (err: any) {
        if (convIdRef.current === convId) {
          setScreenplay(null);
        }
        return null;
      } finally {
        if (convIdRef.current === convId) {
          setIsLoadingScreenplay(false);
        }
      }
    },
    [accessToken, projectId]
  );

  const [activeTitleOverride, setActiveTitleOverride] = useState<string | null>(null);
  useEffect(() => {
    setActiveTitleOverride(null);
  }, [activeConversationId]);

  // Hook into chat messages and SSE stream for active conversation
  const {
    messages,
    isLoadingHistory,
    isStreaming,
    streamingReasoning,
    streamingReasoningSteps,
    streamingContent,
    error: chatError,
    sendMessage,
    setMessages,
  } = useChat({
    projectId,
    conversationId: activeConversationId,
    onConversationTitleUpdate: (title, convId) => {
      updateConversationTitle(convId, title);
      if (!activeConversationId || activeConversationId === convId) {
        setActiveTitleOverride(title);
      }
      if (
        title &&
        ![
          "untitled short",
          "untitled",
          "new chat",
          "new conversation",
          "new project",
          "creative idea",
        ].includes(title.trim().toLowerCase())
      ) {
        const cleanTitle = title.trim();
        setProject((prev) => (prev ? { ...prev, title: cleanTitle } : prev));
        if (accessToken && projectId) {
          projectService.updateProject(projectId, { title: cleanTitle }, accessToken).catch(() => {});
        }
      }
    },
    onDoneStream: async (doneData, targetConvId) => {
      const title = doneData.conversation_title || (doneData as any).title;
      const convIdToUpdate = targetConvId || (doneData as any).conversation_id || activeConversationId;
      if (title && convIdToUpdate) {
        updateConversationTitle(convIdToUpdate, title);
        if (!activeConversationId || activeConversationId === convIdToUpdate) {
          setActiveTitleOverride(title);
        }
        if (
          ![
            "untitled short",
            "untitled",
            "new chat",
            "new conversation",
            "new project",
            "creative idea",
          ].includes(title.trim().toLowerCase())
        ) {
          const cleanTitle = title.trim();
          setProject((prev) => (prev ? { ...prev, title: cleanTitle } : prev));
          if (accessToken && projectId) {
            projectService.updateProject(projectId, { title: cleanTitle }, accessToken).catch(() => {});
          }
        }
      }
      if (
        doneData.stage === "screenplay" ||
        doneData.action === "select_direction" ||
        doneData.selected_direction_id
      ) {
        // Keep on screenplay stage so the generated script is visible on UI
        const convIdToFetch = targetConvId || activeConversationId;
        if (convIdToFetch) {
          const scriptData = await loadScreenplay(convIdToFetch);
          if (scriptData && autoPrepareCharactersRef.current) {
            await autoPrepareCharactersRef.current(scriptData?.screenplay?.title);
          }
        }
      }
    },
  });

  const handleGenerateScreenplay = useCallback(async () => {
    const currentConvId = activeConversationId;
    if (
      !accessToken ||
      !projectId ||
      !currentConvId ||
      isGeneratingScreenplay ||
      screenplayGeneratingRef.current ||
      isWorkflowBusyRef.current
    ) {
      return;
    }

    // Keep on Screenplay tab so screenplay shimmer & generated document are visible on UI
    handleStageChange("screenplay");
    screenplayGeneratingRef.current = true;
    setIsGeneratingScreenplay(true);
    setErrorScreenplay(null);
    try {
      const scriptData = await screenplayService.createScreenplay(
        projectId,
        currentConvId,
        accessToken
      );
      if (convIdRef.current === currentConvId) {
        if (scriptData) {
          setScreenplay(scriptData);
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-script-${Date.now()}`,
              role: "system",
              content: `Screenplay "${scriptData.screenplay?.title || "Untitled"}" created and saved! Preparing character cards...`,
              created_at: new Date().toISOString(),
            },
          ]);
          if (autoPrepareCharactersRef.current) {
            await autoPrepareCharactersRef.current(scriptData.screenplay?.title);
          }
        } else {
          const loaded = await loadScreenplay(currentConvId);
          if (loaded) {
            setMessages((prev) => [
              ...prev,
              {
                id: `sys-script-${Date.now()}`,
                role: "system",
                content: `Screenplay saved! Preparing character cards...`,
                created_at: new Date().toISOString(),
              },
            ]);
            if (autoPrepareCharactersRef.current) {
              await autoPrepareCharactersRef.current(loaded.screenplay?.title);
            }
          }
        }
      }
    } catch (err: any) {
      if (convIdRef.current === currentConvId) {
        setIsLoadingCharacters(false);
        const msg = err?.message || "Failed to generate screenplay. Please try again.";
        setErrorScreenplay(msg);
        setCharactersError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-script-err-${Date.now()}`,
            role: "assistant",
            content: `Failed to generate screenplay: ${msg}.`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      if (convIdRef.current === currentConvId) {
        setIsGeneratingScreenplay(false);
        screenplayGeneratingRef.current = false;
      }
    }
  }, [accessToken, projectId, activeConversationId, isGeneratingScreenplay, loadScreenplay, setMessages, handleStageChange]);

  useEffect(() => {
    if (activeConversationId) {
      loadScreenplay(activeConversationId);
    } else {
      setScreenplay(null);
      setIsLoadingScreenplay(false);
    }
  }, [activeConversationId, loadScreenplay]);

  const storyboardDataRef = useRef<StoryboardResponse | null>(storyboardData);
  useEffect(() => {
    storyboardDataRef.current = storyboardData;
  }, [storyboardData]);

  const isFetchingStoryboardRef = useRef(false);

  const loadStoryboard = useCallback(
    async (force = false): Promise<StoryboardResponse | null> => {
      if (!accessToken || !projectId) {
        setIsLoadingStoryboard(false);
        return null;
      }
      if (isFetchingStoryboardRef.current && !force) {
        return storyboardDataRef.current;
      }

      isFetchingStoryboardRef.current = true;
      setIsLoadingStoryboard(true);
      setStoryboardError(null);

      try {
        const sb = await storyboardService.getStoryboard(projectId, accessToken);
        setStoryboardData(sb);
        return sb;
      } catch (err: any) {
        const msg = err?.message || "Failed to load storyboard sequences.";
        setStoryboardError(msg);
        return null;
      } finally {
        isFetchingStoryboardRef.current = false;
        setIsLoadingStoryboard(false);
      }
    },
    [accessToken, projectId]
  );

  // Load ancillary production stage data as activeStage changes
  useEffect(() => {
    let isMounted = true;
    if (!accessToken || !projectId) return;

    const loadStageData = async () => {
      if (activeStage === "stylebook" && !styleBookData) {
        try {
          const styleRes = await stylebookService.getStyleBook(projectId, accessToken);
          if (styleRes && styleRes.style_book && isMounted) {
            setStyleBookData(styleRes);
          }
        } catch {
          // Empty state
        }
      } else if (activeStage === "characters" && characters.length === 0) {
        if (characterRecordsExtractingRef.current) return;
        setIsLoadingCharacters(true);
        setCharactersError(null);
        try {
          const list = await characterService.getCharacters(projectId, accessToken);
          if (!isMounted) return;

          if (list && list.length > 0) {
            setCharacters(list);
            setIsLoadingCharacters(false);
          } else {
            // Check if screenplay exists for automatic character record extraction
            let hasScreenplay = Boolean(screenplay);
            if (!hasScreenplay && activeConversationId) {
              const loadedScript = await loadScreenplay(activeConversationId);
              hasScreenplay = Boolean(loadedScript);
            }
            if (hasScreenplay && autoPrepareCharactersRef.current && !characterRecordsExtractingRef.current) {
              await autoPrepareCharactersRef.current(screenplay?.screenplay?.title);
            } else {
              setCharacters([]);
              setIsLoadingCharacters(false);
            }
          }
        } catch (err: any) {
          if (isMounted) {
            setCharactersError(err?.message || "Failed to load project characters.");
            setIsLoadingCharacters(false);
          }
        }
      } else if (activeStage === "environments" && environments.length === 0) {
        if (environmentRecordsExtractingRef.current) return;
        setIsLoadingEnvironments(true);
        setEnvironmentsError(null);
        try {
          const list = await environmentService.getEnvironments(projectId, accessToken);
          if (!isMounted) return;

          if (list && list.length > 0) {
            setEnvironments(list);
            setIsLoadingEnvironments(false);
          } else {
            // Check if screenplay exists for automatic environment record extraction
            let hasScreenplay = Boolean(screenplay);
            if (!hasScreenplay && activeConversationId) {
              const loadedScript = await loadScreenplay(activeConversationId);
              hasScreenplay = Boolean(loadedScript);
            }
            if (hasScreenplay && autoPrepareEnvironmentsRef.current && !environmentRecordsExtractingRef.current) {
              await autoPrepareEnvironmentsRef.current();
            } else {
              setEnvironments([]);
              setIsLoadingEnvironments(false);
            }
          }
        } catch (err: any) {
          if (isMounted) {
            setEnvironmentsError(err?.message || "Failed to load set locations.");
            setIsLoadingEnvironments(false);
          }
        }
      } else if (activeStage === "storyboard") {
        if (!storyboardDataRef.current && !isFetchingStoryboardRef.current) {
          await loadStoryboard();
        }
      } else if (activeStage === "shots") {
        if (
          (!storyboardDataRef.current || storyboardDataRef.current.scenes.length === 0) &&
          !isFetchingStoryboardRef.current
        ) {
          await loadStoryboard();
        }
      }
    };

    loadStageData();
    return () => {
      isMounted = false;
    };
  }, [
    activeStage,
    projectId,
    accessToken,
    styleBookData,
    characters.length,
    environments.length,
    screenplay,
    activeConversationId,
    loadScreenplay,
    loadStoryboard,
  ]);

  const clearStageActions = useCallback(
    (stageName?: string, messageId?: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          const matchStage =
            stageName &&
            (m.metadata?.stage === stageName ||
              (typeof m.metadata?.action === "string" &&
                m.metadata.action.toLowerCase().includes(stageName.toLowerCase())));
          const matchId = messageId && m.id === messageId;
          if (matchStage || matchId) {
            return {
              ...m,
              metadata: {
                ...m.metadata,
                actions: [],
                actionsHidden: true,
              },
            };
          }
          return m;
        })
      );
    },
    [setMessages]
  );

  // Provide stage-specific guidance and Skip options in AI Chat for all workflow tabs
  useEffect(() => {
    if (!accessToken || !projectId) return;

    if (activeStage === "stylebook") {
      if (stylebookPromptAskedProjectRef.current !== projectId) {
        stylebookPromptAskedProjectRef.current = projectId;
        setMessages((prev) => [
          ...prev.map((m) =>
            m.metadata?.actions && m.metadata.actions.length > 0 && m.metadata?.stage !== "stylebook"
              ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
              : m
          ),
          {
            id: `perm-style-${projectId}-${Date.now()}`,
            role: "assistant",
            content: "You are in Production Design & Style Book. Define your film's aesthetic, framing, and color palette, or generate a style book with AI. Would you like to generate the style book, or skip directly to Storyboard?",
            metadata: {
              action: "request_stylebook_action",
              stage: "stylebook",
              actions: [
                {
                  id: "approve-stylebook",
                  label: "✨ Generate Style Book",
                  action: "approve_stylebook",
                  primary: true,
                },
                {
                  id: "skip-stylebook",
                  label: "Skip for Now",
                  action: "skip_stylebook",
                  primary: false,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } else if (activeStage === "storyboard") {
      if (storyboardPromptAskedProjectRef.current !== projectId) {
        storyboardPromptAskedProjectRef.current = projectId;
        setMessages((prev) => [
          ...prev.map((m) =>
            m.metadata?.actions && m.metadata.actions.length > 0 && m.metadata?.stage !== "storyboard"
              ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
              : m
          ),
          {
            id: `perm-storyboard-${projectId}-${Date.now()}`,
            role: "assistant",
            content: "Welcome to Storyboard. Break down your screenplay into visual scenes and shot prompts. Would you like to generate the storyboard scenes, or skip to Production Studio?",
            metadata: {
              action: "request_storyboard_action",
              stage: "storyboard",
              actions: [
                {
                  id: "approve-storyboard",
                  label: "✨ Generate Storyboard",
                  action: "approve_storyboard",
                  primary: true,
                },
                {
                  id: "skip-storyboard",
                  label: "Skip for Now",
                  action: "skip_storyboard",
                  primary: false,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } else if (activeStage === "shots") {
      if (shotsPromptAskedProjectRef.current !== projectId) {
        shotsPromptAskedProjectRef.current = projectId;
        setMessages((prev) => [
          ...prev.map((m) =>
            m.metadata?.actions && m.metadata.actions.length > 0 && m.metadata?.stage !== "shots"
              ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
              : m
          ),
          {
            id: `perm-shots-${projectId}-${Date.now()}`,
            role: "assistant",
            content: "You are in Production Studio. Direct camera angles, motion prompts, and render video clips. Would you like to proceed with production, or skip to Timeline Editor?",
            metadata: {
              action: "request_shots_action",
              stage: "shots",
              actions: [
                {
                  id: "approve-shots",
                  label: "✨ Open Timeline Editor",
                  action: "approve_shots",
                  primary: true,
                },
                {
                  id: "skip-shots",
                  label: "Skip for Now",
                  action: "skip_shots",
                  primary: false,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [activeStage, projectId, accessToken, setMessages]);

  // Step 3: Automatically prepare environment records before asking for concept art images
  const autoPrepareEnvironments = useCallback(async () => {
    if (!accessToken || !projectId || environmentRecordsExtractingRef.current) return;
    environmentRecordsExtractingRef.current = true;

    // 1. Immediately advance to environments tab and show shimmer
    handleStageChange("environments");
    setIsLoadingEnvironments(true);
    setEnvironmentsError(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-env-prep-${Date.now()}`,
        role: "assistant",
        content: "I am preparing the environment cards from your screenplay...",
        status: "Preparing environment cards",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      // 1. Automatically load existing environment records
      let currentEnvs = await environmentService.getEnvironments(projectId, accessToken);

      // 2. If no environments exist, automatically call POST /projects/{project_id}/environments/generate
      if (!currentEnvs || currentEnvs.length === 0) {
        await environmentService.generateEnvironment(projectId, {}, accessToken);
        // 3 & 4. Wait for successful persistence, then load environments using GET /projects/{project_id}/environments
        currentEnvs = await environmentService.getEnvironments(projectId, accessToken);
      }

      // 5. Display environment cards immediately
      setEnvironments(currentEnvs);
      setIsLoadingEnvironments(false);

      if (!currentEnvs || currentEnvs.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-env-empty-${Date.now()}`,
            role: "assistant",
            content: "No environment locations were found in the screenplay. You can add environments manually or re-extract from the panel.",
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      // 6. Ask the user for permission only to generate environment images
      const missingImages = currentEnvs.filter((e) => getEnvironmentImageUrl(e) === null);

      if (missingImages.length > 0) {
        if (environmentPromptAskedProjectRef.current !== projectId) {
          environmentPromptAskedProjectRef.current = projectId;
          setMessages((prev) => [
            ...prev,
            {
              id: `perm-env-${projectId}-${Date.now()}`,
              role: "assistant",
              content: `Your environment cards are ready (${currentEnvs.length} locations: ${currentEnvs.map((e) => e.name).join(", ")}). Would you like me to generate their concept images using Nano Banana 2.1?`,
              metadata: {
                action: "request_environment_approval",
                stage: "environments",
                actions: [
                  {
                    id: "approve-env-images",
                    label: "✨ Generate Environment Concept Art",
                    action: "approve_environment_images",
                    primary: true,
                  },
                  {
                    id: "skip-env-images",
                    label: "Skip for Now",
                    action: "skip_environment_images",
                    primary: false,
                  },
                ],
              },
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        const nextStage = isStyleBookSkipped ? "storyboard" : "stylebook";
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-env-done-${Date.now()}`,
            role: "assistant",
            content: `All environment locations already have concept images. Advancing to ${nextStage === "storyboard" ? "Storyboard" : "Style Book"}...`,
            created_at: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          handleStageChange(nextStage);
        }, 1000);
      }
    } catch (err: any) {
      setIsLoadingEnvironments(false);
      const msg = err?.message || "Failed to prepare environment cards.";
      setEnvironmentsError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-env-err-${Date.now()}`,
          role: "assistant",
          content: `Error preparing environment cards: ${msg}. You can retry using 'Extract Environments from Screenplay'.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      environmentRecordsExtractingRef.current = false;
      setIsLoadingEnvironments(false);
    }
  }, [accessToken, projectId, handleStageChange, setMessages]);

  useEffect(() => {
    autoPrepareEnvironmentsRef.current = autoPrepareEnvironments;
  }, [autoPrepareEnvironments]);

  // Approved Environment Concept Art Flow (Images Only, Never Recreating Records)
  const handleApproveEnvironmentImages = useCallback(async () => {
    if (!accessToken || !projectId || isGeneratingEnvironmentImagesRef.current) return;
    isGeneratingEnvironmentImagesRef.current = true;
    setIsGeneratingEnvironmentImages(true);

    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "environments" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("environment"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-approve-env-img-${Date.now()}`,
        role: "user",
        content: "Approved: Generate environment concept art.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-env-img-start-${Date.now()}`,
        role: "assistant",
        content: "Generating environment concept art using Nano Banana 2.1...",
        status: "Rendering concept art",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const currentEnvs = environments.length > 0
        ? environments
        : await environmentService.getEnvironments(projectId, accessToken);

      const targetEnvs = currentEnvs.filter((e) => getEnvironmentImageUrl(e) === null);
      const targetIds = targetEnvs.length > 0 ? targetEnvs.map((e) => e.id) : currentEnvs.map((e) => e.id);

      setGeneratingEnvironmentCardIds(new Set(targetIds));

      if (targetIds.length > 0) {
        // 7. Call existing batch endpoint exactly once
        const batchRes = await environmentService.generateEnvironmentImagesBatch(
          projectId,
          { environment_ids: targetIds, force_regenerate: false },
          accessToken
        );

        // Fetch fresh environments from backend
        const refreshedEnvs = await environmentService.getEnvironments(projectId, accessToken);
        let finalEnvs = refreshedEnvs;

        if (!finalEnvs || finalEnvs.length === 0) {
          if (batchRes && batchRes.results) {
            const updatedMap = new Map<string, EnvironmentResponse>();
            batchRes.results.forEach((item) => {
              if (item.environment) {
                updatedMap.set(item.environment_id, item.environment);
              }
            });
            finalEnvs = currentEnvs.map((e) => updatedMap.get(e.id) || e);
          } else {
            finalEnvs = currentEnvs;
          }
        }
        setEnvironments(finalEnvs);

        const successfulCount = batchRes?.successful_count ?? finalEnvs.filter((e) => getEnvironmentImageUrl(e) !== null).length;
        const failedCount = batchRes?.failed_count ?? (targetIds.length - successfulCount);

        if (successfulCount > 0) {
          const nextStage = isStyleBookSkipped ? "storyboard" : "stylebook";
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-env-done-${Date.now()}`,
              role: "assistant",
              content: `Environment concept art complete! (${successfulCount}/${targetIds.length} ready). Advancing to ${nextStage === "storyboard" ? "Storyboard" : "Style Book"}...`,
              created_at: new Date().toISOString(),
            },
          ]);

          // Navigate automatically
          setTimeout(() => {
            handleStageChange(nextStage);
          }, 1200);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-env-fail-${Date.now()}`,
              role: "assistant",
              content: `Environment concept art generation failed for ${failedCount} locations. You can retry from the environment cards.`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        const nextStage = isStyleBookSkipped ? "storyboard" : "stylebook";
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-env-done-${Date.now()}`,
            role: "assistant",
            content: `All environment locations have concept art ready. Advancing to ${nextStage === "storyboard" ? "Storyboard" : "Style Book"}...`,
            created_at: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          handleStageChange(nextStage);
        }, 1000);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to generate environment concept art.";
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-env-img-err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorMsg}. You can generate individual images on each card.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setGeneratingEnvironmentCardIds(new Set());
      setIsGeneratingEnvironmentImages(false);
      isGeneratingEnvironmentImagesRef.current = false;
    }
  }, [accessToken, projectId, environments, setMessages]);

  const handleSkipEnvironmentImages = useCallback(() => {
    const nextStage = isStyleBookSkipped ? "storyboard" : "stylebook";
    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "environments" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("environment"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-skip-env-${Date.now()}`,
        role: "user",
        content: "Skip environment concept art for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-env-${Date.now()}`,
        role: "assistant",
        content: `Environment cards preserved with placeholders. You can generate concept art anytime. Advancing to ${nextStage === "storyboard" ? "Storyboard" : "Style Book"}...`,
        created_at: new Date().toISOString(),
      },
    ]);

    setTimeout(() => {
      handleStageChange(nextStage);
    }, 1000);
  }, [setMessages]);

  // Step 2: Automatically prepare character records in background without navigating away from screenplay
  const autoPrepareCharacters = useCallback(
    async (scriptTitle?: string) => {
      if (!accessToken || !projectId || characterRecordsExtractingRef.current) return;
      characterRecordsExtractingRef.current = true;

      // DO NOT navigate away to characters here. Screenplay must stay completely visible on the UI!
      setIsLoadingCharacters(true);
      setCharactersError(null);

      try {
        // Check if character records already exist
        let currentChars = await characterService.getCharacters(projectId, accessToken);
        if (!currentChars || currentChars.length === 0) {
          await characterService.generateCharacter(projectId, {}, accessToken);
          currentChars = await characterService.getCharacters(projectId, accessToken);
        }

        setCharacters(currentChars);
        setIsLoadingCharacters(false);

        if (!currentChars || currentChars.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-char-empty-${Date.now()}`,
              role: "assistant",
              content: "Screenplay is displayed on your canvas. No character records were automatically extracted. You can review your script and add characters when ready.",
              created_at: new Date().toISOString(),
            },
          ]);
          return;
        }

        if (portraitPromptAskedProjectRef.current !== projectId) {
          portraitPromptAskedProjectRef.current = projectId;
          setMessages((prev) => [
            ...prev,
            {
              id: `perm-char-${projectId}-${Date.now()}`,
              role: "assistant",
              content: `Screenplay "${scriptTitle || "Untitled"}" is generated and displayed on your canvas! Character cards (${currentChars.length} characters: ${currentChars.map((c) => c.name).join(", ")}) are ready. Review your script on the canvas, then proceed to Character Casting when ready.`,
              metadata: {
                action: "request_portrait_approval",
                stage: "screenplay",
                actions: [
                  {
                    id: "approve-char-portraits",
                    label: "👥 Proceed to Character Casting",
                    action: "approve_screenplay",
                    primary: true,
                  },
                ],
              },
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err: any) {
        setIsLoadingCharacters(false);
        const msg = err?.message || "Failed to prepare character cards.";
        setCharactersError(msg);
      } finally {
        characterRecordsExtractingRef.current = false;
        setIsLoadingCharacters(false);
      }
    },
    [accessToken, projectId, setMessages]
  );

  useEffect(() => {
    autoPrepareCharactersRef.current = autoPrepareCharacters;
  }, [autoPrepareCharacters]);

  // Approved Character Portrait Flow (Images Only, Never Recreating Records)
  const handleApproveCharacterPortraits = useCallback(async () => {
    if (!accessToken || !projectId || isGeneratingCharacterImagesRef.current) return;
    isGeneratingCharacterImagesRef.current = true;
    setIsGeneratingCharacterImages(true);

    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "characters" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("portrait"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-approve-portraits-${Date.now()}`,
        role: "user",
        content: "Approved: Generate character portraits.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-char-img-start-${Date.now()}`,
        role: "assistant",
        content: "Generating character portraits using Nano Banana 2.1...",
        status: "Rendering portraits",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const currentChars = characters.length > 0
        ? characters
        : await characterService.getCharacters(projectId, accessToken);

      const targetCharacters = currentChars.filter((c) => getCharacterImageUrl(c) === null);
      const targetIds = targetCharacters.length > 0 ? targetCharacters.map((c) => c.id) : currentChars.map((c) => c.id);

      setGeneratingCharacterCardIds(new Set(targetIds));

      if (targetIds.length > 0) {
        // 9. Call existing batch image-generation endpoint exactly once
        const batchRes = await characterService.generateCharacterImagesBatch(
          projectId,
          { character_ids: targetIds, force_regenerate: false },
          accessToken
        );

        // Fetch fresh persisted characters from backend
        const refreshedChars = await characterService.getCharacters(projectId, accessToken);
        let finalChars = refreshedChars;

        if (!finalChars || finalChars.length === 0) {
          if (batchRes && batchRes.results) {
            const updatedMap = new Map<string, CharacterResponse>();
            batchRes.results.forEach((item) => {
              if (item.character) {
                updatedMap.set(item.character_id, item.character);
              }
            });
            finalChars = currentChars.map((c) => updatedMap.get(c.id) || c);
          } else {
            finalChars = currentChars;
          }
        }
        setCharacters(finalChars);

        const successfulCount = batchRes?.successful_count ?? finalChars.filter((c) => getCharacterImageUrl(c) !== null).length;
        const failedCount = batchRes?.failed_count ?? (targetIds.length - successfulCount);

        if (successfulCount > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-char-done-${Date.now()}`,
              role: "assistant",
              content: `Character portraits complete! (${successfulCount}/${targetIds.length} ready). Moving to Environment Casting...`,
              created_at: new Date().toISOString(),
            },
          ]);

          // 11. After all required image-generation operations succeed, continue automatically to Environment Casting
          setTimeout(() => {
            if (autoPrepareEnvironmentsRef.current) {
              autoPrepareEnvironmentsRef.current();
            }
          }, 1200);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-char-fail-${Date.now()}`,
              role: "assistant",
              content: `Character portrait generation failed for ${failedCount} characters. You can retry from the character cards.`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-char-done-${Date.now()}`,
            role: "assistant",
            content: "All characters have valid portraits ready. Moving to Environment Casting...",
            created_at: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          if (autoPrepareEnvironmentsRef.current) {
            autoPrepareEnvironmentsRef.current();
          }
        }, 1000);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to generate character portraits.";
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-char-img-err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorMsg}. You can generate individual portraits on each card.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setGeneratingCharacterCardIds(new Set());
      setIsGeneratingCharacterImages(false);
      isGeneratingCharacterImagesRef.current = false;
    }
  }, [accessToken, projectId, characters, setMessages]);

  const handleSkipCharacterPortraits = useCallback(() => {
    handleStageChange("environments");
    setIsLoadingEnvironments(true);
    setEnvironmentsError(null);

    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "characters" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("portrait"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-skip-char-${Date.now()}`,
        role: "user",
        content: "Skip character portraits for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-char-${Date.now()}`,
        role: "assistant",
        content: "Character cards preserved with placeholders. You can generate portraits anytime. Moving to Environment Casting...",
        created_at: new Date().toISOString(),
      },
    ]);

    if (autoPrepareEnvironmentsRef.current) {
      autoPrepareEnvironmentsRef.current();
    }
  }, [handleStageChange, setMessages]);

  // Step 1: Direct selection of creative direction and immediate screenplay generation
  const handleSelectDirection = useCallback(
    async (dir: CreativeDirectionItem) => {
      // Keep user on Screenplay tab so screenplay generation shimmer and completed script are visible on UI
      handleStageChange("screenplay");
      setIsLoadingCharacters(false);
      setCharactersError(null);

      const currentConvId = activeConversationId;
      if (!accessToken || !projectId || !currentConvId) {
        return;
      }

      screenplayGeneratingRef.current = true;
      isWorkflowBusyRef.current = true;
      setIsWorkflowBusy(true);

      // Hide directions from chat messages to prevent duplicate triggers
      setMessages((prev) => [
        ...prev.map((m) =>
          m.metadata?.directions && m.metadata.directions.length > 0
            ? { ...m, metadata: { ...m.metadata, directions: [], selected_direction_id: dir.id } }
            : m
        ),
        {
          id: `asst-script-generating-${Date.now()}`,
          role: "assistant",
          content: `Creative direction "${dir.title}" selected. Drafting and formatting your screenplay...`,
          status: "Writing screenplay",
          created_at: new Date().toISOString(),
        },
      ]);

      // Send selection message into the chat stream to mark deterministic direction in backend
      sendMessage(`I choose: ${dir.title}`).catch((err) => {
        console.warn("Notice: Message stream returned:", err);
      });

      // Generate and persist screenplay directly using existing workflow
      setIsGeneratingScreenplay(true);
      setErrorScreenplay(null);

      try {
        let scriptData = await screenplayService.createScreenplay(
          projectId,
          currentConvId,
          accessToken
        );

        if (!scriptData) {
          scriptData = await loadScreenplay(currentConvId);
        }

        if (convIdRef.current === currentConvId && scriptData) {
          setScreenplay(scriptData);
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-script-${Date.now()}`,
              role: "system",
              content: `Screenplay "${scriptData.screenplay?.title || "Untitled"}" created and displayed on canvas!`,
              created_at: new Date().toISOString(),
            },
          ]);
          // Prepare character cards in background without navigating away from screenplay
          if (autoPrepareCharactersRef.current) {
            await autoPrepareCharactersRef.current(scriptData.screenplay?.title);
          }
        }
      } catch (err: any) {
        if (convIdRef.current === currentConvId) {
          setIsLoadingCharacters(false);
          const msg = err?.message || "Failed to generate screenplay. Please try again.";
          setErrorScreenplay(msg);
          setCharactersError(msg);
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-script-err-${Date.now()}`,
              role: "assistant",
              content: `Failed to generate screenplay: ${msg}. Please try again.`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (convIdRef.current === currentConvId) {
          setIsGeneratingScreenplay(false);
          screenplayGeneratingRef.current = false;
        }
        isWorkflowBusyRef.current = false;
        setIsWorkflowBusy(false);
      }
    },
    [
      accessToken,
      projectId,
      activeConversationId,
      isGeneratingScreenplay,
      handleStageChange,
      sendMessage,
      setMessages,
    ]
  );

  const handleSkipScreenplay = useCallback(() => {
    if (isGeneratingScreenplay) return;
    handleStageChange("characters", true);
    setIsLoadingCharacters(true);
    setCharactersError(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-skip-script-${Date.now()}`,
        role: "user",
        content: "Skip script writing for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-script-${Date.now()}`,
        role: "assistant",
        content: "Script writing skipped. Advancing to Character Casting...",
        created_at: new Date().toISOString(),
      },
    ]);

    if (autoPrepareCharactersRef.current) {
      autoPrepareCharactersRef.current();
    }
  }, [isGeneratingScreenplay, handleStageChange, setMessages]);

  const handleSkipStoryboard = useCallback(() => {
    handleStageChange("shots");
    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "storyboard" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("storyboard"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-skip-sb-${Date.now()}`,
        role: "user",
        content: "Skip Storyboard for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-sb-${Date.now()}`,
        role: "assistant",
        content: "Storyboard skipped. Advancing to Production Studio...",
        created_at: new Date().toISOString(),
      },
    ]);
  }, [handleStageChange, setMessages]);

  const handleSkipProduction = useCallback(() => {
    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "shots" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("shots"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-skip-shots-${Date.now()}`,
        role: "user",
        content: "Skip Production Studio for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-shots-${Date.now()}`,
        role: "assistant",
        content: "Production Studio skipped. Advancing to Timeline Editor...",
        created_at: new Date().toISOString(),
      },
    ]);
    setTimeout(() => {
      handleStageChange("editor");
    }, 1000);
  }, [handleStageChange, setMessages]);

  const handleGenerateStoryboard = useCallback(async () => {
    if (!accessToken || !projectId || isLoadingStoryboard) return;
    handleStageChange("storyboard");
    setIsLoadingStoryboard(true);
    setStoryboardError(null);
    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "storyboard" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("storyboard"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-gen-sb-${Date.now()}`,
        role: "user",
        content: "Generate storyboard from screenplay.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-gen-sb-start-${Date.now()}`,
        role: "assistant",
        content: "Translating screenplay into visual scenes and shot prompts...",
        status: "Generating Storyboard",
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const res = await storyboardService.generateStoryboard(
        projectId,
        { force_regenerate: false },
        accessToken
      );
      setStoryboardData(res);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-sb-done-${Date.now()}`,
          role: "assistant",
          content: `Storyboard generated successfully with ${res.scenes?.length || 0} scenes!`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      const msg = err?.message || "Failed to generate storyboard.";
      setStoryboardError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-sb-err-${Date.now()}`,
          role: "assistant",
          content: `Error generating storyboard: ${msg}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoadingStoryboard(false);
    }
  }, [accessToken, projectId, isLoadingStoryboard, setMessages]);

  const handleChatActionClick = (action: ChatActionItem, messageId?: string) => {
    // Hide actions for this message or action type immediately
    setMessages((prev) =>
      prev.map((m) => {
        const isTargetMsg = messageId && m.id === messageId;
        const isTargetAction = m.metadata?.actions?.some((a) => a.action === action.action);
        if (isTargetMsg || isTargetAction) {
          return {
            ...m,
            metadata: {
              ...m.metadata,
              actions: [],
              actionsHidden: true,
            },
          };
        }
        return m;
      })
    );

    if (
      action.action === "approve_character_portraits" ||
      action.action === "approve_characters"
    ) {
      clearStageActions("characters", messageId);
      handleApproveCharacterPortraits();
    } else if (
      action.action === "skip_character_portraits" ||
      action.action === "skip_characters"
    ) {
      clearStageActions("characters", messageId);
      handleSkipCharacterPortraits();
    } else if (
      action.action === "approve_environment_images" ||
      action.action === "approve_environments"
    ) {
      clearStageActions("environments", messageId);
      handleApproveEnvironmentImages();
    } else if (
      action.action === "skip_environment_images" ||
      action.action === "skip_environments"
    ) {
      clearStageActions("environments", messageId);
      handleSkipEnvironmentImages();
    } else if (action.action === "skip_screenplay") {
      clearStageActions("screenplay", messageId);
      handleSkipScreenplay();
    } else if (action.action === "approve_screenplay") {
      clearStageActions("screenplay", messageId);
      handleStageChange("characters");
    } else if (action.action === "skip_stylebook") {
      clearStageActions("stylebook", messageId);
      handleSkipStyleBook();
    } else if (action.action === "approve_stylebook") {
      clearStageActions("stylebook", messageId);
      handleGenerateStyleBook();
    } else if (action.action === "skip_storyboard") {
      clearStageActions("storyboard", messageId);
      handleSkipStoryboard();
    } else if (action.action === "approve_storyboard") {
      clearStageActions("storyboard", messageId);
      handleGenerateStoryboard();
    } else if (
      action.action === "skip_shots" ||
      action.action === "skip_production"
    ) {
      clearStageActions("shots", messageId);
      handleSkipProduction();
    } else if (action.action === "approve_shots") {
      clearStageActions("shots", messageId);
      handleStageChange("editor");
    }
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Check if user is skipping through chat on any active stage
    if (/^(skip|no|later|skip this|skip step|skip for now)/i.test(trimmed)) {
      if (activeStage === "screenplay") {
        handleSkipScreenplay();
        return;
      }
      if (activeStage === "characters") {
        handleSkipCharacterPortraits();
        return;
      }
      if (activeStage === "environments") {
        handleSkipEnvironmentImages();
        return;
      }
      if (activeStage === "stylebook") {
        handleSkipStyleBook();
        return;
      }
      if (activeStage === "storyboard") {
        handleSkipStoryboard();
        return;
      }
      if (activeStage === "shots") {
        handleSkipProduction();
        return;
      }
    }

    // Check if user is approving character portraits through chat
    if (
      activeStage === "characters" &&
      characters.length > 0 &&
      /^(yes|approve|generate portraits|portraits|generate|start|proceed|sure|go ahead|render)/i.test(trimmed)
    ) {
      handleApproveCharacterPortraits();
      return;
    }

    // Check if user is approving environment concept art through chat
    if (
      activeStage === "environments" &&
      environments.length > 0 &&
      /^(yes|approve|generate images|concept art|generate|start|proceed|sure|go ahead|render)/i.test(trimmed)
    ) {
      handleApproveEnvironmentImages();
      return;
    }

    // Check if user is approving stylebook through chat
    if (
      activeStage === "stylebook" &&
      /^(yes|approve|generate|stylebook|style book|start|proceed)/i.test(trimmed)
    ) {
      handleGenerateStyleBook();
      return;
    }

    // Check if user is approving storyboard through chat
    if (
      activeStage === "storyboard" &&
      /^(yes|approve|generate|storyboard|start|proceed)/i.test(trimmed)
    ) {
      handleGenerateStoryboard();
      return;
    }

    // Check if user is advancing from shots through chat
    if (
      activeStage === "shots" &&
      /^(yes|approve|proceed|shots|render|editor|timeline)/i.test(trimmed)
    ) {
      handleStageChange("editor");
      return;
    }

    // Check if user is choosing a creative direction through chat
    const isDirectionSelection =
      /^(i choose|direction|option|select\s+direction|i\s+pick)/i.test(trimmed) ||
      messages.some((m) =>
        m.metadata?.directions?.some(
          (d) =>
            d.title.toLowerCase() === trimmed.toLowerCase() ||
            trimmed.toLowerCase().includes(d.title.toLowerCase())
        )
      );

    if (
      isDirectionSelection ||
      (activeStage === "screenplay" &&
        /festival of lights|diwali empowerment|tradition reimagined/i.test(trimmed))
    ) {
      // Ensure user stays on screenplay stage so script writing and document are visible on UI
      handleStageChange("screenplay");
    }

    let targetConvId =
      activeConversationId ||
      (conversations.length > 0 ? conversations[0].id : null);

    if (!targetConvId) {
      const newId = await createConversation("Creative Idea");
      if (newId) {
        targetConvId = newId;
        convIdRef.current = newId;
        await sendMessage(trimmed, newId);
      }
    } else {
      await sendMessage(trimmed, targetConvId);
    }
  };

  const handleGenerateStyleBook = async () => {
    if (!accessToken || isGenerating) return;
    handleStageChange("stylebook");
    setIsGenerating(true);
    try {
      const res = await stylebookService.generateStyleBook(projectId, {}, accessToken);
      if (res && res.style_book) {
        setStyleBookData(res);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`stylebook_skipped_${projectId}`);
        }
        setIsStyleBookSkipped(false);
        setMessages((prev) => [
          ...prev.map((m) =>
            m.metadata?.stage === "stylebook" ||
            (typeof m.metadata?.action === "string" && m.metadata.action.includes("stylebook"))
              ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
              : m
          ),
          {
            id: `sys-style-done-${Date.now()}`,
            role: "system",
            content: "Style Book generated successfully! Advancing to Storyboard...",
            created_at: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          handleStageChange("storyboard");
        }, 800);
      }
    } catch (err) {
      console.error("Failed to generate stylebook:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStyleBookModal = async (data: StyleBookContent) => {
    if (!accessToken) return;
    try {
      const res = await stylebookService.updateStyleBook(projectId, data, accessToken);
      if (res && res.style_book) {
        setStyleBookData(res);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`stylebook_skipped_${projectId}`);
        }
        setIsStyleBookSkipped(false);
      }
    } catch (err) {
      console.error("Failed to save stylebook:", err);
    } finally {
      setIsStyleBookEditModalOpen(false);
    }
  };

  const handleSkipStyleBook = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`stylebook_skipped_${projectId}`, "true");
    }
    setIsStyleBookSkipped(true);
    setMessages((prev) => [
      ...prev.map((m) =>
        m.metadata?.stage === "stylebook" ||
        (typeof m.metadata?.action === "string" && m.metadata.action.includes("stylebook"))
          ? { ...m, metadata: { ...m.metadata, actions: [], actionsHidden: true } }
          : m
      ),
      {
        id: `user-skip-style-${Date.now()}`,
        role: "user",
        content: "Skip Style Book for now.",
        created_at: new Date().toISOString(),
      },
      {
        id: `asst-skip-style-${Date.now()}`,
        role: "assistant",
        content: "Style Book skipped. Default visual styling will be applied. Advancing to Storyboard...",
        created_at: new Date().toISOString(),
      },
    ]);
    setTimeout(() => {
      handleStageChange("storyboard");
    }, 1000);
  }, [projectId, handleStageChange, setMessages]);

  const handleProceedFromStyleBook = useCallback(() => {
    handleStageChange("storyboard");
  }, [handleStageChange]);

  const handleSendToChatStyleBook = async () => {
    const sb = styleBookData?.style_book;
    if (!sb || isSendingStyleBook) return;
    setIsSendingStyleBook(true);
    try {
      const message = `Style Book selected:

Aesthetic: ${sb.aesthetic?.preset || 'N/A'}
Aspect Ratio: ${sb.composition_and_framing?.aspect_ratio || 'N/A'}
Composition Rules: ${sb.composition_and_framing?.composition_rules?.join(', ') || 'N/A'}
Framing: ${sb.composition_and_framing?.framing || 'N/A'}
Color Palette: ${sb.color_palette?.colors?.join(', ') || 'N/A'}
Lighting: ${sb.lighting?.style || 'N/A'}
Camera: ${sb.camera?.lens || 'N/A'}
Texture: ${sb.texture?.style || 'N/A'}
Mood: ${sb.mood || 'N/A'}`;

      await handleSendMessage(message);
      setIsStyleBookSelected(false);
    } catch (err) {
      console.error("Failed to send to chat:", err);
    } finally {
      setIsSendingStyleBook(false);
    }
  };

  const handleGenerateCharacter = async () => {
    if (!accessToken || isGenerating) return;
    setIsGenerating(true);
    try {
      const items = await characterService.generateCharacter(projectId, {}, accessToken);
      if (items && items.length > 0) {
        setCharacters((prev) => [...prev, ...items]);
      }
    } catch (err) {
      console.error("Failed to generate character:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEnvironment = async () => {
    if (!accessToken || isGenerating) return;
    setIsGenerating(true);
    try {
      const items = await environmentService.generateEnvironment(projectId, {}, accessToken);
      if (items && items.length > 0) {
        setEnvironments((prev) => [...prev, ...items]);
      }
    } catch (err) {
      console.error("Failed to generate environment:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStageHeaderTitle = () => {
    switch (activeStage) {
      case "stylebook":
        return isStyleBookSkipped
          ? "Production Design & Style Book (Skipped)"
          : "Production Design & Style Book (Optional)";
      case "characters":
        return "Character Cast Lookbook";
      case "environments":
        return "Environment Cast Lookbook";
      case "storyboard":
        return "Storyboard Sequences";
      case "shots":
        return "Camera Shots & Takes";
      case "editor":
        return "Timeline & Video Editor";
      default:
        return "Scripting Studio";
    }
  };

  const sb = styleBookData?.style_book;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-zinc-950 select-none">
      {/* Left Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar Matching Reference Screenshot */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-950 flex-shrink-0">
          <div className="flex-1 flex justify-start">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
              {project?.title || "Untitled Short"}
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 tracking-tight">
              {getStageHeaderTitle()}
            </span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-2 flex-wrap">
            {activeStage !== "screenplay" && (
              <button
                onClick={() => handleStageChange("screenplay")}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Script Writing</span>
              </button>
            )}

            {activeStage === "screenplay" && (
              <button
                onClick={() => handleStageChange("characters")}
                disabled={!isScreenplayReady}
                className={`px-4 py-2 font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors ${
                  isScreenplayReady
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
                }`}
                title={isScreenplayReady ? "Proceed to Character Casting" : "Generate screenplay completely first"}
              >
                <span>Character Casting</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStage === "characters" && (
              <button
                onClick={() => {
                  if (autoPrepareEnvironmentsRef.current) {
                    autoPrepareEnvironmentsRef.current();
                  } else {
                    handleStageChange("environments");
                  }
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Environment Casting</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStage === "environments" && (
              <button
                onClick={() => handleStageChange(isStyleBookSkipped ? "storyboard" : "stylebook")}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>{isStyleBookSkipped ? "Storyboard" : "Style Book"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStage === "stylebook" && (
              <button
                type="button"
                onClick={handleProceedFromStyleBook}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Storyboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStage === "storyboard" && (
              <button
                onClick={() => handleStageChange("shots")}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Production Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStage === "shots" && (
              <button
                onClick={() => handleStageChange("editor")}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Timeline Editor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Left Stage Canvas */}
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col relative">
          {/* STAGE 1: SCREENPLAY */}
          {activeStage === "screenplay" && (
            isLoadingScreenplay || isGeneratingScreenplay ? (
              <ScreenplayShimmer message="AI is drafting and formatting your cinematic screenplay..." />
            ) : screenplay ? (
              <ScreenplayDocument
                projectId={projectId}
                screenplayData={screenplay}
                onEditScript={() => {
                  if (activeConversationId) {
                    loadScreenplay(activeConversationId);
                  }
                }}
                onStageChange={handleStageChange}
                onSkip={() => handleStageChange("characters")}
              />
            ) : (
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-950 h-full overflow-y-auto">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 shadow-2xs">
                  <Sparkles className="w-7 h-7" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">
                  Start with your idea
                </h2>

                <p className="text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed mb-6">
                  Describe your film, story, or concept to the agent in the chat on
                  the right. It writes the script here, then helps you build the
                  style, cast, storyboard, and shots.
                </p>

                {errorScreenplay && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 max-w-md text-center">
                    {errorScreenplay}
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={handleSkipScreenplay}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Skip for Now</span>
                  </button>
                  {activeConversationId && (
                    <button
                      onClick={handleGenerateScreenplay}
                      disabled={isGeneratingScreenplay}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isGeneratingScreenplay ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      <span>{isGeneratingScreenplay ? "Generating Screenplay..." : "Generate Screenplay"}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {/* STAGE 2: STYLE BOOK */}
          {activeStage === "stylebook" && (
            <div className="flex-1 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-zinc-950">
              <HyperdreamStyleBook 
                onGenerate={handleGenerateStyleBook}
                isGenerating={isGenerating}
                styleBook={styleBookData?.style_book || null}
                onSendToChat={async (data) => {
                  if (isSendingStyleBook) return;
                  setIsSendingStyleBook(true);
                  try {
                    const message = `Style Book selected:\n\nAesthetic: ${data.aesthetic?.preset || 'N/A'}\nAspect Ratio: ${data.composition_and_framing?.aspect_ratio || 'N/A'}\nComposition Rules: ${data.composition_and_framing?.composition_rules?.join(', ') || 'N/A'}\nColor Palette: ${data.color_palette?.colors?.join(', ') || 'N/A'}`;
                    await handleSendMessage(message);
                    setIsStyleBookSelected(true);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem(`stylebook_skipped_${projectId}`);
                    }
                    setIsStyleBookSkipped(false);
                    handleStageChange("storyboard");
                  } catch (err) {
                    console.error("Failed to send to chat:", err);
                  } finally {
                    setIsSendingStyleBook(false);
                  }
                }}
                isSendingToChat={isSendingStyleBook}
                onSkip={handleSkipStyleBook}
                onProceed={handleProceedFromStyleBook}
                isSkipped={isStyleBookSkipped}
              />
            </div>
          )}

          {/* STAGE 3: CHARACTERS */}
          {activeStage === "characters" && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
              <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
                <HyperdreamCharacterCasting
                  projectId={projectId}
                  characters={characters}
                  onCharactersUpdated={setCharacters}
                  isLoadingCharacters={isLoadingCharacters}
                  loadingMessage={
                    isGeneratingScreenplay
                      ? "AI is writing screenplay and casting characters..."
                      : characterRecordsExtractingRef.current
                      ? "Preparing character cards from screenplay..."
                      : "Loading project characters..."
                  }
                  isBatchGeneratingImages={isGeneratingCharacterImages}
                  externalGeneratingCardIds={generatingCharacterCardIds}
                  fetchError={charactersError}
                  onRefreshCharacters={async () => {
                    if (!accessToken || !projectId) return;
                    setIsLoadingCharacters(true);
                    setCharactersError(null);
                    try {
                      const list = await characterService.getCharacters(projectId, accessToken);
                      setCharacters(list);
                    } catch (err: any) {
                      setCharactersError(err?.message || "Failed to load project characters.");
                    } finally {
                      setIsLoadingCharacters(false);
                    }
                  }}
                  onBatchComplete={(successful, total) => {
                    if (successful > 0) {
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `sys-char-batch-${Date.now()}`,
                          role: "system",
                          content: `Character portraits generation completed (${successful}/${total} ready). Advancing to Environment Casting...`,
                          created_at: new Date().toISOString(),
                        },
                      ]);
                      setTimeout(() => {
                        if (autoPrepareEnvironmentsRef.current) {
                          autoPrepareEnvironmentsRef.current();
                        } else {
                          handleStageChange("environments");
                        }
                      }, 1200);
                    }
                  }}
                  onSkip={() => handleStageChange("environments")}
                />
              </div>
            </div>
          )}

          {/* STAGE 4: ENVIRONMENTS */}
          {activeStage === "environments" && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
              <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
                <HyperdreamEnvironmentCasting
                  projectId={projectId}
                  environments={environments}
                  onEnvironmentsUpdated={setEnvironments}
                  isLoadingEnvironments={isLoadingEnvironments}
                  loadingMessage={
                    environmentRecordsExtractingRef.current
                      ? "Preparing environment cards from screenplay..."
                      : "Loading project set locations..."
                  }
                  isBatchGeneratingImages={isGeneratingEnvironmentImages}
                  externalGeneratingCardIds={generatingEnvironmentCardIds}
                  fetchError={environmentsError}
                  onRefreshEnvironments={async () => {
                    if (!accessToken || !projectId) return;
                    setIsLoadingEnvironments(true);
                    setEnvironmentsError(null);
                    try {
                      const list = await environmentService.getEnvironments(projectId, accessToken);
                      setEnvironments(list);
                    } catch (err: any) {
                      setEnvironmentsError(err?.message || "Failed to load set locations.");
                    } finally {
                      setIsLoadingEnvironments(false);
                    }
                  }}
                  onConfirmSelections={() => {
                    const targetStage = isStyleBookSkipped ? "storyboard" : "stylebook";
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `sys-env-confirm-${Date.now()}`,
                        role: "system",
                        content: targetStage === "storyboard"
                          ? "Environment selections confirmed. Moving to Storyboard..."
                          : "Environment selections confirmed. Moving to Style Book...",
                        created_at: new Date().toISOString(),
                      },
                    ]);
                    handleStageChange(targetStage);
                  }}
                  onBatchComplete={(successful, total) => {
                    if (successful > 0) {
                      const targetStage = isStyleBookSkipped ? "storyboard" : "stylebook";
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `sys-env-batch-${Date.now()}`,
                          role: "system",
                          content: `Environment concept art generation completed (${successful}/${total} ready). Advancing to ${targetStage === "storyboard" ? "Storyboard" : "Style Book"}...`,
                          created_at: new Date().toISOString(),
                        },
                      ]);
                      setTimeout(() => {
                        handleStageChange(targetStage);
                      }, 1200);
                    }
                  }}
                  onSkip={() => handleStageChange(isStyleBookSkipped ? "storyboard" : "stylebook")}
                />
              </div>
            </div>
          )}

          {/* STAGE 5: STORYBOARD */}
          {activeStage === "storyboard" && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
              <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
                <HyperdreamStoryboard
                  projectId={projectId}
                  storyboard={storyboardData}
                  onStoryboardUpdated={setStoryboardData}
                  isLoadingStoryboard={isLoadingStoryboard}
                  fetchError={storyboardError}
                  onRetry={() => loadStoryboard(true)}
                  onNavigateToProduction={(sceneId, shotId) => {
                    setProductionInitialSceneId(sceneId);
                    setProductionInitialShotId(shotId);
                    handleStageChange("shots");
                  }}
                  onSkip={() => handleStageChange("shots")}
                />
              </div>
            </div>
          )}

          {/* STAGE 6: SHOTS (Production Studio) */}
          {activeStage === "shots" && (
            isFetchingStoryboardRef.current || (isLoadingStoryboard && (!storyboardData || storyboardData.scenes.length === 0)) ? (
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
                <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
                  <ProductionStudioShimmer message="Loading cinematic takes and production studio controls..." />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
                <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
                  <HyperdreamProductionStudio
                    projectId={projectId}
                    scenes={storyboardData?.scenes || []}
                    initialSceneId={productionInitialSceneId}
                    initialShotId={productionInitialShotId}
                    onNavigateToStoryboard={() => handleStageChange("storyboard")}
                    onSkip={() => handleStageChange("editor")}
                    onRefreshScenes={async () => {
                      if (!accessToken || !projectId) return;
                      try {
                        const fresh = await storyboardService.getStoryboard(
                          projectId,
                          accessToken
                        );
                        setStoryboardData(fresh);
                      } catch (err) {
                        console.error("Failed to refresh storyboard:", err);
                      }
                    }}
                  />
                </div>
              </div>
            )
          )}

          {/* STAGE 7: EDITOR */}
          {activeStage === "editor" && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
              <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
                <FullVideoCompositionSection
                  projectId={projectId}
                  scenes={storyboardData?.scenes || []}
                  onNavigateToShots={() => handleStageChange("shots")}
                  onNavigateToStoryboard={() => handleStageChange("storyboard")}
                />
              </div>
            </div>
          )}

          {/* Unified Studio Toolbar */}
          <StudioToolbar
            projectId={projectId}
            activeStage={activeStage}
            isStyleBookSkipped={isStyleBookSkipped}
            isScreenplayReady={isScreenplayReady}
            versionText={
              activeStage === "characters"
                ? `characters • ${characters.length} cast members`
                : activeStage === "environments"
                ? `environments • ${environments.length} locations`
                : activeStage === "stylebook"
                ? isStyleBookSkipped
                  ? "style book • skipped (optional)"
                  : `style book • ${styleBookData?.style_book?.aesthetic?.preset || "custom visual style"}`
                : activeStage === "storyboard"
                ? `storyboard • ${storyboardData?.scenes?.length || 0} scenes`
                : activeStage === "shots"
                ? `shots • ${storyboardData?.total_shots || 0} takes`
                : activeStage === "editor"
                ? "editor • timeline sequence 1"
                : "script • version 1 of 1"
            }
            onStageChange={handleStageChange}
            onExport={() => {
              if (activeStage === "screenplay" && screenplay) {
                const scriptObj = screenplay.screenplay;
                let fullText = `${scriptObj?.title || "Untitled"}\n\n`;
                if (scriptObj?.logline) {
                  fullText += `LOGLINE: ${scriptObj.logline}\n\n`;
                }
                const scenes = scriptObj?.scenes || [];
                scenes.forEach((s) => {
                  fullText += `\nSCENE ${s.scene_number}: ${s.heading}\n\n`;
                  if (s.action) fullText += `${s.action}\n\n`;
                  s.dialogue?.forEach((dlg) => {
                    fullText += `    ${dlg.character?.toUpperCase()}\n`;
                    fullText += `  ${dlg.line}\n\n`;
                  });
                });
                navigator.clipboard.writeText(fullText);
              }
            }}
          />
        </div>
      </div>

      {/* Right AI Agent Chat Workspace */}
      <div className="w-full lg:w-[420px] flex flex-col justify-between bg-zinc-50/40 h-full min-h-0 flex-shrink-0 overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
        <ChatPanel
          conversationTitle={activeTitleOverride || activeConversation?.title}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveTitleOverride(null);
            setActiveConversationId(id);
          }}
          onNewChat={() => {
            setActiveTitleOverride(null);
            setActiveConversationId(null);
          }}
          messages={messages}
          isLoadingHistory={isLoadingHistory}
          isStreaming={isStreaming}
          streamingReasoning={streamingReasoning}
          streamingReasoningSteps={streamingReasoningSteps}
          streamingContent={streamingContent}
          error={chatError}
          onSendMessage={handleSendMessage}
          onSelectDirection={handleSelectDirection}
          onActionClick={handleChatActionClick}
        />
      </div>

      <EditStyleBookModal
        isOpen={isStyleBookEditModalOpen}
        onClose={() => setIsStyleBookEditModalOpen(false)}
        initialData={styleBookData?.style_book || null}
        onSave={handleSaveStyleBookModal}
      />
    </div>
  );
}
