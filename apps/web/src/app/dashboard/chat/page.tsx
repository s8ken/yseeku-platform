'use client';

import React, { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Shield, Info, History, Plus, MessageSquare, Trash2 } from 'lucide-react';
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

  // Load conversation history
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
    // Force re-render of ChatContainer by changing key
    loadConversations();
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-500" />
          Trust-Aware Session
        </h1>
        <p className="text-muted-foreground">
          Real-time AI interaction monitoring with SONATE Trust Protocol v1.8.0.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversation History Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History size={16} className="text-purple-500" />
                  Session History
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={handleNewConversation} className="h-7 px-2">
                  <Plus size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
              {isLoadingHistory ? (
                <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No previous sessions</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-xs transition-colors",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      selectedConversationId === conv.id && "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{conv.title}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{conv.messageCount} messages</span>
                      <span>{formatTime(conv.lastActivity)}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-slate-600 dark:text-slate-400">
              <p>
                Every message is processed through the <strong>SONATE Trust Protocol</strong>.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-[10px]">1</div>
                  <span><strong>Evaluation:</strong> AI responses are scored against 6 principles.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-[10px]">2</div>
                  <span><strong>Verification:</strong> Cryptographic receipt generated.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-[10px]">3</div>
                  <span><strong>Transparency:</strong> Inspect principle breakdown.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Container - takes more space now */}
        <div className="lg:col-span-3">
          <ChatContainer 
            initialConversationId={selectedConversationId}
            onConversationCreated={(id) => {
              // We update the local state to reflect the new ID, 
              // but we rely on ChatContainer to keep the message state
              setSelectedConversationId(id);
              loadConversations();
            }}
          />
        </div>
      </div>
    </div>
  );
}
