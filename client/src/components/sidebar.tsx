import { HeartPulse, BarChart3, Settings, FileText } from "lucide-react";
import QuickStats from "./quick-stats";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: "dashboard" | "settings" | "logs") => void;
  stats?: any;
  statsLoading: boolean;
}

export default function Sidebar({ activeSection, onSectionChange, stats, statsLoading }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <HeartPulse className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">URL Monitor</h1>
            <p className="text-sm text-slate-500">Status Dashboard</p>
          </div>
        </div>

        <QuickStats stats={stats} loading={statsLoading} />

        <nav className="space-y-2">
          <button
            onClick={() => onSectionChange("dashboard")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => onSectionChange("settings")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "settings"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Email Settings</span>
          </button>
          
          <button
            onClick={() => onSectionChange("logs")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "logs"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Error Logs</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
