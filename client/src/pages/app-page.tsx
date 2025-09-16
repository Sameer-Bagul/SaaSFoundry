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
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";

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
        creditsUsed: msg.creditsUsed
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
        creditsUsed: data.creditsUsed
      }]);
      
      // Update user credits in cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Show success toast
      toast({
        title: "Message sent",
        description: `Used ${data.creditsUsed} credit(s). ${data.remainingCredits} remaining.`,
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col">
          <div className="border-b p-4 bg-background">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-chat-title">
                  AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chat with your AI-powered assistant
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {user?.tokens || 0} Credits
                </Badge>
                <Link href="/buy-credits">
                  <Button size="sm" data-testid="button-buy-credits">
                    <span className="material-symbols-outlined mr-1 text-sm">add</span>
                    Buy Credits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[60%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                      data-testid={`message-${message.role}-${index}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 max-w-[60%]">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="border-t p-4 bg-background">
              <div className="flex space-x-2">
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
                  className="resize-none"
                  rows={1}
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  data-testid="button-send-message"
                >
                  {chatMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Each message costs credits based on length (1 credit per ~100 characters). You have {user?.tokens || 0} credits remaining.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}