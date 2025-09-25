import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AppPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Load chat history
  const { data: chatHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/chat/history"],
  });

  // Initialize messages with history + welcome message
  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      setMessages(chatHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        tokensUsed: msg.tokensUsed
      })));
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [chatHistory]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return await res.json();
    },
    onSuccess: (data) => {
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        tokensUsed: data.tokensUsed
      }]);
      
      // Update user credits in cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Show success toast
      toast({
        title: "Message sent",
        description: `Used ${data.tokensUsed} token(s). ${data.remainingTokens} remaining.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;
    
    const userMessage = {
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage('');
    
    // Send to AI API
    chatMutation.mutate(messageContent);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent" data-testid="text-chat-title">
              AI Assistant
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Chat with your AI-powered assistant
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg px-4 py-2">
              <span className="material-symbols-outlined mr-1 text-sm">token</span>
              {user?.tokens || 0} Tokens
            </Badge>
            <Link href="/account/tokens">
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg" data-testid="button-buy-tokens">
                <span className="material-symbols-outlined mr-1 text-sm">add</span>
                Buy Tokens
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/30 dark:border-slate-700/50'
                  }`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                    {message.tokensUsed && (
                      <span className="ml-2 opacity-75">
                        • {message.tokensUsed} tokens
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl px-6 py-4 max-w-[70%] shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="resize-none bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-2xl px-4 py-3 pr-12 min-h-[50px] shadow-lg"
                rows={1}
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-sm">edit</span>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-2xl px-6 py-3 h-auto"
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span className="material-symbols-outlined">send</span>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
              <span className="material-symbols-outlined mr-1 text-sm">info</span>
              Each message costs tokens based on length (1 token per ~100 characters)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {user?.tokens || 0} tokens remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}