"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { chatService } from "../services/chatService";
import { ConversationListItem } from "../types/chat";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

interface UseConversationsProps {
  projectId: string | null;
  initialConversationId?: string | null;
}

export function useConversations({ projectId, initialConversationId }: UseConversationsProps) {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>(() => {
    if (initialConversationId && projectId) {
      return [
        {
          id: initialConversationId,
          project_id: projectId,
          title: "Creative Idea",
          stage: "idea",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
    return [];
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => initialConversationId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProjectRef = useRef<string | null>(projectId);
  activeProjectRef.current = projectId;
  const inFlightAutoCreateRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  const loadConversations = useCallback(
    async (targetProjectId: string) => {
      if (!accessToken || !targetProjectId) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await chatService.getConversations(targetProjectId, 1, 50, accessToken);
        if (activeProjectRef.current !== targetProjectId) return;

        if (res.success && res.data) {
          const items = Array.isArray(res.data)
            ? res.data
            : res.data.items || [];

          if (items.length === 0) {
            if (inFlightAutoCreateRef.current !== targetProjectId) {
              inFlightAutoCreateRef.current = targetProjectId;
              try {
                const initRes = await chatService.createConversation(
                  targetProjectId,
                  { title: "Creative Idea" },
                  accessToken
                );
                if (
                  activeProjectRef.current === targetProjectId &&
                  initRes.success &&
                  initRes.data
                ) {
                  const newConv = initRes.data;
                  const listItem: ConversationListItem = {
                    id: newConv.id,
                    project_id: newConv.project_id,
                    title: newConv.title,
                    stage: newConv.stage,
                    created_at: newConv.created_at,
                    updated_at: newConv.updated_at,
                  };
                  setConversations([listItem]);
                  setActiveConversationId(newConv.id);
                  return;
                }
              } catch (createErr) {
                console.error("Failed to auto-create initial conversation:", createErr);
              } finally {
                inFlightAutoCreateRef.current = null;
              }
            }
          }

          setConversations(items);

          // Default to initialConversationId or the most recent conversation created for this project
          setActiveConversationId((prev) => {
            if (initialConversationId && items.some((c) => c.id === initialConversationId)) {
              return initialConversationId;
            }
            if (prev && items.some((c) => c.id === prev)) {
              return prev;
            }
            return items.length > 0 ? items[0].id : null;
          });
        }
      } catch (err: unknown) {
        if (activeProjectRef.current === targetProjectId) {
          const msg = err instanceof Error ? err.message : "Failed to load conversations.";
          setError(msg);
        }
      } finally {
        if (activeProjectRef.current === targetProjectId) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, initialConversationId]
  );

  useEffect(() => {
    if (projectId && accessToken) {
      loadConversations(projectId);
    } else if (!projectId) {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [projectId, accessToken, loadConversations]);

  const createConversation = useCallback(
    async (title: string = "Creative Idea"): Promise<string | null> => {
      if (!accessToken || !projectId || isCreating) return null;

      setIsCreating(true);
      setError(null);

      try {
        const res = await chatService.createConversation(projectId, { title }, accessToken);
        if (res.success && res.data) {
          const newConv = res.data;
          const listItem: ConversationListItem = {
            id: newConv.id,
            project_id: newConv.project_id,
            title: newConv.title,
            stage: newConv.stage,
            created_at: newConv.created_at,
            updated_at: newConv.updated_at,
          };

          setConversations((prev) => [listItem, ...prev.filter((c) => c.id !== listItem.id)]);
          setActiveConversationId(newConv.id);
          return newConv.id;
        }
        return null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create conversation.";
        setError(msg);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [accessToken, projectId, isCreating]
  );

  const updateConversationTitle = useCallback(
    (conversationId: string, title: string) => {
      const cleanTitle = title.trim();
      if (!conversationId || !cleanTitle) return;
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) {
          return prev.map((c) => (c.id === conversationId ? { ...c, title: cleanTitle } : c));
        }
        const newItem: ConversationListItem = {
          id: conversationId,
          project_id: projectId || "",
          title: cleanTitle,
          stage: "screenplay",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [newItem, ...prev];
      });
    },
    [projectId]
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!accessToken || !projectId) return false;

      try {
        const res = await chatService.deleteConversation(projectId, conversationId, accessToken);
        if (res.success) {
          setConversations((prev) => {
            const nextList = prev.filter((c) => c.id !== conversationId);
            if (activeConversationId === conversationId) {
              setActiveConversationId(nextList.length > 0 ? nextList[0].id : null);
            }
            return nextList;
          });
          return true;
        }
        return false;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete conversation.";
        setError(msg);
        return false;
      }
    },
    [accessToken, projectId, activeConversationId]
  );

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    isCreating,
    error,
    loadConversations: () => projectId && loadConversations(projectId),
    createConversation,
    updateConversationTitle,
    deleteConversation,
  };
}
