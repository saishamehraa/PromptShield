// src/app/engines/promptShield.ts (FRONTEND)

// 1. Define the interface so App.tsx can use it
export interface PromptShieldResponse {
  action: 'ALLOW' | 'SANITIZE' | 'BLOCK';
  riskScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  maskedInput: string;
  detection: {
    isInjectionDetected: boolean;
    isSensitiveDataDetected: boolean;
    injectionPatterns: string[];
    sensitiveDataTypes: string[];
  };
  matchedRules: string[];
  safeOutput: string;
  processingTimeMs: number;
}

// 2. The actual API caller
export async function processWithPromptShield(request: { message: string }): Promise<PromptShieldResponse> {
  const response = await fetch('/api/secure-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: request.message })
  });
  
  if (!response.ok) {
    throw new Error('Backend connection failed. Is your Node server running on port 3001?');
  }
  
  return await response.json();
}