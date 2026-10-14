"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "@/src/features/projects/services/projectService";
import { Project } from "@/src/features/projects/types/project";
import { useConversations } from "@/src/features/chat/hooks/useConversations";
import { useChat } from "@/src/features/chat/hooks/useChat";
import { ChatPanel } from "@/src/features/chat/components/ChatPanel";
import { StudioToolbar } from "@/src/components/layout/StudioToolbar";
import { storyboardService } from "@/src/features/storyboard/services/storyboardService";
import { StoryboardResponse } from "@/src/features/storyboard/types/storyboard";
import { FullVideoCompositionSection } from "@/src/features/shots/components/FullVideoCompositionSection";

interface EditorClientViewProps {
  projectId: string;
}

export function EditorClientView({ projectId }: EditorClientViewProps) {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storyboardData, setStoryboardData] = useState<StoryboardResponse | null>(null);

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
        const sb = await storyboardService.getStoryboard(projectId, accessToken);
        if (isMounted) {
          setStoryboardData(sb);
        }
      } catch (err) {
        console.error("Failed to load project details or storyboard for editor:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId, accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-zinc-950 select-none">
      {/* Left Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-14 border-b border-zinc-200/80 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-950 flex-shrink-0">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
            {project ? project.title : "Untitled Short"}
          </span>

          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Timeline & Video Editor
          </span>

          <Link
            href={`/projects/${projectId}`}
            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Script Writing</span>
          </Link>
        </div>

        {/* Left Editor Canvas */}
        <div className="flex-1 bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between relative">
          <div className="max-w-6xl mx-auto w-full space-y-6 pb-20">
            <FullVideoCompositionSection
              projectId={projectId}
              scenes={storyboardData?.scenes || []}
              onNavigateToShots={() => router.push(`/projects/${projectId}/shots`)}
              onNavigateToStoryboard={() => router.push(`/projects/${projectId}/storyboard`)}
            />
          </div>

          <StudioToolbar
            projectId={projectId}
            activeStage="editor"
            versionText="editor • timeline sequence 1"
          />
        </div>
      </div>

      {/* Right AI Chat Assistant Panel */}
      <div className="w-full lg:w-[420px] flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-950 h-full min-h-0 flex-shrink-0 overflow-hidden border-l border-zinc-200/80 dark:border-zinc-800/80">
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
    </div>
  );
}
