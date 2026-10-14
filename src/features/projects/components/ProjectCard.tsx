"use client";

import { useRouter } from "next/navigation";
import { Project } from "../types/project";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => Promise<boolean>;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formattedDate = new Date(project.updated_at || project.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  );

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(false);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    await onDelete(project.id);
    setIsDeleting(false);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <div
        onClick={() => router.push(`/projects/${project.id}`)}
        className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[130px] relative"
      >
        <div className="flex justify-between items-start">
          <div className="pr-4">
            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-1">
              {project.title || "Untitled Short"}
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-normal">
              Last updated: {formattedDate}
            </p>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              aria-label="Delete project"
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <div className="mt-4">
          <span className="px-3 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-100/50 dark:border-blue-900/40 rounded-full inline-block tracking-normal">
            Project
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div
          onClick={handleCancelDelete}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Delete Project?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{project.title || "Untitled Short"}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
