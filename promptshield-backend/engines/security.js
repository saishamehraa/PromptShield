// engines/security.js

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|prompts?|rules?|commands?)/gi,
  /disregard\s+(previous|all|above)\s+(instructions?|prompts?|rules?)/gi,
  /system\s+(prompt|message|instruction):/gi,
  /reveal\s+(your|the)\s+(system|prompt|instructions?|rules?)/gi,
  /bypass\s+(security|safety|filter|guardrails?)/gi,
  /jailbreak/gi,
  /developer\s+mode/gi
];

const SENSITIVE_PATTERNS = {
  email: { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]', name: 'Email' },
  phone: { pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_PHONE]', name: 'Phone' },
  apiKey: { pattern: /\b(sk-[a-zA-Z0-9]{32,}|api[_-]?key[_-]?[=:]\s*[a-zA-Z0-9]{16,})\b/gi, replacement: '[REDACTED_API_KEY]', name: 'API Key' },
  password: { pattern: /\b(password|pwd|passwd|pass)(\s*(?:is|:|=)\s*)([^\s,.'"]+)/gi, replacement: '$1$2[REDACTED_PASSWORD]', name: 'Password' }
};

function analyzeAndMask(input) {
  let maskedText = input; // Start with the original text
  let injectionDetected = false;
  let matchedPatterns = [];
  let sensitiveTypes = [];
  let maskCount = 0;

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
    // Check if this pattern exists in the text
    const matches = Array.from(input.matchAll(config.pattern));
    
    if (matches.length > 0) {
      sensitiveTypes.push(config.name);
      maskCount += matches.length;

      // 🔥 THE FIX: Apply the replacement to maskedText, NOT input
      if (config.name === 'Password') {
        maskedText = maskedText.replace(config.pattern, '$1$2[REDACTED_PASSWORD]');
      } else {
        maskedText = maskedText.replace(config.pattern, config.replacement);
      }
    }
  });

  // 3. Scoring Engine
  let score = 0;
  if (injectionDetected) score = Math.min(100, 65 + (matchedPatterns.length * 10));
  if (sensitiveTypes.length > 0) score += (sensitiveTypes.length * 15);
  if (sensitiveTypes.includes('API Key')) score += 20;
  score = Math.min(100, score);

  // 4. Policy Engine (WITH MATCHED RULES)
  let action = 'ALLOW';
  let severity = 'LOW';
  let matchedRules = []; 

  if (score >= 70) { 
    action = 'BLOCK'; 
    severity = 'CRITICAL'; 
    matchedRules.push('RULE_001: Block requests with risk score >= 70');
  }
  else if (score >= 30) { 
    action = 'SANITIZE'; 
    severity = 'MEDIUM'; 
    matchedRules.push('RULE_002: Sanitize requests with risk score >= 30');
  } else {
    matchedRules.push('RULE_003: Allow requests with risk score < 30');
  }

  // specific threat rules
  if (injectionDetected) {
    matchedRules.push('RULE_004: Prompt injection detected');
  }
  if (sensitiveTypes.length > 1) {
    matchedRules.push('RULE_005: Multiple sensitive data types detected');
  }
  if (sensitiveTypes.includes('API Key')) {
    matchedRules.push('RULE_006: API key exposure - elevated threat');
  }

  // Return everything to the frontend!
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

module.exports = { analyzeAndMask };