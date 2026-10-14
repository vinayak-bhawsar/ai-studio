"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "@/src/features/projects/services/projectService";
import { screenplayService } from "@/src/features/screenplay/services/screenplayService";
import { ScreenplayResponse } from "@/src/features/screenplay/types/screenplay";
import { Project } from "@/src/features/projects/types/project";
import { ProjectWorkspaceHeader } from "@/src/components/layout/ProjectWorkspaceHeader";
import { useConversations } from "@/src/features/chat/hooks/useConversations";
import { ScreenplayDocument } from "./ScreenplayDocument";

interface ScreenplayClientViewProps {
  projectId: string;
}

export function ScreenplayClientView({ projectId }: ScreenplayClientViewProps) {
  const { accessToken } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [screenplay, setScreenplay] = useState<ScreenplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const { conversations, activeConversationId } = useConversations({
    projectId,
  });

  const loadData = useCallback(async () => {
    if (!accessToken || !projectId) return;

    setIsLoading(true);
    try {
      const projRes = await projectService.getProject(projectId, accessToken);
      if (projRes.success && projRes.data) {
        setProject(projRes.data);
      }

      const convId = activeConversationId || (conversations.length > 0 ? conversations[0].id : null);
      if (convId) {
        const scriptData = await screenplayService.getScreenplay(
          projectId,
          convId,
          accessToken
        );
        setScreenplay(scriptData);
      }
    } catch {
      setScreenplay(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, projectId, activeConversationId, conversations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    if (!accessToken || isGenerating) return;

    const convId = activeConversationId || (conversations.length > 0 ? conversations[0].id : null);
    if (!convId) return;

    setIsGenerating(true);
    try {
      const resData = await screenplayService.createScreenplay(
        projectId,
        convId,
        accessToken
      );
      setScreenplay(resData);
    } catch (err) {
      console.error("Failed to generate screenplay:", err);
    } finally {
      setIsGenerating(false);
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
    <div className="w-full h-full flex flex-col overflow-y-auto p-6 sm:p-10 lg:p-12">
      <ProjectWorkspaceHeader
        projectId={projectId}
        projectTitle={project?.title || "Untitled Project"}
      />

      {/* Screenplay Content Box */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs max-w-5xl mx-auto w-full">
        {screenplay ? (
          <ScreenplayDocument
            projectId={projectId}
            screenplayData={screenplay}
            onEditScript={() => loadData()}
          />
        ) : (
          <div className="p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4 shadow-2xs">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">
              No Screenplay Generated
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
              Generate a professional cinematic screenplay from your creative direction conversation.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || conversations.length === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>Generate Screenplay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
