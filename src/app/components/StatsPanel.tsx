// src/app/components/StatsPanel.tsx
// Statistics Panel Component
import { Activity, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';

interface StatsData {
  totalRequests: number;
  blockedRequests: number;
  sanitizedRequests: number;
  allowedRequests: number;
}

interface StatsPanelProps {
  stats: StatsData;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const blockRate =
    stats.totalRequests > 0
      ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-white/90 backdrop-blur border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">Total Requests</p>
            <p className="text-2xl font-bold mt-1">{stats.totalRequests}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-600 opacity-80" />
        </div>
      </Card>

      <Card className="p-4 bg-red-50/90 backdrop-blur border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-red-800 font-medium">Blocked</p>
            <p className="text-2xl font-bold mt-1 text-red-700">{stats.blockedRequests}</p>
          </div>
          <Shield className="w-8 h-8 text-red-600 opacity-80" />
        </div>
      </Card>

      <Card className="p-4 bg-yellow-50/90 backdrop-blur border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-yellow-800 font-medium">Sanitized</p>
            <p className="text-2xl font-bold mt-1 text-yellow-700">{stats.sanitizedRequests}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-80" />
        </div>
      </Card>

      <Card className="p-4 bg-green-50/90 backdrop-blur border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-green-800 font-medium">Allowed</p>
            <p className="text-2xl font-bold mt-1 text-green-700">{stats.allowedRequests}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
        </div>
      </Card>
    </div>
  );
}

export type { StatsData };
