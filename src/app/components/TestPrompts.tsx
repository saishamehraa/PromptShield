// src/app/components/TestPrompts.tsx
// Test Prompts Selector Component
import { FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TEST_PROMPTS, TestPrompt } from '../data/testPrompts';
import { useState } from 'react';

interface TestPromptsProps {
  onSelectPrompt: (message: string) => void;
  disabled?: boolean;
}

export function TestPrompts({ onSelectPrompt, disabled }: TestPromptsProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  const handleSelect = (value: string) => {
    setSelectedPrompt(value);
    const prompt = TEST_PROMPTS.find((p) => p.id === value);
    if (prompt) {
      onSelectPrompt(prompt.message);
    }
  };

  return (
    <Card className="p-4 bg-white/90 backdrop-blur border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold">Test Prompts</h3>
      </div>

      <Select value={selectedPrompt} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a test prompt..." />
        </SelectTrigger>
        <SelectContent>
          {TEST_PROMPTS.map((prompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">{prompt.label}</span>
                <span className="text-xs text-gray-500">{prompt.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const safePrompt = TEST_PROMPTS.find((p) => p.id === 'safe-1');
            if (safePrompt) onSelectPrompt(safePrompt.message);
          }}
          disabled={disabled}
          className="text-xs"
        >
          ✅ Safe
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const injectionPrompt = TEST_PROMPTS.find((p) => p.id === 'injection-1');
            if (injectionPrompt) onSelectPrompt(injectionPrompt.message);
          }}
          disabled={disabled}
          className="text-xs"
        >
          🚨 Injection
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const piiPrompt = TEST_PROMPTS.find((p) => p.id === 'pii-1');
            if (piiPrompt) onSelectPrompt(piiPrompt.message);
          }}
          disabled={disabled}
          className="text-xs"
        >
          ⚠️ PII
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const credPrompt = TEST_PROMPTS.find((p) => p.id === 'credentials-1');
            if (credPrompt) onSelectPrompt(credPrompt.message);
          }}
          disabled={disabled}
          className="text-xs"
        >
          🔴 Credentials
        </Button>
      </div>
    </Card>
  );
}
