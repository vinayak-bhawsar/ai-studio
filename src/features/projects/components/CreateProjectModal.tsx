"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "../services/projectService";
import { chatService } from "@/src/features/chat/services/chatService";
import { Project, ProjectCreateRequest } from "../types/project";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject?: (data: ProjectCreateRequest) => Promise<Project | null>;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectModalProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const isSubmittingRef = useRef(false);

  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setModalError(null);

    const projectTitle = title.trim() || "Untitled Short";
    setIsSubmitting(true);

    try {
      let created: Project | null = null;
      if (onCreateProject) {
        created = await onCreateProject({ title: projectTitle });
      } else {
        const res = await projectService.createProject(
          { title: projectTitle },
          accessToken
        );
        if (res.success && res.data) {
          created = res.data;
        }
      }

      if (created) {
        // Retrieve pre-created initial conversation with welcome message
        let convId: string | null = null;
        try {
          const listRes = await chatService.getConversations(created.id, 1, 10, accessToken);
          if (listRes.success && listRes.data) {
            const items = Array.isArray(listRes.data) ? listRes.data : listRes.data.items || [];
            if (items.length > 0) {
              convId = items[0].id;
            }
          }
          if (!convId) {
            const convRes = await chatService.createConversation(
              created.id,
              { title: "Creative Idea" },
              accessToken
            );
            if (convRes.success && convRes.data) {
              convId = convRes.data.id;
            }
          }
        } catch {
          // ignore
        }

        setIsSubmitting(false);
        setTitle("");
        onClose();
        if (convId) {
          router.push(`/projects/${created.id}?c=${convId}`);
        } else {
          router.push(`/projects/${created.id}`);
        }
      } else {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        setModalError("Failed to create project. Please try again.");
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      setModalError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
              Create New Project
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {modalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600">
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="project-title"
              className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5"
            >
              PROJECT TITLE
            </label>
            <input
              id="project-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Untitled Short"
              className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>CREATING...</span>
                </>
              ) : (
                <span>CREATE PROJECT</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
