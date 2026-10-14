"use client";

import { Project } from "../types/project";
import { ProjectCard } from "./ProjectCard";

interface ProjectGridProps {
  projects: Project[];
  onDelete: (id: string) => Promise<boolean>;
}

export function ProjectGrid({ projects, onDelete }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}
