// src/app/components/ChatInterface.tsx
// Chat Interface Component
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export function ChatInterface({ onSendMessage, isProcessing }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
          className="min-h-[60px] max-h-[200px] resize-none bg-white/90 backdrop-blur border-gray-300 focus:border-blue-500"
          disabled={isProcessing}
        />
      </div>
      <Button
        type="submit"
        disabled={!message.trim() || isProcessing}
        className="h-[60px] px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Send
          </>
        )}
      </Button>
    </form>
  );
}
