// engines/security.js

const INJECTION_PATTERNS = [
  // 1. Classic Instruction Overrides
  /(ignore|disregard|forget|bypass|override)\s+(previous|all|above|system)?\s*(instructions?|prompts?|rules?|commands?|guidelines?|context)/gi,
  
  // 2. System Prompt Exfiltration & Discovery
  /(reveal|print|show|output|leak|what\s+(are|is))\s+(your|the)\s+(system|prompt|instructions?|rules?|initial\s+prompt)/gi,
  /new\s+(instructions?|prompts?|rules?):/gi,

  // 3. Known Jailbreak Personas
  /(jailbreak|developer\s+mode|dan\s+mode|do\s+anything\s+now)/gi,
  /act\s+as\s+(an|a|another)\s+(ai|assistant|entity|character|system)\s+(that|who|which)\s+(does|can|will)/gi,
  
  // 4. Sandbox Escapes & Hypotheticals
  /simulate\s+a\s+(scenario|conversation)\s+where/gi,
  /(you\s+are\s+no\s+longer|from\s+now\s+on\s+you\s+are|you\s+are\s+now|pretend\s+(you|to\s+be))/gi,

  // 5. Chat Template Injection (Llama/Mistral/ChatML tags)
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|human:|assistant:/gi
];

const SENSITIVE_PATTERNS = {
  email: { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]', name: 'Email' },
  phone: { pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_PHONE]', name: 'Phone' },
  apiKey: { pattern: /\b(sk-[a-zA-Z0-9]{32,}|api[_-]?key[_-]?[=:]\s*[a-zA-Z0-9]{16,})\b/gi, replacement: '[REDACTED_API_KEY]', name: 'API Key' },
  password: { pattern: /\b(password|pwd|passwd|pass)(\s*(?:is|:|=)\s*)([^\s,.'"]+)/gi, replacement: '$1$2[REDACTED_PASSWORD]', name: 'Password' },
  jwtToken: { pattern: /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, replacement: '[REDACTED_JWT_TOKEN]', name: 'JWT Token' },
  ssn: { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]', name: 'SSN' },
  creditCard: { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[REDACTED_CARD]', name: 'Credit Card' },
  otp: { pattern: /\b(otp|code|verification)[:\s]+\d{4,6}\b/gi, replacement: '[REDACTED_OTP]', name: 'OTP' },
  ipAddress: { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[REDACTED_IP]', name: 'IP Address' }
};

const SENSITIVE_LEAK_PATTERNS = {
  systemPrompt: /\b(system prompt|internal instructions?|ai guidelines|training data)\b/gi,
  credentials: /\b(password|api[_-]?key|secret|token|credential)\s*[:=]\s*[^\s]+/gi,
  pii: /\b(ssn|social security|credit card|phone|email)\s*[:=]\s*[^\s]+/gi,
};

function analyzeAndMask(input) {
  let maskedText = input; 
  let injectionDetected = false;
  let matchedPatterns = [];
  let sensitiveTypes = [];

  // 1. Detect Injections
  INJECTION_PATTERNS.forEach(pattern => {
    const matches = input.match(pattern);
    if (matches) {
      injectionDetected = true;
      matchedPatterns.push(...matches);
    }
  });

  // 2. Detect & Mask PII
  Object.values(SENSITIVE_PATTERNS).forEach(config => {
    const matches = Array.from(input.matchAll(config.pattern));
    if (matches.length > 0) {
      if (!sensitiveTypes.includes(config.name)) sensitiveTypes.push(config.name);

      if (config.name === 'Password') {
        maskedText = maskedText.replace(config.pattern, '$1$2[REDACTED_PASSWORD]');
      } else {
        maskedText = maskedText.replace(config.pattern, config.replacement);
      }
    }
  });

  // 3. Scoring Engine (Upgraded from frontend logic)
  let score = 0;
  if (injectionDetected) {
     // High base score for injections
     score = Math.min(100, 65 + (matchedPatterns.length * 10));
  }
  if (sensitiveTypes.length > 0) {
     // 20 base + 5 per type
     score += 20 + (sensitiveTypes.length * 5); 
  }
  if (input.length > 500) score += 5; // Long prompt penalty
  if (sensitiveTypes.includes('API Key') || sensitiveTypes.includes('JWT Token')) score += 20;
  
  score = Math.min(100, score);

  // 4. Policy Engine 
  let action = 'ALLOW';
  let severity = 'LOW';
  let matchedRules = []; 

  if (score >= 70) { 
    action = 'BLOCK'; 
    severity = 'CRITICAL'; 
    matchedRules.push('RULE_001: Block requests with risk score >= 70');
  }
  else if (score >= 40) { 
    action = 'SANITIZE'; 
    severity = 'HIGH'; 
    matchedRules.push('RULE_002: Sanitize requests with risk score >= 40');
  } else {
    matchedRules.push('RULE_003: Allow requests with risk score < 40');
  }

  if (injectionDetected) matchedRules.push('RULE_004: Prompt injection detected');
  if (sensitiveTypes.length > 1) matchedRules.push('RULE_005: Multiple sensitive data types detected');
  if (sensitiveTypes.includes('API Key') || sensitiveTypes.includes('JWT Token')) matchedRules.push('RULE_006: Credential exposure - elevated threat');

  return {
    originalInput: input,
    maskedInput: maskedText,
    riskScore: score,
    action,
    severity,
    matchedRules,
    detectionDetails: { injectionDetected, sensitiveTypes, matchedPatterns }
  };
}

// 5. Output Guard (Newly Ported from Frontend)
function guardOutput(llmOutput) {
  let hasLeaks = false;
  
  // Check against leak patterns
  Object.values(SENSITIVE_LEAK_PATTERNS).forEach(pattern => {
    if (llmOutput.match(pattern)) hasLeaks = true;
  });

  // Pass output through the standard masker just to be safe
  const maskingResult = analyzeAndMask(llmOutput);
  
  return {
    safeOutput: maskingResult.maskedInput,
    hasLeaks: hasLeaks,
    wasSanitized: (maskingResult.maskedInput !== llmOutput)
  };
}

module.exports = { analyzeAndMask, guardOutput };