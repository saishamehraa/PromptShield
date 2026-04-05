// src/app/engines/outputGuard.ts
// Output Guard - Phase 5
// Scans and filters LLM outputs for sensitive data leaks

import { maskSensitiveData } from './masking';

export interface OutputGuardResult {
  safeOutput: string;
  hasLeaks: boolean;
  leaksDetected: string[];
  maskingApplied: boolean;
  safetyReport: {
    status: 'SAFE' | 'SANITIZED' | 'UNSAFE';
    message: string;
    leakCount: number;
  };
}

const SENSITIVE_LEAK_PATTERNS = {
  systemPrompt: /\b(system prompt|internal instructions?|ai guidelines|training data)\b/gi,
  credentials: /\b(password|api[_-]?key|secret|token|credential)\s*[:=]\s*[^\s]+/gi,
  pii: /\b(ssn|social security|credit card|phone|email)\s*[:=]\s*[^\s]+/gi,
};

export function guardOutput(llmOutput: string): OutputGuardResult {
  const leaksDetected: string[] = [];
  let hasLeaks = false;

  // Check for potential leaks
  Object.entries(SENSITIVE_LEAK_PATTERNS).forEach(([leakType, pattern]) => {
    const matches = llmOutput.match(pattern);
    if (matches) {
      hasLeaks = true;
      matches.forEach((match) => {
        leaksDetected.push(`${leakType}: ${match}`);
      });
    }
  });

  // Apply masking to output
  const maskingResult = maskSensitiveData(llmOutput);
  const safeOutput = maskingResult.maskedText;
  const maskingApplied = maskingResult.maskCount > 0;

  // Generate safety report
  let status: 'SAFE' | 'SANITIZED' | 'UNSAFE';
  let message: string;

  if (hasLeaks && maskingApplied) {
    status = 'SANITIZED';
    message = 'Output contained sensitive data and has been sanitized';
  } else if (maskingApplied) {
    status = 'SANITIZED';
    message = 'Sensitive patterns detected and masked';
  } else if (hasLeaks) {
    status = 'UNSAFE';
    message = 'Potential leaks detected but not automatically masked';
  } else {
    status = 'SAFE';
    message = 'Output is safe for display';
  }

  return {
    safeOutput,
    hasLeaks,
    leaksDetected,
    maskingApplied,
    safetyReport: {
      status,
      message,
      leakCount: leaksDetected.length + maskingResult.maskCount,
    },
  };
}
