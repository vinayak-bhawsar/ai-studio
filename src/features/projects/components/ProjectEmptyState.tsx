"use client";

import Link from "next/link";
import { Plus, Video } from "lucide-react";

interface ProjectEmptyStateProps {
  onOpenCreateModal?: () => void;
}

export function ProjectEmptyState({ onOpenCreateModal }: ProjectEmptyStateProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
        <Video className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight mb-1">
        No projects yet
      </h3>
      <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mb-6">
        Start your first cinematic project to generate AI-assisted scenes and assets.
      </p>

      <Link
        href="/create"
        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create Project</span>
      </Link>
    </div>
  );
}
