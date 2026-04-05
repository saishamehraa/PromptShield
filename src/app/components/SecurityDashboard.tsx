// src/app/components/SecurityDashboard.tsx
// Security Dashboard Component
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { PromptShieldResponse } from '../engines/promptShield';

interface SecurityDashboardProps {
  response: PromptShieldResponse | null;
}

export function SecurityDashboard({ response }: SecurityDashboardProps) {
  if (!response) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur border-gray-200">
        <div className="text-center text-gray-500">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Send a message to see security analysis</p>
        </div>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ALLOW':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'SANITIZE':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'BLOCK':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Score Card */}
      <Card className="p-6 bg-white/90 backdrop-blur border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Risk Assessment
          </h3>
          <Badge className={getSeverityColor(response.severity)}>
            {response.severity}
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Risk Score</span>
              <span className="text-2xl font-bold">{response.riskScore}/100</span>
            </div>
            <Progress value={response.riskScore} className="h-3" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            {getActionIcon(response.action)}
            <div className="flex-1">
              <p className="font-medium text-sm">Action: {response.action}</p>
              <p className="text-xs text-gray-600">{response.reasoning}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detection Details */}
      <Card className="p-6 bg-white/90 backdrop-blur border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Detection Details</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded bg-gray-50">
            <span className="text-sm font-medium">Injection Detected</span>
            <Badge variant={response.detection.isInjectionDetected ? 'destructive' : 'default'}>
              {response.detection.isInjectionDetected ? 'YES' : 'NO'}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 rounded bg-gray-50">
            <span className="text-sm font-medium">Sensitive Data Detected</span>
            <Badge variant={response.detection.isSensitiveDataDetected ? 'destructive' : 'default'}>
              {response.detection.isSensitiveDataDetected ? 'YES' : 'NO'}
            </Badge>
          </div>

          {response.detection.injectionPatterns.length > 0 && (
            <div className="p-3 rounded bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-2">
                Injection Patterns Found:
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {response.detection.injectionPatterns.map((pattern, idx) => (
                  <li key={idx} className="truncate">• {pattern}</li>
                ))}
              </ul>
            </div>
          )}

          {response.detection.sensitiveDataTypes.length > 0 && (
            <div className="p-3 rounded bg-yellow-50 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-800 mb-2">
                Sensitive Data Types:
              </p>
              <div className="flex flex-wrap gap-2">
                {response.detection.sensitiveDataTypes.map((type, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Matched Rules */}
      <Card className="p-6 bg-white/90 backdrop-blur border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Policy Rules Matched</h3>
        <div className="space-y-2">
          {response.matchedRules.map((rule, idx) => (
            <div key={idx} className="text-sm p-2 rounded bg-gray-50 font-mono">
              {rule}
            </div>
          ))}
        </div>
      </Card>

      {/* Processing Time */}
      <Card className="p-4 bg-white/90 backdrop-blur border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            Processing Time
          </div>
          <span className="font-semibold">{response.processingTimeMs}ms</span>
        </div>
      </Card>
    </div>
  );
}
