"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { chatService } from "../services/chatService";
import { ChatMessage, CreativeDirectionItem, SSEDoneData } from "../types/chat";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

export const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "default-welcome-message",
  role: "assistant",
  content:
    "Welcome to our AI video studio! I'm excited to collaborate with you on your video project. Can you please share a bit about your idea or story premise to get us started?",
  created_at: new Date(0).toISOString(),
};

interface UseChatProps {
  projectId: string | null;
  conversationId: string | null;
  onDoneStream?: (data: SSEDoneData, targetConvId: string) => void;
  onConversationTitleUpdate?: (title: string, conversationId: string) => void;
}

export function useChat({
  projectId,
  conversationId,
  onDoneStream,
  onConversationTitleUpdate,
}: UseChatProps) {
  const { accessToken } = useAuth();
  const tokenRef = useRef(accessToken);

  const onDoneStreamRef = useRef(onDoneStream);
  useEffect(() => {
    onDoneStreamRef.current = onDoneStream;
  }, [onDoneStream]);

  const onConversationTitleUpdateRef = useRef(onConversationTitleUpdate);
  useEffect(() => {
    onConversationTitleUpdateRef.current = onConversationTitleUpdate;
  }, [onConversationTitleUpdate]);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingReasoning, setStreamingReasoning] = useState<string | null>(null);
  const [streamingReasoningSteps, setStreamingReasoningSteps] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendingConvIdRef = useRef<string | null>(null);
  const activeConvRef = useRef<string | null>(conversationId);
  activeConvRef.current = conversationId;

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef<boolean>(false);

  // Load message history when conversationId changes
  const loadMessages = useCallback(
    async (targetProjectId: string, targetConvId: string) => {
      if (!tokenRef.current || !targetProjectId || !targetConvId) return;

      // Do not interrupt an active message stream
      if (isSendingRef.current) {
        return;
      }

      setIsLoadingHistory(true);
      setError(null);
      setIsStreaming(false);
      setStreamingReasoning(null);
      setStreamingReasoningSteps([]);
      setStreamingContent("");

      try {
        const res = await chatService.getConversation(targetProjectId, targetConvId, tokenRef.current);
        // Verify race condition: only update if conversation didn't change and not sending
        if (activeConvRef.current !== targetConvId || isSendingRef.current) return;

        if (res.success && res.data) {
          if (res.data.title && activeConvRef.current === targetConvId) {
            onConversationTitleUpdateRef.current?.(res.data.title, targetConvId);
          }
          if (res.data.messages && res.data.messages.length > 0) {
            const loaded = res.data.messages.map((m) => {
              const metaSteps = m.metadata?.reasoning_steps;
              return {
                ...m,
                reasoning_steps:
                  m.reasoning_steps ||
                  (Array.isArray(metaSteps) ? (metaSteps as string[]) : undefined),
              };
            });
            const hasAssistantFirst = loaded[0].role === "assistant";
            setMessages(hasAssistantFirst ? loaded : [DEFAULT_WELCOME_MESSAGE, ...loaded]);
          } else {
            setMessages([DEFAULT_WELCOME_MESSAGE]);
          }
        } else {
          setMessages([DEFAULT_WELCOME_MESSAGE]);
        }
      } catch (err: unknown) {
        if (activeConvRef.current === targetConvId && !isSendingRef.current) {
          const msg = err instanceof Error ? err.message : "Failed to load conversation messages.";
          setError(msg);
          setMessages([DEFAULT_WELCOME_MESSAGE]);
        }
      } finally {
        if (activeConvRef.current === targetConvId && !isSendingRef.current) {
          setIsLoadingHistory(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    // If a send is currently active, don't wipe messages or run loadMessages
    if (isSendingRef.current) {
      return;
    }

    // Reset state immediately whenever conversationId or projectId changes
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setIsLoadingHistory(false);
    setIsStreaming(false);
    setStreamingReasoning(null);
    setStreamingReasoningSteps([]);
    setStreamingContent("");
    setError(null);

    if (projectId && conversationId) {
      loadMessages(projectId, conversationId);
    }

    return () => {
      // Do not abort if a message is actively sending
      if (abortControllerRef.current && !isSendingRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [projectId, conversationId, loadMessages]);

  const sendMessage = useCallback(
    async (content: string, overrideConvId?: string) => {
      const text = content.trim();
      const currentConvId = overrideConvId || conversationId;
      if (!text || !projectId || !currentConvId || !tokenRef.current || isStreaming || isSendingRef.current) return;

      isSendingRef.current = true;
      sendingConvIdRef.current = currentConvId;
      activeConvRef.current = currentConvId;
      setError(null);

      // Optimistic user message
      const tempUserMsgId = `temp-user-${Date.now()}`;
      const tempUserMsg: ChatMessage = {
        id: tempUserMsgId,
        conversation_id: currentConvId,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const hasAssistantFirst = prev.length > 0 && prev[0].role === "assistant";
        return hasAssistantFirst
          ? [...prev, tempUserMsg]
          : [DEFAULT_WELCOME_MESSAGE, ...prev, tempUserMsg];
      });
      setIsStreaming(true);
      const initialStep = "Understanding your request";
      setStreamingReasoning(initialStep);
      setStreamingReasoningSteps([initialStep]);
      setStreamingContent("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedContent = "";
      let capturedReasoning: string | null = initialStep;
      let capturedReasoningSteps: string[] = [initialStep];
      let returnedDirections: CreativeDirectionItem[] | undefined;
      let finalAction: string | undefined;
      let finalSelectedDirectionId: string | null | undefined;
      let finalAssistantMsgId = `asst-${Date.now()}`;
      let doneData: SSEDoneData | undefined;

      try {
        await chatService.sendMessageStream(
          projectId,
          currentConvId,
          { content: text },
          {
            onMessageStart: (data) => {
              if (activeConvRef.current && activeConvRef.current !== currentConvId) return;
              setMessages((prev) =>
                prev.map((m) => (m.id === tempUserMsgId ? { ...m, id: data.message_id } : m))
              );
              const title = data.conversation_title || data.title;
              const targetId = data.conversation_id || currentConvId;
              if (title && targetId) {
                onConversationTitleUpdateRef.current?.(title, targetId);
              }
            },
            onTitle: (data) => {
              const title = data.conversation_title || data.title;
              const targetId = data.conversation_id || currentConvId;
              if (title && targetId) {
                onConversationTitleUpdateRef.current?.(title, targetId);
              }
            },
            onReasoning: (data) => {
              if (activeConvRef.current && activeConvRef.current !== currentConvId) return;
              capturedReasoning = data.status;
              setStreamingReasoning(data.status);
              if (Array.isArray(data.steps) && data.steps.length > 0) {
                capturedReasoningSteps = [...data.steps];
              } else if (data.status && !capturedReasoningSteps.includes(data.status)) {
                capturedReasoningSteps = [...capturedReasoningSteps, data.status];
              }
              setStreamingReasoningSteps([...capturedReasoningSteps]);
            },
            onContent: (data) => {
              if (activeConvRef.current && activeConvRef.current !== currentConvId) return;
              accumulatedContent = data.content;
              setStreamingContent(data.content);
            },
            onDone: (data) => {
              if (activeConvRef.current && activeConvRef.current !== currentConvId) return;
              finalAssistantMsgId = data.message_id;
              finalAction = data.action;
              finalSelectedDirectionId = data.selected_direction_id;
              returnedDirections = data.directions;
              doneData = data;
              if (Array.isArray(data.reasoning_steps) && data.reasoning_steps.length > 0) {
                capturedReasoningSteps = [...data.reasoning_steps];
                setStreamingReasoningSteps([...capturedReasoningSteps]);
              }
              const title = data.conversation_title || data.title;
              const targetId = data.conversation_id || currentConvId;
              if (title && targetId) {
                onConversationTitleUpdateRef.current?.(title, targetId);
              }
            },
            onError: (data) => {
              if (activeConvRef.current && activeConvRef.current !== currentConvId) return;
              setError(data.message);
            },
          },
          tokenRef.current,
          controller.signal
        );

        if (!activeConvRef.current || activeConvRef.current === currentConvId) {
          if (accumulatedContent || returnedDirections) {
            const assistantMsg: ChatMessage = {
              id: finalAssistantMsgId,
              conversation_id: currentConvId,
              role: "assistant",
              content: accumulatedContent,
              reasoning: capturedReasoning || undefined,
              reasoning_steps: capturedReasoningSteps.length > 0 ? capturedReasoningSteps : undefined,
              metadata: {
                action: finalAction,
                directions: returnedDirections,
                selected_direction_id: finalSelectedDirectionId,
                reasoning_steps: capturedReasoningSteps.length > 0 ? capturedReasoningSteps : undefined,
              },
              created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
          }

          if (doneData && onDoneStreamRef.current) {
            onDoneStreamRef.current(doneData, currentConvId);
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        if (!activeConvRef.current || activeConvRef.current === currentConvId) {
          const msg = err instanceof Error ? err.message : "Failed to generate AI response.";
          setError(msg);
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              conversation_id: currentConvId,
              role: "assistant",
              content: `Error: ${msg}`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        isSendingRef.current = false;
        sendingConvIdRef.current = null;
        if (!activeConvRef.current || activeConvRef.current === currentConvId) {
          setIsStreaming(false);
          setStreamingReasoning(null);
          setStreamingReasoningSteps([]);
          setStreamingContent("");
          abortControllerRef.current = null;
        }
      }
    },
    [conversationId, projectId, isStreaming]
  );

  return {
    messages,
    isLoadingHistory,
    isStreaming,
    streamingReasoning,
    streamingReasoningSteps,
    streamingContent,
    error,
    sendMessage,
    setMessages,
  };
}
