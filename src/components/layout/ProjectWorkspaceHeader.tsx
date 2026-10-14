"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Palette,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";

interface ProjectWorkspaceHeaderProps {
  projectId: string;
  projectTitle?: string;
}

export function ProjectWorkspaceHeader({
  projectId,
  projectTitle = "Untitled Project",
}: ProjectWorkspaceHeaderProps) {
  const pathname = usePathname();

  const baseNavItems = [
    {
      label: "Creative Chat",
      href: `/projects/${projectId}`,
      active: pathname === `/projects/${projectId}`,
      icon: MessageSquare,
    },
    {
      label: "Screenplay",
      href: `/projects/${projectId}/screenplay`,
      active: pathname.startsWith(`/projects/${projectId}/screenplay`),
      icon: Film,
    },
    {
      label: "Characters",
      href: `/projects/${projectId}/production-design/characters`,
      active: pathname.includes("/characters"),
      icon: Users,
    },
    {
      label: "Environments",
      href: `/projects/${projectId}/production-design/environments`,
      active: pathname.includes("/environments"),
      icon: ImageIcon,
    },
    {
      label: "Style Book",
      href: `/projects/${projectId}/production-design`,
      active: pathname === `/projects/${projectId}/production-design`,
      icon: Palette,
    },
    {
      label: "Storyboard",
      href: `/projects/${projectId}/storyboard`,
      active: pathname.startsWith(`/projects/${projectId}/storyboard`),
      icon: Layers,
    },
    {
      label: "Production Studio",
      href: `/projects/${projectId}/shots`,
      active: pathname.startsWith(`/projects/${projectId}/shots`),
      icon: Clapperboard,
    },
    {
      label: "Editor",
      href: `/projects/${projectId}/editor`,
      active: pathname.startsWith(`/projects/${projectId}/editor`),
      icon: Scissors,
    },
  ];

  const navItems = baseNavItems;

  return (
    <div className="w-full bg-white border-b border-zinc-200/80 mb-6 pb-2">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
              PROJECT WORKSPACE
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight mt-0.5">
              {projectTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Studio Active</span>
          </div>
        </div>
      </div>

      {/* Horizontal Workflow Nav Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                item.active
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
