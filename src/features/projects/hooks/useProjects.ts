"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { projectService } from "../services/projectService";
import { chatService } from "@/src/features/chat/services/chatService";
import { Project, ProjectCreateRequest, ProjectListResponse } from "../types/project";
import { APIResponse } from "@/src/features/auth/types/auth";

const PLACEHOLDER_TITLES = new Set([
  "untitled short",
  "untitled",
  "new project",
  "new chat",
  "new conversation",
]);

// Module-level deduplication and title cache to avoid redundant parallel network requests
let inFlightFetchPromise: Promise<APIResponse<ProjectListResponse>> | null = null;
let lastFetchTimestamp = 0;
let cachedProjectsData: APIResponse<ProjectListResponse> | null = null;
const enrichedTitlesCache = new Map<string, string>();
const checkedProjects = new Set<string>();
const inFlightEnrichments = new Map<string, Promise<string | null>>();

export function useProjects() {
  const { accessToken, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<Project[]>(() => {
    return cachedProjectsData?.data?.items || [];
  });
  const [totalProjects, setTotalProjects] = useState<number>(() => {
    return cachedProjectsData?.data?.total || 0;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedProjectsData);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resolveProjectTitle = useCallback(
    async (proj: Project, token: string): Promise<string | null> => {
      // Check cache first
      if (enrichedTitlesCache.has(proj.id)) {
        return enrichedTitlesCache.get(proj.id)!;
      }

      if (checkedProjects.has(proj.id)) {
        return null;
      }

      // Check if already resolving in flight
      if (inFlightEnrichments.has(proj.id)) {
        return inFlightEnrichments.get(proj.id)!;
      }

      const promise = (async () => {
        try {
          const convRes = await chatService.getConversations(proj.id, 1, 5, token);
          checkedProjects.add(proj.id);
          if (convRes.success && convRes.data && convRes.data.items?.length > 0) {
            const validConv = convRes.data.items.find(
              (c) =>
                c.title &&
                !PLACEHOLDER_TITLES.has(c.title.trim().toLowerCase())
            );
            if (validConv && validConv.title.trim()) {
              const resolved = validConv.title.trim();
              enrichedTitlesCache.set(proj.id, resolved);
              projectService
                .updateProject(proj.id, { title: resolved }, token)
                .catch(() => {});
              return resolved;
            }
          }
        } catch {
          // Ignore failure
        }
        return null;
      })();

      inFlightEnrichments.set(proj.id, promise);
      const res = await promise;
      inFlightEnrichments.delete(proj.id);
      return res;
    },
    []
  );

  const enrichProjectTitles = useCallback(
    async (items: Project[], token: string): Promise<Project[]> => {
      if (!token || items.length === 0) return items;

      let hasChanges = false;
      const updated = await Promise.all(
        items.map(async (p) => {
          const isPlaceholder =
            !p.title || PLACEHOLDER_TITLES.has(p.title.trim().toLowerCase());

          if (isPlaceholder) {
            const resolved = await resolveProjectTitle(p, token);
            if (resolved && resolved !== p.title) {
              hasChanges = true;
              return { ...p, title: resolved };
            }
          }
          return p;
        })
      );

      return hasChanges ? updated : items;
    },
    [resolveProjectTitle]
  );

  const fetchProjects = useCallback(
    async (force = false) => {
      if (!accessToken || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      // Reuse cached response if called within 2 seconds unless forced
      if (!force && cachedProjectsData && now - lastFetchTimestamp < 2000) {
        if (isMountedRef.current) {
          setProjects(cachedProjectsData.data?.items || []);
          setTotalProjects(cachedProjectsData.data?.total || 0);
          setIsLoading(false);
        }
        return;
      }

      // Reuse in-flight promise if a request is already underway
      if (!inFlightFetchPromise) {
        setIsLoading(true);
        setError(null);
        inFlightFetchPromise = projectService
          .getProjects(1, 50, accessToken)
          .then((res) => {
            if (res.success) {
              cachedProjectsData = res;
              lastFetchTimestamp = Date.now();
            }
            return res;
          })
          .finally(() => {
            inFlightFetchPromise = null;
          });
      }

      try {
        const response = await inFlightFetchPromise;
        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          const rawItems = response.data.items || [];
          setProjects(rawItems);
          setTotalProjects(response.data.total || 0);
          setIsLoading(false);

          // Enrich titles without re-fetching
          enrichProjectTitles(rawItems, accessToken).then((enriched) => {
            if (isMountedRef.current && enriched !== rawItems) {
              setProjects(enriched);
            }
          });
        } else {
          setProjects([]);
          setTotalProjects(0);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch projects");
          setProjects([]);
          setTotalProjects(0);
          setIsLoading(false);
        }
      }
    },
    [accessToken, isAuthenticated, enrichProjectTitles]
  );

  const createNewProject = async (
    data: ProjectCreateRequest
  ): Promise<Project | null> => {
    try {
      const response = await projectService.createProject(data, accessToken);
      if (response.success && response.data) {
        // Invalidate cache
        cachedProjectsData = null;
        lastFetchTimestamp = 0;
        checkedProjects.clear();
        await fetchProjects(true);
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const deleteProjectAction = async (projectId: string): Promise<boolean> => {
    try {
      const response = await projectService.deleteProject(projectId, accessToken);
      if (response.success) {
        // Invalidate cache
        cachedProjectsData = null;
        lastFetchTimestamp = 0;
        checkedProjects.delete(projectId);
        enrichedTitlesCache.delete(projectId);
        await fetchProjects(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    totalProjects,
    isLoading,
    error,
    refetchProjects: () => fetchProjects(true),
    createNewProject,
    deleteProjectAction,
  };
}
