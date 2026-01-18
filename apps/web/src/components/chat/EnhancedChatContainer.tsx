'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  Search, 
  History, 
  Paperclip, 
  MoreVertical, 
  Trash2, 
  Download, 
  Copy,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Clock,
  FileText,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Types
interface Message {
  id: string;
  conversationId: string;
  threadId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reactions?: Reaction[];
  attachments?: Attachment[];
  trustReceipt?: any;
  isTyping?: boolean;
}

interface Reaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Conversation {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface Thread {
  id: string;
  parentMessageId: string;
  messages: Message[];
  createdAt: string;
}

interface TypingIndicator {
  userId: string;
  conversationId: string;
  timestamp: string;
}

// Emoji picker data
const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '🔥', '💡', '✅', '❌', '⚠️',
  '🎯', '🚀', '💪', '🤔', '😊', '🎉', '📝', '💬'
];

interface EnhancedChatContainerProps {
  conversationId?: string;
  agentId?: string;
  readOnly?: boolean;
}

export function EnhancedChatContainer({ 
  conversationId, 
  agentId, 
  readOnly = false 
}: EnhancedChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversation history
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Fetch messages
  const { data: initialMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', conversationId, selectedThread],
    queryFn: () => api.getMessages(conversationId!, selectedThread || undefined),
    enabled: !!conversationId,
    onSuccess: (data) => {
      setMessages(data || []);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          content,
          threadId: selectedThread,
          attachments: attachedFiles,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to send message';
        
        // Provide helpful error messages for common issues
        if (errorMessage.includes('API key not configured')) {
          throw new Error('AI service not configured. Please add your OpenAI API key in settings.');
        } else if (errorMessage.includes('Invalid or expired token')) {
          throw new Error('Authentication expired. Please refresh the page.');
        } else if (errorMessage.includes('Cast to ObjectId failed')) {
          throw new Error('Invalid conversation. Please start a new chat.');
        }
        
        throw new Error(errorMessage);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Handle both successful AI response and failed AI generation cases
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        
        // Show warning if AI response was not available
        if (data.warning) {
          toast.warning('AI Response Unavailable', {
            description: data.warning,
            duration: 5000,
          });
        }
      } else if (data.conversation) {
        // AI generation failed but user message was saved, get the last message
        const lastMessage = data.conversation.messages[data.conversation.messages.length - 1];
        if (lastMessage) {
          setMessages((prev) => [...prev, {
            id: lastMessage._id || `msg-${Date.now()}`,
            conversationId: conversationId || '',
            role: lastMessage.sender === 'user' ? 'user' : 'assistant',
            content: lastMessage.content,
            timestamp: lastMessage.timestamp || new Date().toISOString(),
            reactions: [],
            attachments: [],
            trustReceipt: lastMessage.metadata?.trustEvaluation,
          }]);
        }
      }
      
      setInputMessage('');
      setAttachedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast.error('Failed to send message', { description: error.message });
    },
  });

  // React to message
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error('Failed to react');
      return res.json();
    },
    onSuccess: (data, { messageId, emoji }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), data.reaction] }
            : msg
        )
      );
    },
  });

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || readOnly) return;

    setIsTyping(true);
    await sendMessageMutation.mutateAsync(inputMessage);
    setIsTyping(false);
  };

  // Handle emoji reaction
  const handleReaction = (messageId: string, emoji: string) => {
    reactMutation.mutate({ messageId, emoji });
    setShowEmojiPicker(false);
  };

  // Start thread
  const handleStartThread = (messageId: string) => {
    setSelectedThread(messageId);
  };

  // Generate trust receipt
  const handleGenerateTrustReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/${conversationId}/trust-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to generate trust receipt');
      const data = await res.json();
      toast.success('Trust receipt generated', {
        description: 'Receipt has been attached to the conversation',
      });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    } catch (error: any) {
      toast.error('Failed to generate trust receipt', {
        description: error.message,
      });
    }
  };

  // Export conversation
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/${conversationId}/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Conversation exported');
    } catch (error: any) {
      toast.error('Failed to export', { description: error.message });
    }
  };

  // Delete conversation
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Conversation deleted');
      // Navigate back or handle deletion
    } catch (error: any) {
      toast.error('Failed to delete', { description: error.message });
    }
  };

  // Message component
  const MessageComponent = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    const reactions = message.reactions || [];

    return (
      <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 ${isUser ? 'order-2' : ''}`}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        
        <div className={`flex-1 max-w-[70%] ${isUser ? 'order-1' : ''}`}>
          <div
            className={`rounded-lg p-3 ${
              isUser
                ? 'bg-cyan-500 text-white'
                : 'bg-muted'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {reactions.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {reactions.map((reaction, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs"
                  >
                    {reaction.emoji} {reaction.userId.slice(0, 4)}
                  </Badge>
                ))}
              </div>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 text-xs opacity-75"
                  >
                    <FileText className="h-3 w-3" />
                    <span>{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {message.trustReceipt && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Trust Receipt Generated
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {!readOnly && !isUser && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
                onClick={() => handleStartThread(message.id)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply in thread
              </Button>
            )}
          </div>
          
          {/* Emoji picker */}
          {showEmojiPicker === message.id && !readOnly && (
            <div className="mt-2 p-2 bg-popover border rounded-lg shadow-lg">
              <div className="grid grid-cols-8 gap-1">
                {COMMON_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-lg p-0"
                    onClick={() => handleReaction(message.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Thread replies */}
          {message.threadId && (
            <div className="ml-4 mt-2 pl-4 border-l-2 border-muted">
              <div className="text-xs text-muted-foreground mb-2">
                Thread replies
              </div>
              {messages
                .filter((m) => m.threadId === message.id)
                .map((reply) => (
                  <MessageComponent key={reply.id} message={reply} />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoadingConversation || isLoadingMessages) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {conversation?.title || 'Chat'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              title="Export conversation"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateTrustReceipt}
              title="Generate trust receipt"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              title="Delete conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {messages
                  .filter((msg) =>
                    searchQuery === '' ||
                    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((message) => (
                    <MessageComponent key={message.id} message={message} />
                  ))}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Agent is typing...</span>
              </div>
            )}
            
            {/* Input */}
            {!readOnly && (
              <div className="mt-4 space-y-2">
                {/* Attachments */}
                {attachedFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {attachedFiles.map((file, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeAttachment(index)}
                      >
                        {file.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Input area */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Textarea
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={readOnly}
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || readOnly || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      const messageElement = document.getElementById(`message-${message.id}`);
                      messageElement?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === 'user' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.role === 'user' ? 'You' : 'Assistant'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Import MessageSquare icon
function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}