'use client';

import React, { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Shield, History, Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConversationSummary {
  id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoadingHistory(true);
    try {
      const convs = await api.listConversations(20);
      setConversations(convs.map((c: any) => ({
        id: c._id || c.id,
        title: c.title || 'Untitled Session',
        lastActivity: c.lastActivity || c.updatedAt || c.createdAt,
        messageCount: c.messages?.length || 0,
      })));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    loadConversations();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="h-6 w-6 text-purple-500" />
          Trust-Aware Chat
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time constitutional alignment monitoring with SONATE Trust Protocol v2.0.0
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Conversation History Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History size={15} className="text-purple-500" />
                  History
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNewConversation}
                  className="h-7 px-2"
                  title="New conversation"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto">
              {isLoadingHistory ? (
                <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No previous sessions
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-xs transition-colors",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      selectedConversationId === conv.id
                        ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        : "border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{conv.title}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{conv.messageCount} msgs</span>
                      <span>{formatTime(conv.lastActivity)}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Container */}
        <div className="lg:col-span-3">
          <ChatContainer
            key={selectedConversationId ?? 'new'}
            initialConversationId={selectedConversationId}
            onConversationCreated={(id) => {
              setSelectedConversationId(id);
              loadConversations();
            }}
          />
        </div>
      </div>
    </div>
  );
}
