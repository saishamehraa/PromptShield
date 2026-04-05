// src/app/engines/masking.ts
// Masking Engine - Phase 2
// Redacts and masks sensitive information

export interface MaskingResult {
  maskedText: string;
  maskCount: number;
  maskingMap: { original: string; masked: string; type: string }[];
}

const SENSITIVE_PATTERNS = {
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[REDACTED_EMAIL]',
    name: 'Email',
  },
  phone: {
    pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
    name: 'Phone',
  },
  apiKey: {
    pattern: /\b(sk-[a-zA-Z0-9]{32,}|api[_-]?key[_-]?[=:]\s*[a-zA-Z0-9]{16,})\b/gi,
    replacement: '[REDACTED_API_KEY]',
    name: 'API Key',
  },
  jwt: {
    pattern: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\b/g,
    replacement: '[REDACTED_JWT]',
    name: 'JWT Token',
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
    name: 'SSN',
  },
  creditCard: {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[REDACTED_CARD]',
    name: 'Credit Card',
  },
  otp: {
    pattern: /\b(otp|code|verification)[:\s]+\d{4,6}\b/gi,
    replacement: '[REDACTED_OTP]',
    name: 'OTP',
  },
  ipAddress: {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[REDACTED_IP]',
    name: 'IP Address',
  },
  /* password: {
    pattern: /\b(password|pwd|passwd)[:\s]+[^\s]+/gi,
    replacement: '[REDACTED_PASSWORD]',
    name: 'Password',
  },*/
  password: {
    // Captures: 1(password word) 2(separator like 'is' or ':') 3(the actual password)
    pattern: /\b(password|pwd|passwd|pass)(\s*(?:is|:|=)\s*)([^\s,.'"]+)/gi,
    replacement: '$1$2[REDACTED_PASSWORD]',
    name: 'Password',
  },
};

export function maskSensitiveData(input: string): MaskingResult {
  let maskedText = input;
  let maskCount = 0;
  const maskingMap: { original: string; masked: string; type: string }[] = [];

  Object.entries(SENSITIVE_PATTERNS).forEach(([key, config]) => {
    const matches = Array.from(input.matchAll(config.pattern));
    
    matches.forEach((match) => {
      const original = match[0];
      maskedText = maskedText.replace(original, config.replacement);
      maskCount++;
      maskingMap.push({
        original,
        masked: config.replacement,
        type: config.name,
      });
    });
  });

  return {
    maskedText,
    maskCount,
    maskingMap,
  };
}

export function maskPartial(input: string): string {
  // Partial masking - shows first/last few characters
  let result = input;

  // Email partial masking
  result = result.replace(
    /\b([A-Za-z0-9._%+-]{1,3})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g,
    '$1***@$2'
  );

  // Phone partial masking
  result = result.replace(
    /\b(\d{3})[\d-.\s]+(\d{4})\b/g,
    '$1-***-$2'
  );

  return result;
}
