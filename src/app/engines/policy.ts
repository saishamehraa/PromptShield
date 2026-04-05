// src/app/engines/policy.ts
// Policy Engine - Phase 3
// Makes decisions based on risk score

import { RiskScore } from './scoring';

export type PolicyAction = 'ALLOW' | 'SANITIZE' | 'BLOCK';

export interface PolicyDecision {
  action: PolicyAction;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchedRules: string[];
  reasoning: string;
  canProceed: boolean;
}

export function applyPolicy(riskScore: RiskScore): PolicyDecision {
  const matchedRules: string[] = [];
  let action: PolicyAction;
  let reasoning: string;

  // Policy Rules
  if (riskScore.totalScore >= 70) {
    action = 'BLOCK';
    matchedRules.push('RULE_001: Block requests with risk score >= 70');
    reasoning = `Critical risk detected (score: ${riskScore.totalScore}). Request blocked to prevent security breach.`;
  } else if (riskScore.totalScore >= 40) {
    action = 'SANITIZE';
    matchedRules.push('RULE_002: Sanitize requests with risk score >= 40');
    reasoning = `High risk detected (score: ${riskScore.totalScore}). Sensitive data will be masked before processing.`;
  } else {
    action = 'ALLOW';
    matchedRules.push('RULE_003: Allow requests with risk score < 40');
    reasoning = `Low risk detected (score: ${riskScore.totalScore}). Request can proceed normally.`;
  }

  // Additional rule checks
  if (riskScore.injectionScore >= 40) {
    matchedRules.push('RULE_004: Prompt injection detected');
  }

  if (riskScore.sensitiveDataScore >= 30) {
    matchedRules.push('RULE_005: Multiple sensitive data types detected');
  }

  if (riskScore.factors.some((f) => f.includes('API key'))) {
    matchedRules.push('RULE_006: API key exposure - elevated threat');
  }

  return {
    action,
    severity: riskScore.severity,
    matchedRules,
    reasoning,
    canProceed: action !== 'BLOCK',
  };
}
