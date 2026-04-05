# PromptShield Lite - Security Engines Documentation

## Overview

PromptShield Lite is a comprehensive AI security gateway that protects LLM applications from prompt injection attacks and sensitive data leaks.

## Architecture

```
User Input → Detection Engine → Masking Engine → Risk Scoring → Policy Engine → LLM → Output Guard → Safe Response
```

## Core Engines

### 1. Detection Engine (`detection.ts`)

**Purpose**: Identifies security threats in user input

**Detects**:
- Prompt injection patterns (ignore instructions, system prompt reveals, jailbreaks)
- Sensitive data (emails, phones, API keys, JWT tokens, SSN, credit cards, passwords, IP addresses)

**Output**: `DetectionResult` with detected threats and their positions

### 2. Masking Engine (`masking.ts`)

**Purpose**: Redacts sensitive information from text

**Capabilities**:
- Full masking with `[REDACTED_*]` tokens
- Partial masking (preserving first/last characters)
- Tracks all masking operations

**Output**: `MaskingResult` with sanitized text and masking map

### 3. Risk Scoring Engine (`scoring.ts`)

**Purpose**: Calculates risk score from 0-100

**Scoring Factors**:
- Injection patterns detected (0-60 points)
- Sensitive data types found (0-40 points)
- Input length
- Critical data (API keys, JWT tokens) get bonus points

**Severity Levels**:
- LOW: < 20
- MEDIUM: 20-39
- HIGH: 40-69
- CRITICAL: 70+

**Output**: `RiskScore` with breakdown and severity

### 4. Policy Engine (`policy.ts`)

**Purpose**: Makes decisions based on risk score

**Policy Rules**:
- Score ≥ 70 → **BLOCK** (request rejected)
- Score ≥ 30 → **SANITIZE** (mask data before processing)
- Score < 30 → **ALLOW** (process normally)

**Output**: `PolicyDecision` with action, matched rules, and reasoning

### 5. LLM Integration (`llm.js`)

**Purpose**: Handles secure communication with actual LLMs via dynamic routing.

**Features**:
- **Primary Route**: Serverless cloud inference via Hugging Face Router (Gemma 4 31B)
- **Fallback Route**: Local CPU execution via Ollama (gemma4:latest) for offline reliability
- Intelligent retry logic for rate limits (HTTP 429)
- Handles "Wait for Model" cold starts

**Output**: Generated text response from the active model.

### 6. Output Guard (`outputGuard.ts`)

**Purpose**: Scans LLM output for data leaks

**Checks For**:
- System prompt leaks
- Credential exposure
- PII in responses
- Sensitive patterns

**Actions**:
- Masks detected leaks
- Generates safety report
- Status: SAFE | SANITIZED | UNSAFE

**Output**: `OutputGuardResult` with safe output and report

### 7. PromptShield Core Orchestrator (`promptShield.ts`)

**Purpose**: Integrates all engines into one pipeline

**Process Flow**:
1. Detect threats in input
2. Calculate risk score
3. Apply policy rules
4. Mask sensitive data
5. Call LLM (if allowed)
6. Guard output
7. Return comprehensive response

**Output**: `PromptShieldResponse` with full security analysis

## Usage Example

```javascript
// Making a secure request from your frontend to the PromptShield API
const response = await fetch('/api/secure-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "My API key is sk-12345, can you help?" })
});

const data = await response.json();

console.log(data.action); // "BLOCK"
console.log(data.riskScore); // 85
console.log(data.maskedInput); // "My API key is [REDACTED_API_KEY], can you help?"
```

## Test Prompts

The system includes 12 pre-configured test cases:

- ✅ Safe queries
- 🚨 Injection attacks
- ⚠️ PII exposure
- 🔴 Credential leaks

## Security Features

1. **Multi-layer Protection**: 6 independent security engines
2. **Real-time Analysis**: Instant threat detection (< 1s)
3. **Zero-trust**: All inputs treated as potentially malicious
4. **Comprehensive Logging**: Full audit trail of decisions
5. **Customizable Policies**: Easily adjust thresholds


## Production Architecture

The system is currently equipped with production-grade features:
1. **MongoDB Atlas Logging**: Full forensic audit trails of every request, score, and latency metric.
2. **Express.js API**: Standalone backend service separating frontend state from security logic.

**Next Steps for Enterprise Scaling**:
1. Implement IP-based rate limiting
2. Add API key authentication/authorization

## Performance

- Average processing time: 10-50ms (excluding LLM call)
- Detection accuracy: High (regex + pattern matching)
- False positive rate: Low with tuned thresholds

## Extensibility

Add custom patterns:
- Edit `INJECTION_PATTERNS` in `detection.ts`
- Add new sensitive data types in `SENSITIVE_PATTERNS`
- Modify risk scoring weights in `scoring.ts`
- Adjust policy thresholds in `policy.ts`

## License

Built for educational and demonstration purposes.
