"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "@/src/features/projects/services/projectService";
import { chatService } from "@/src/features/chat/services/chatService";
import { APIError } from "@/src/services/api/apiClient";

let createdProjectId: string | null = null;
let creationPromise: Promise<{ projectId: string; convId: string | null } | null> | null = null;
let lastCreateTimestamp = 0;

export default function CreateProjectPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (!accessToken || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const initProject = async () => {
      try {
        const now = Date.now();
        // If a project was created within the last 2 seconds (StrictMode dual-mount), reuse it immediately
        if (!creationPromise && createdProjectId && now - lastCreateTimestamp < 2000) {
          if (isMounted) {
            router.replace(`/projects/${createdProjectId}`);
          }
          return;
        }

        // Shared in-flight creation promise across React StrictMode dual-mounts
        if (!creationPromise) {
          creationPromise = (async () => {
            try {
              const createRes = await projectService.createProject(
                { title: "Untitled Short" },
                accessToken
              );

              if (createRes.success && createRes.data) {
                const pid = createRes.data.id;
                createdProjectId = pid;
                lastCreateTimestamp = Date.now();
                // Retrieve pre-created initial conversation with welcome message
                let convId: string | null = null;
                try {
                  const listRes = await chatService.getConversations(pid, 1, 10, accessToken);
                  if (listRes.success && listRes.data) {
                    const items = Array.isArray(listRes.data) ? listRes.data : listRes.data.items || [];
                    if (items.length > 0) {
                      convId = items[0].id;
                    }
                  }
                  if (!convId) {
                    const convRes = await chatService.createConversation(
                      pid,
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
                return { projectId: pid, convId };
              }
              return null;
            } finally {
              creationPromise = null;
            }
          })();
        }

        const result = await creationPromise;
        if (result?.projectId) {
          if (result.convId) {
            router.replace(`/projects/${result.projectId}?c=${result.convId}`);
          } else {
            router.replace(`/projects/${result.projectId}`);
          }
        } else if (!result) {
          console.error("Failed to create project");
        }
      } catch (err: unknown) {
        if (
          err instanceof APIError &&
          (err.status === 401 || err.message.toLowerCase().includes("token"))
        ) {
          router.push("/sign-in");
          return;
        }
        console.error("Failed to initialize project:", err);
      }
    };

    initProject();
    return () => {
      isMounted = false;
    };
  }, [accessToken, router]);

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center bg-white min-h-[500px]">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Creating Project...
        </p>
      </div>
    </div>
  );
}
