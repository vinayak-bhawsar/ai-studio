"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenCreateModal?: () => void;
  userCredits?: number;
}

export function Sidebar({
  onCloseMobile,
  onOpenCreateModal,
  userCredits = 8,
}: SidebarProps) {
  const pathname = usePathname();

  const isGenerateActive = pathname.startsWith("/generate");
  const isDashboardActive = pathname === "/dashboard";
  const isAssetsActive = pathname.startsWith("/assets");
  const isCreateActive = pathname.startsWith("/create");

  return (
    <aside className="group w-[60px] hover:w-[185px] transition-all duration-300 h-full flex flex-col justify-between bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 p-3 text-xs text-zinc-600 dark:text-zinc-400 select-none overflow-x-hidden overflow-y-auto z-40 whitespace-nowrap">
      {/* Top Header & Brand */}
      <div>
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between px-2 pt-1 pb-5">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center text-zinc-900 dark:text-zinc-100 transition-opacity hover:opacity-90 pl-1"
          >
            <div className="w-6 flex items-center justify-center shrink-0">
              <span className="text-xl font-extrabold tracking-tight flex items-center">
                h<span className="text-blue-600 text-sm leading-none self-start mt-0.5">⁺</span>
              </span>
            </div>
            <span className="text-sm font-extrabold tracking-tight ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">
              AI MOVIES
            </span>
          </Link>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-zinc-400 hover:text-zinc-700 rounded-md"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Group 1: Quick Actions */}
        <div className="space-y-0.5 mb-4">
          <Link
            href="/generate"
            onClick={onCloseMobile}
            className={`flex items-center p-2 rounded-lg transition-colors ${
              isGenerateActive
                ? "bg-blue-100/60 text-blue-700 font-bold"
                : "text-blue-600 font-medium hover:bg-blue-50/60"
            }`}
          >
            <div className="w-5 flex justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Generate</span>
          </Link>

          <Link
            href="/create"
            onClick={onCloseMobile}
            className={`flex items-center p-2 rounded-lg transition-colors ${
              isCreateActive
                ? "bg-zinc-200/70 text-zinc-900 font-bold"
                : "text-zinc-500 font-medium hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <div className="w-5 flex justify-center shrink-0">
              <Plus className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">
              New Project
            </span>
          </Link>
        </div>

        {/* Navigation Group 2: Core */}
        <div className="space-y-0.5 mb-4 pt-2 border-t border-zinc-200/60">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className={`flex items-center p-2 rounded-lg transition-colors ${
              isDashboardActive
                ? "bg-zinc-200/70 text-zinc-900 font-bold"
                : "text-zinc-600 font-medium hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <div className="w-5 flex justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Dashboard</span>
          </Link>

          <Link
            href="/assets"
            onClick={onCloseMobile}
            className={`flex items-center p-2 rounded-lg transition-colors ${
              isAssetsActive
                ? "bg-zinc-200/70 text-zinc-900 font-bold"
                : "text-zinc-500 font-medium hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <div className="w-5 flex justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Assets</span>
          </Link>
        </div>

        {/* Navigation Group 3: Settings & Workspace */}
        <div className="space-y-0.5 pt-2 border-t border-zinc-200/60">
          <div className="flex items-center p-2 text-zinc-400 font-medium cursor-not-allowed">
            <div className="w-5 flex justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Billing</span>
          </div>

          <div className="flex items-center p-2 text-zinc-400 font-medium cursor-not-allowed justify-between">
            <div className="flex items-center">
              <div className="w-5 flex justify-center shrink-0">
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Team</span>
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-400 tracking-wider">
              SOON
            </span>
          </div>

          <div className="flex items-center p-2 text-zinc-400 font-medium cursor-not-allowed">
            <div className="w-5 flex justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Trash</span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 space-y-3">
        {/* Free Credits Card */}
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-2.5 text-blue-900 shadow-xs flex flex-col items-center group-hover:items-start transition-all">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:inline">FREE</span>
          </div>
          <div className="text-xs font-bold text-blue-950 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block">
            {userCredits} Credits
          </div>
        </div>

        {/* Bottom Nav Actions */}
        <div className="space-y-0.5 pt-1">
          <div className="flex items-center p-2 justify-between">
            <div className="flex items-center">
              <div className="w-5 flex justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="ml-3 text-zinc-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Theme</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity"><ThemeToggle /></div>
          </div>
          
          <div className="flex items-center p-2 text-zinc-500 font-medium hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer">
            <div className="w-5 flex justify-center shrink-0">
              <Settings className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Settings</span>
          </div>

          <div className="flex items-center p-2 text-zinc-500 font-medium hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer">
            <div className="w-5 flex justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">Send Feedback</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
