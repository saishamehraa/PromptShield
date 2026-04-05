// src/app/engines/scoring.ts
// Risk Scoring Engine - Phase 3
// Calculates risk score from 0-100 based on detected threats

import { DetectionResult } from './detection';

export interface RiskScore {
  totalScore: number;
  injectionScore: number;
  sensitiveDataScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
}

export function calculateRiskScore(detection: DetectionResult, inputLength: number): RiskScore {
  let injectionScore = 0;
  let sensitiveDataScore = 0;
  const factors: string[] = [];

  // Calculate Injection Score (0-100 points)
  if (detection.isInjectionDetected) {
    // Start much higher. Any injection attempt is extremely high risk.
    const baseInjectionScore = 65; 
    const patternCount = detection.injectionPatterns.length;
    
    // Add 10 points per pattern. 
    // Even 1 pattern (65 + 10 = 75) will now trigger a BLOCK.
    injectionScore = Math.min(100, baseInjectionScore + (patternCount * 10));
    factors.push(`${patternCount} injection pattern(s) detected`);
  }

  // Calculate Sensitive Data Score (0-40 points)
  if (detection.isSensitiveDataDetected) {
    const baseDataScore = 20;
    const typeCount = detection.sensitiveDataTypes.length;
    const itemCount = detection.detectedItems.filter(
      (item) => item.type !== 'Prompt Injection'
    ).length;
    sensitiveDataScore = Math.min(40, baseDataScore + typeCount * 5 + itemCount * 3);
    factors.push(`${typeCount} type(s) of sensitive data found`);
  }

  // Additional risk factors
  if (inputLength > 500) {
    injectionScore += 5;
    factors.push('Unusually long input');
  }

  if (detection.detectedItems.some((item) => item.type === 'API Key')) {
    sensitiveDataScore += 10;
    factors.push('API key exposure - critical risk');
  }

  if (detection.detectedItems.some((item) => item.type === 'JWT Token')) {
    sensitiveDataScore += 10;
    factors.push('Authentication token exposed');
  }

  const totalScore = Math.min(100, injectionScore + sensitiveDataScore);

  // Determine severity
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (totalScore >= 70) {
    severity = 'CRITICAL';
  } else if (totalScore >= 40) {
    severity = 'HIGH';
  } else if (totalScore >= 20) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  return {
    totalScore,
    injectionScore,
    sensitiveDataScore,
    severity,
    factors,
  };
}
