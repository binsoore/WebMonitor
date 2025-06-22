import { useState } from "react";
import Sidebar from "@/components/sidebar";
import QuickStats from "@/components/quick-stats";
import UrlStatusTable from "@/components/url-status-table";
import AddUrlForm from "@/components/add-url-form";
import EmailSettingsForm from "@/components/email-settings-form";
import ErrorLogs from "@/components/error-logs";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type ActiveSection = "dashboard" | "settings" | "logs";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatLastCheck = (lastCheck: string | null) => {
    if (!lastCheck) return "Never";
    const diff = Date.now() - new Date(lastCheck).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} minutes ago`;
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        stats={stats}
        statsLoading={statsLoading}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {activeSection === "dashboard" && "URL Monitoring Dashboard"}
                {activeSection === "settings" && "Email Settings"}
                {activeSection === "logs" && "Error Logs"}
              </h2>
              <p className="text-slate-600 mt-1">
                {activeSection === "dashboard" && "Monitor your websites and get notified when they go down"}
                {activeSection === "settings" && "Configure email notifications for downtime alerts"}
                {activeSection === "logs" && "View recent errors and incidents"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!statsLoading && stats && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Last check: {formatLastCheck(stats.lastCheck)}</span>
                </div>
              )}
              {activeSection === "dashboard" && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <AddUrlForm />
              <UrlStatusTable />
            </div>
          )}
          
          {activeSection === "settings" && (
            <EmailSettingsForm />
          )}
          
          {activeSection === "logs" && (
            <ErrorLogs />
          )}
        </div>
      </div>
    </div>
  );
}
