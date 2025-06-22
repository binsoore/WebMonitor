import axios from "axios";
import { storage } from "../storage";
import { emailService } from "./emailService";

interface CheckResult {
  isOnline: boolean;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  errorType?: string;
}

export class UrlChecker {
  private checkingInProgress = new Set<number>();

  async checkUrl(url: string, timeout = 30000): Promise<CheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout,
        validateStatus: (status) => status < 500, // Accept 4xx as online but log as warning
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status >= 400) {
        return {
          isOnline: false,
          responseTime,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          errorType: "http_error",
        };
      }
      
      return {
        isOnline: true,
        responseTime,
        statusCode: response.status,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === "ECONNABORTED") {
        return {
          isOnline: false,
          responseTime,
          error: `Connection timeout after ${timeout}ms`,
          errorType: "timeout",
        };
      }
      
      return {
        isOnline: false,
        responseTime,
        error: error.message || "Connection failed",
        errorType: "connection_error",
      };
    }
  }

  async checkMonitoredUrl(urlId: number): Promise<void> {
    if (this.checkingInProgress.has(urlId)) {
      return; // Already checking this URL
    }

    this.checkingInProgress.add(urlId);

    try {
      const monitoredUrl = await storage.getMonitoredUrl(urlId);
      if (!monitoredUrl || !monitoredUrl.isActive) {
        return;
      }

      const result = await this.checkUrl(monitoredUrl.url);
      const now = new Date();

      // Update statistics
      const totalChecks = (monitoredUrl.totalChecks || 0) + 1;
      const successfulChecks = (monitoredUrl.successfulChecks || 0) + (result.isOnline ? 1 : 0);
      const uptime = (successfulChecks / totalChecks) * 100;

      // Check if status changed
      const statusChanged = monitoredUrl.status !== (result.isOnline ? "online" : "offline");
      
      await storage.updateMonitoredUrl(urlId, {
        status: result.isOnline ? "online" : "offline",
        responseTime: result.responseTime || null,
        lastCheck: now,
        totalChecks,
        successfulChecks,
        uptime,
      });

      // Log error if URL is down
      if (!result.isOnline) {
        await storage.createErrorLog({
          urlId,
          url: monitoredUrl.url,
          errorType: result.errorType || "unknown",
          errorMessage: result.error || "Unknown error",
          statusCode: result.statusCode || null,
        });

        // Send email notification if status changed to offline
        if (statusChanged) {
          await emailService.sendDowntimeAlert(monitoredUrl, result);
        }
      } else if (statusChanged && monitoredUrl.status === "offline") {
        // Send recovery notification
        await emailService.sendRecoveryAlert(monitoredUrl, result);
      }
    } finally {
      this.checkingInProgress.delete(urlId);
    }
  }

  async checkAllUrls(): Promise<void> {
    const urls = await storage.getMonitoredUrls();
    const promises = urls
      .filter(url => url.isActive)
      .map(url => this.checkMonitoredUrl(url.id));
    
    await Promise.allSettled(promises);
  }
}

export const urlChecker = new UrlChecker();
