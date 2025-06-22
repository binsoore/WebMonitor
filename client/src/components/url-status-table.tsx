import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { List, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MonitoredUrl } from "@shared/schema";

export default function UrlStatusTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: urls, isLoading } = useQuery({
    queryKey: ["/api/urls"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const deleteUrlMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/urls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "URL removed from monitoring",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove URL",
        variant: "destructive",
      });
    },
  });

  const checkUrlMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/urls/${id}/check`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Check completed",
        description: "URL status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check URL",
        variant: "destructive",
      });
    },
  });

  const formatLastCheck = (lastCheck: string | null) => {
    if (!lastCheck) return "Never";
    const diff = Date.now() - new Date(lastCheck).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} min ago`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "online") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
    } else if (status === "offline") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="text-slate-600 mr-2 w-5 h-5" />
            Monitored URLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <List className="text-slate-600 mr-2 w-5 h-5" />
          Monitored URLs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No URLs being monitored. Add one above to get started.
                  </TableCell>
                </TableRow>
              ) : (
                urls?.map((url: MonitoredUrl) => (
                  <TableRow key={url.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      {getStatusBadge(url.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{url.url}</div>
                        <div className="text-sm text-slate-500">{url.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">
                      {url.responseTime ? `${Math.round(url.responseTime)}ms` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatLastCheck(url.lastCheck?.toString() || null)}
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm font-medium ${
                        (url.uptime || 0) >= 99 ? "text-green-700" : 
                        (url.uptime || 0) >= 95 ? "text-yellow-700" : "text-red-700"
                      }`}>
                        {url.uptime ? `${url.uptime.toFixed(1)}%` : "0%"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkUrlMutation.mutate(url.id)}
                          disabled={checkUrlMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 ${checkUrlMutation.isPending ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUrlMutation.mutate(url.id)}
                          disabled={deleteUrlMutation.isPending}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
