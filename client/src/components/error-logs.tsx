import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ErrorLog } from "@shared/schema";

export default function ErrorLogs() {
  const { data: errors, isLoading } = useQuery({
    queryKey: ["/api/errors"],
    refetchInterval: 60000, // Refresh every minute
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getErrorTypeBadge = (errorType: string) => {
    const variants: Record<string, string> = {
      timeout: "bg-red-100 text-red-800 border-red-200",
      http_error: "bg-red-100 text-red-800 border-red-200",
      connection_error: "bg-orange-100 text-orange-800 border-orange-200",
      EMAIL_TEST_SUCCESS: "bg-green-100 text-green-800 border-green-200",
      EMAIL_TEST_FAILED: "bg-red-100 text-red-800 border-red-200",
      EMAIL_ALERT_SUCCESS: "bg-blue-100 text-blue-800 border-blue-200",
      EMAIL_ALERT_FAILED: "bg-red-100 text-red-800 border-red-200",
      EMAIL_RECOVERY_SUCCESS: "bg-green-100 text-green-800 border-green-200",
      EMAIL_RECOVERY_FAILED: "bg-red-100 text-red-800 border-red-200",
    };

    const className = variants[errorType] || "bg-gray-100 text-gray-800 border-gray-200";
    
    return (
      <Badge className={className}>
        {errorType.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="text-red-600 mr-2 w-5 h-5" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="text-red-600 mr-2 w-5 h-5" />
          최근 시스템 로그
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errors?.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No errors recorded yet. This is good news!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {errors?.map((error: ErrorLog) => (
              <div
                key={error.id}
                className={`border-l-4 p-4 rounded-r-lg ${
                  error.errorType === "timeout" 
                    ? "border-red-500 bg-red-50" 
                    : error.errorType === "http_error"
                    ? "border-red-500 bg-red-50"
                    : "border-orange-500 bg-orange-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      error.errorType === "timeout" || error.errorType === "http_error" 
                        ? "text-red-800" 
                        : "text-orange-800"
                    }`}>
                      {error.url}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      error.errorType === "timeout" || error.errorType === "http_error" 
                        ? "text-red-700" 
                        : "text-orange-700"
                    }`}>
                      {error.errorMessage}
                      {error.statusCode && ` (Status: ${error.statusCode})`}
                    </p>
                    <p className={`text-xs mt-2 ${
                      error.errorType === "timeout" || error.errorType === "http_error" 
                        ? "text-red-600" 
                        : "text-orange-600"
                    }`}>
                      {formatTimestamp(error.timestamp?.toString() || "")}
                    </p>
                  </div>
                  <div className="ml-4">
                    {getErrorTypeBadge(error.errorType)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
