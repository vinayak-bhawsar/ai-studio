"use client";

import Link from "next/link";
import { Menu, Plus } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
  onOpenCreateModal?: () => void;
  onOpenMobileSidebar?: () => void;
}

export function DashboardHeader({
  title = "Dashboard",
  onOpenCreateModal,
  onOpenMobileSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between pb-8 pt-2">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Top Right Action Button - Directly opens /create */}
      <Link
        href="/create"
        className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>New Project</span>
      </Link>
    </header>
  );
}
