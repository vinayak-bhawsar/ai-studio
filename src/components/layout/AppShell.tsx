"use client";

import { useState, useEffect, ReactNode, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect if initialization has completed and user is not authenticated
    if (isInitialized && !isAuthenticated && !isLoading) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Loading Studio Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-white text-zinc-900 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block flex-shrink-0 h-full">
        <Suspense fallback={<div className="w-[185px] h-full bg-zinc-50/60 border-r border-zinc-200/80" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-[200px] h-full">
            <Suspense fallback={<div className="w-[185px] h-full bg-zinc-50/60 border-r border-zinc-200/80" />}>
              <Sidebar
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 w-full h-full bg-white flex flex-col min-h-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
