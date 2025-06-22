import { CheckCircle, AlertTriangle, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickStatsProps {
  stats?: {
    online: number;
    offline: number;
    total: number;
  };
  loading: boolean;
}

export default function QuickStats({ stats, loading }: QuickStatsProps) {
  if (loading) {
    return (
      <div className="space-y-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-200">
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Online</p>
            <p className="text-2xl font-bold text-green-900">{stats?.online || 0}</p>
          </div>
          <CheckCircle className="text-green-600 text-xl w-6 h-6" />
        </div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Offline</p>
            <p className="text-2xl font-bold text-red-900">{stats?.offline || 0}</p>
          </div>
          <AlertTriangle className="text-red-600 text-xl w-6 h-6" />
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total URLs</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
          </div>
          <Globe className="text-slate-600 text-xl w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
