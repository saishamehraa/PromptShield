// src/app/components/MessageDisplay.tsx
// Message Display Component
import { Bot, User, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  maskedContent?: string;
  timestamp: string;
  action?: 'ALLOW' | 'SANITIZE' | 'BLOCK';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface MessageDisplayProps {
  messages: Message[];
}

export function MessageDisplay({ messages }: MessageDisplayProps) {
  if (messages.length === 0) {
    return (
      <Card className="p-8 bg-white/70 backdrop-blur border-gray-200">
        <div className="text-center text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No messages yet. Start a conversation!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`p-4 ${
            message.role === 'user'
              ? 'bg-blue-50/80 border-blue-200'
              : 'bg-white/80 border-gray-200'
          } backdrop-blur`}
        >
          <div className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  {message.role === 'user' ? 'You' : 'PromptShield AI'}
                </span>
                {message.action && (
                  <div className="flex items-center gap-2">
                    {message.action === 'BLOCK' ? (
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                    )}
                    <Badge
                      variant={message.action === 'BLOCK' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {message.action}
                    </Badge>
                  </div>
                )}
              </div>

              {message.role === 'user' && message.maskedContent && message.maskedContent !== message.content && (
                <div className="mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">
                    ⚠️ Original Message (Contains Sensitive Data):
                  </p>
                  <p className="text-sm text-gray-700 line-through opacity-60">
                    {message.content}
                  </p>
                  <p className="text-xs font-semibold text-yellow-800 mt-2 mb-1">
                    ✓ Sanitized Version:
                  </p>
                  <p className="text-sm text-gray-900">{message.maskedContent}</p>
                </div>
              )}

              {(!message.maskedContent || message.maskedContent === message.content) && (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export type { Message };
