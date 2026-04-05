// src/app/App.tsx
import { useState, useEffect } from 'react';
import { Shield, Sparkles, Github } from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
import { MessageDisplay, Message } from './components/MessageDisplay';
import { SecurityDashboard } from './components/SecurityDashboard';
import { TestPrompts } from './components/TestPrompts';
import { StatsPanel, StatsData } from './components/StatsPanel';
import { processWithPromptShield, PromptShieldResponse } from './engines/promptShield';
import { Card } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<PromptShieldResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    totalRequests: 0,
    blockedRequests: 0,
    sanitizedRequests: 0,
    allowedRequests: 0,
  });

  // Add welcome message on mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: '👋 Welcome to PromptShield Lite! I\'m your AI security gateway. Try selecting a test prompt above or type your own message to see how I detect and handle security threats in real-time. All your inputs will be analyzed for prompt injections and sensitive data.',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (messageText: string) => {
    setIsProcessing(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await processWithPromptShield({ message: messageText });
      setCurrentResponse(response);

      const updatedUserMessage: Message = {
        ...userMessage,
        maskedContent: response.maskedInput,
        action: response.action,
        severity: response.severity,
      };

      // Define a clearer message if blocked
      const assistantContent = response.action === 'BLOCK' 
        ? "⚠️ This request was intercepted by the security gateway. No response was generated to prevent a security policy violation."
        : response.safeOutput;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent || 'No response available',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, updatedUserMessage, assistantMessage]);

      setStats((prev) => ({
        totalRequests: prev.totalRequests + 1,
        blockedRequests: response.action === 'BLOCK' ? prev.blockedRequests + 1 : prev.blockedRequests,
        sanitizedRequests: response.action === 'SANITIZE' ? prev.sanitizedRequests + 1 : prev.sanitizedRequests,
        allowedRequests: response.action === 'ALLOW' ? prev.allowedRequests + 1 : prev.allowedRequests,
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      // Optional: Add a system error message to the chat
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832)',
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-pink-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-white/20 bg-black/20 backdrop-blur-md">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    PromptShield Lite
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </h1>
                  <p className="text-sm text-white/80">AI Security Gateway for LLM Applications</p>
                </div>
              </div>

              <a
                href="https://github.com/saishamehraa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          {/* Statistics Bar */}
          <div className="mb-6">
            <StatsPanel stats={stats} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Chat Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Test Prompts */}
              <TestPrompts onSelectPrompt={handleSendMessage} disabled={isProcessing} />

              {/* Messages */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Conversation
                </h2>
                <ScrollArea className="h-[500px] pr-4">
                  <MessageDisplay messages={messages} />
                </ScrollArea>
              </Card>

              {/* Chat Input */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <ChatInterface onSendMessage={handleSendMessage} isProcessing={isProcessing} />
              </Card>
            </div>

            {/* Right Column: Security Dashboard */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Analysis
                </h2>
                <SecurityDashboard response={currentResponse} />
              </Card>

              {/* Additional Info */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h3 className="font-semibold text-white mb-3">System Features</h3>
                <div className="space-y-2 text-sm text-white/90">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Prompt injection detection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Sensitive data masking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Real-time risk scoring (0-100)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Policy-based decisions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Output filtering & sanitization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span> LLM integration (Gemma)</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border-blue-400/30 p-6">
                <h3 className="font-semibold text-white mb-2">🎯 Try It Out!</h3>
                <p className="text-sm text-white/90">
                  Use the test prompts above to see how PromptShield detects and handles different security threats in real-time.
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/20 bg-black/20 backdrop-blur-md mt-12">
          <div className="container mx-auto px-6 py-4 text-center text-white/70 text-sm">
            <p>
              PromptShield Lite - Built for upgrading the AI Trust & Security.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}