"use client";

import { MessageSquare, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { ConversationListItem } from "../types/chat";

interface ConversationListProps {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  isCreating,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ConversationListProps) {
  return (
    <div className="w-64 border-r border-zinc-200/80 bg-zinc-50/50 flex flex-col h-full flex-shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-zinc-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-800">
          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          <span>Conversations</span>
        </div>
        <button
          onClick={onNewChat}
          disabled={isCreating}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Start a new chat conversation"
        >
          {isCreating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-[11px]">Loading chats...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-zinc-400 text-xs">
            <Sparkles className="w-5 h-5 mx-auto mb-2 text-zinc-300" />
            <p className="font-semibold text-zinc-600 mb-1">No chats yet</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click &quot;New Chat&quot; to begin creative ideation.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? "bg-white text-blue-600 font-bold shadow-xs border border-zinc-200/90"
                    : "text-zinc-600 hover:bg-zinc-100/80 font-medium"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? "text-blue-600" : "text-zinc-400"
                    }`}
                  />
                  <div className="truncate">
                    <span className="truncate block leading-tight">{conv.title}</span>
                    {conv.stage && (
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        {conv.stage}
                      </span>
                    )}
                  </div>
                </div>

                {onDeleteConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) {
                        onDeleteConversation(conv.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-zinc-400 rounded transition-all cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
