"use client";

import { DashboardHeader } from "@/src/components/layout/DashboardHeader";
import { useProjects } from "@/src/features/projects/hooks/useProjects";
import { DashboardStatCard } from "@/src/features/projects/components/DashboardStatCard";
import { ProjectGrid } from "@/src/features/projects/components/ProjectGrid";
import { ProjectEmptyState } from "@/src/features/projects/components/ProjectEmptyState";
import { Loader2 } from "lucide-react";

export function DashboardClientView() {
  const {
    projects,
    totalProjects,
    isLoading,
    deleteProjectAction,
  } = useProjects();

  return (
    <div className="w-full h-full overflow-y-auto p-6 sm:p-10 lg:p-12">
      <div className="max-w-5xl">
        {/* Header with Title & + New Project Button */}
        <DashboardHeader
          title="Dashboard"
        />

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-8">
          <DashboardStatCard title="Total Projects" value={totalProjects} />
          <DashboardStatCard title="Generated Assets" value={0} />
        </div>

        {/* Recent Projects Section */}
        <div className="mt-8">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight mb-4">
            Recent Projects
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : projects.length > 0 ? (
            <ProjectGrid projects={projects} onDelete={deleteProjectAction} />
          ) : (
            <ProjectEmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
