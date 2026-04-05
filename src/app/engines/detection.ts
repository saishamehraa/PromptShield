// src/app/engines/detection.ts
// Detection Engine - Phase 2
// Detects prompt injection attacks and sensitive data

export interface DetectionResult {
  isInjectionDetected: boolean;
  isSensitiveDataDetected: boolean;
  injectionPatterns: string[];
  sensitiveDataTypes: string[];
  detectedItems: { type: string; value: string; position: number }[];
}

// Prompt Injection Patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|prompts?|rules?|commands?)/gi,
  /disregard\s+(previous|all|above)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(previous|all|above)\s+(instructions?|prompts?|rules?)/gi,
  /new\s+(instructions?|prompts?|rules?):/gi,
  /system\s+(prompt|message|instruction):/gi,
  /reveal\s+(your|the)\s+(system|prompt|instructions?|rules?)/gi,
  /what\s+(are|is)\s+(your|the)\s+(system|prompt|instructions?|rules?)/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /human:|assistant:/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a\s+)?different/gi,
  /override\s+(your|previous|all)\s+(instructions?|settings?|rules?)/gi,
  /bypass\s+(security|safety|filter|guardrails?)/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
  /developer\s+mode/gi,
  /pretend\s+(you|to\s+be)/gi,
];

// Sensitive Data Patterns
const SENSITIVE_PATTERNS = {
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    name: 'Email Address',
  },
  phone: {
    pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    name: 'Phone Number',
  },
  apiKey: {
    pattern: /\b(sk-[a-zA-Z0-9]{32,}|api[_-]?key[_-]?[=:]\s*[a-zA-Z0-9]{16,})\b/gi,
    name: 'API Key',
  },
  jwt: {
    pattern: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\b/g,
    name: 'JWT Token',
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    name: 'Social Security Number',
  },
  creditCard: {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    name: 'Credit Card',
  },
  otp: {
    pattern: /\b(otp|code|verification)[:\s]+\d{4,6}\b/gi,
    name: 'OTP/Verification Code',
  },
  ipAddress: {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    name: 'IP Address',
  },
 /* password: {
    pattern: /\b(password|pwd|passwd)[:\s]+[^\s]+/gi,
    name: 'Password',
  },*/
  password: {
    pattern: /\b(password|pwd|passwd|pass)(\s*(?:is|:|=)\s*)([^\s,.'"]+)/gi,
    name: 'Password',
  },
};

export function detectThreats(input: string): DetectionResult {
  const result: DetectionResult = {
    isInjectionDetected: false,
    isSensitiveDataDetected: false,
    injectionPatterns: [],
    sensitiveDataTypes: [],
    detectedItems: [],
  };

  // Check for prompt injection
  INJECTION_PATTERNS.forEach((pattern) => {
    const matches = input.match(pattern);
    if (matches) {
      result.isInjectionDetected = true;
      matches.forEach((match) => {
        if (!result.injectionPatterns.includes(match)) {
          result.injectionPatterns.push(match);
          const position = input.indexOf(match);
          result.detectedItems.push({
            type: 'Prompt Injection',
            value: match,
            position,
          });
        }
      });
    }
  });

  // Check for sensitive data
  Object.entries(SENSITIVE_PATTERNS).forEach(([key, config]) => {
    const matches = Array.from(input.matchAll(config.pattern));
    if (matches.length > 0) {
      result.isSensitiveDataDetected = true;
      if (!result.sensitiveDataTypes.includes(config.name)) {
        result.sensitiveDataTypes.push(config.name);
      }
      matches.forEach((match) => {
        result.detectedItems.push({
          type: config.name,
          value: match[0],
          position: match.index || 0,
        });
      });
    }
  });

  return result;
}
