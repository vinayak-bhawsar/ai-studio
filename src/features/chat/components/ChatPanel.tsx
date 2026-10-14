"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  AlertCircle,
  Compass,
  MessageSquare,
  Plus,
  Link as LinkIcon,
  ChevronDown,
  Check,
  SkipForward,
} from "lucide-react";
import {
  ChatMessage,
  ConversationListItem,
  CreativeDirectionItem,
  ChatActionItem,
} from "../types/chat";

interface ChatPanelProps {
  conversationTitle?: string;
  conversations?: ConversationListItem[];
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  messages: ChatMessage[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  streamingReasoning: string | null;
  streamingReasoningSteps?: string[];
  streamingContent: string;
  error: string | null;
  onSendMessage: (content: string) => void;
  onSelectDirection?: (direction: CreativeDirectionItem) => void;
  onActionClick?: (action: ChatActionItem, messageId?: string) => void;
}

const DEFAULT_WELCOME_MESSAGE_TEXT =
  "Welcome to our AI video studio! I'm excited to collaborate with you on your video project. Can you please share a bit about your idea or story premise to get us started?";

const defaultWelcomeMessage: ChatMessage = {
  id: "default-welcome-message",
  role: "assistant",
  content: DEFAULT_WELCOME_MESSAGE_TEXT,
  created_at: new Date(0).toISOString(),
};

export function ChatPanel({
  conversationTitle,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  messages,
  isLoadingHistory,
  isStreaming,
  streamingReasoning,
  streamingReasoningSteps = [],
  streamingContent,
  error,
  onSendMessage,
  onSelectDirection,
  onActionClick,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [model, setModel] = useState("GPT-5.4 mini");
  const [hiddenActionMsgIds, setHiddenActionMsgIds] = useState<Set<string>>(new Set());
  const [hiddenDirectionMsgIds, setHiddenDirectionMsgIds] = useState<Set<string>>(new Set());
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasWelcomeOrAssistantFirst =
    messages.length > 0 && messages[0].role === "assistant";

  const displayMessages: ChatMessage[] =
    messages.length === 0
      ? [defaultWelcomeMessage]
      : hasWelcomeOrAssistantFirst
      ? messages
      : [defaultWelcomeMessage, ...messages];


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsConversationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingReasoning, streamingReasoningSteps]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const text = inputText;
    setInputText("");
    onSendMessage(text);
  };

  const getReasoningSteps = (msg: ChatMessage): string[] => {
    const rawSteps = msg.reasoning_steps ?? msg.metadata?.reasoning_steps;
    if (Array.isArray(rawSteps) && rawSteps.length > 0) {
      return rawSteps.map((s) => String(s).trim()).filter(Boolean);
    }

    const singleReasoning =
      msg.reasoning ||
      msg.reasoning_content ||
      msg.thought ||
      msg.thoughts ||
      msg.thought_process ||
      (typeof rawSteps === "string" ? rawSteps : null);

    if (singleReasoning && typeof singleReasoning === "string") {
      const parts = singleReasoning
        .split(/\n|•/)
        .map((s) => s.trim())
        .filter(Boolean);
      return parts.length > 0 ? parts : [singleReasoning.trim()];
    }

    return [];
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950 h-full min-h-0 overflow-hidden">
      {/* Top Header: Conversation Switcher & New Chat Button */}
      <div className="h-14 px-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full pl-3.5 pr-2 py-1 shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <button
              type="button"
              onClick={() => {
                if (conversations.length > 1) {
                  setIsConversationsOpen((prev) => !prev);
                }
              }}
              className={`flex items-center gap-1.5 max-w-[210px] text-left transition-colors ${
                conversations.length > 1 ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" : "cursor-default"
              }`}
              title={conversationTitle || "Creative Idea"}
            >
              <span className="truncate">{conversationTitle || "Creative Idea"}</span>
              {conversations.length > 1 && (
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isConversationsOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {onNewChat && (
              <button
                type="button"
                onClick={() => {
                  setIsConversationsOpen(false);
                  onNewChat();
                }}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Start a new chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Conversations Dropdown */}
          {isConversationsOpen && conversations.length > 0 && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                <span>Recent Chats</span>
                {onNewChat && (
                  <button
                    onClick={() => {
                      setIsConversationsOpen(false);
                      onNewChat();
                    }}
                    className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    + New
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 px-1">
                {conversations.map((c) => {
                  const isSelected = c.id === activeConversationId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setIsConversationsOpen(false);
                        onSelectConversation?.(c.id);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium"
                      }`}
                    >
                      <span className="truncate flex-1 mr-2">{c.title || "Untitled Chat"}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
          <div className="w-7 h-4 bg-blue-600 rounded-full flex items-center px-0.5 cursor-pointer">
            <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm" />
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 min-h-0 bg-zinc-50 dark:bg-zinc-950/50">
        {isLoadingHistory && messages.length > 1 && (
          <div className="flex items-center justify-center py-1.5 text-zinc-400 gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="text-[11px]">Syncing chat...</span>
          </div>
        )}

        {displayMessages.map((msg) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";
            const reasoningSteps = getReasoningSteps(msg);
            const directions = msg.metadata?.directions;
            const actions = msg.metadata?.actions;

            if (isSystem) {
              return (
                <div key={msg.id} className="mb-4 px-3 flex justify-center">
                  <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 max-w-[92%] shadow-2xs">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            if (isUser) {
              return (
                <div key={msg.id} className="mb-6 px-3 flex flex-col items-end">
                  <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] text-zinc-900 dark:text-zinc-100 rounded-3xl px-5 py-2.5 text-[15px] leading-relaxed w-fit max-w-[85%]">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="mb-6 px-3 flex flex-col gap-2">
                {reasoningSteps.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {reasoningSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-[14px] sm:text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap mt-1">
                  {msg.content}
                </div>

                {/* Workflow Actions / Approval Buttons */}
                {!hiddenActionMsgIds.has(msg.id) &&
                  !msg.metadata?.actionsHidden &&
                  actions &&
                  Array.isArray(actions) &&
                  actions.length > 0 && (
                    <div className="mt-2.5 pt-1 flex flex-wrap gap-2">
                      {actions.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            if (!isStreaming && onActionClick) {
                              setHiddenActionMsgIds((prev) => new Set(prev).add(msg.id));
                              onActionClick(act, msg.id);
                            }
                          }}
                          disabled={isStreaming}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer ${
                            act.primary !== false
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                              : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                          } ${isStreaming ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {act.primary !== false && !act.action?.toLowerCase().includes("skip") ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* Creative Directions List if presented by Agent */}
                {!hiddenDirectionMsgIds.has(msg.id) &&
                  directions &&
                  Array.isArray(directions) &&
                  directions.length > 0 && (
                    <div className="mt-3 pt-3 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {directions.map((dir) => (
                          <div
                            key={dir.id}
                            onClick={() => {
                              if (!isStreaming && onSelectDirection) {
                                setHiddenDirectionMsgIds((prev) => new Set(prev).add(msg.id));
                                onSelectDirection(dir);
                              }
                            }}
                            className={`p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all text-left bg-zinc-50 dark:bg-zinc-900 ${
                              isStreaming
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                            }`}
                          >
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                              {dir.title}
                            </div>
                            {dir.description && (
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                                {dir.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}

        {/* Live SSE Streaming Assistant Message */}
        {isStreaming && (
          <div className="mb-6 px-3 flex flex-col gap-2">
            {(() => {
              const activeSteps =
                streamingReasoningSteps && streamingReasoningSteps.length > 0
                  ? streamingReasoningSteps
                  : streamingReasoning
                  ? [streamingReasoning]
                  : [];

              if (activeSteps.length === 0) return null;

              return (
                <div className="flex flex-col gap-1.5 mt-2">
                  {activeSteps.map((step, idx) => {
                    const isCurrent = idx === activeSteps.length - 1;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-xs ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        )}
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            {streamingContent && (
              <div className="text-[14px] sm:text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap mt-1">
                {streamingContent}
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Input Form */}
      <div className="bg-white dark:bg-zinc-950 p-4 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-3xl mx-auto">
          {/* Main Input Box */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message the agent..."
              disabled={isStreaming}
              className="flex-1 bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 disabled:opacity-50"
            />
            
            <button
              type="submit"
              disabled={isStreaming || !inputText.trim()}
              className="bg-blue-400 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl p-2.5 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Bottom Selectors */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="GPT-5.4 mini">GPT-5.4 mini</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              </select>
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm cursor-pointer group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50 transition-colors">
                <span>{model}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>

            <button type="button" className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ask</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
