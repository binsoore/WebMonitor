import type { Express } from "express";
import { createServer, type Server } from "http";
import cron from "node-cron";
import { storage } from "./storage";
import { urlChecker } from "./services/urlChecker";
import { emailService } from "./services/emailService";
import { 
  insertMonitoredUrlSchema, 
  insertEmailSettingsSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all monitored URLs
  app.get("/api/urls", async (req, res) => {
    try {
      const urls = await storage.getMonitoredUrls();
      res.json(urls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch URLs" });
    }
  });

  // Add new URL to monitor
  app.post("/api/urls", async (req, res) => {
    try {
      const parsed = insertMonitoredUrlSchema.parse(req.body);
      const url = await storage.createMonitoredUrl(parsed);
      
      // Perform initial check
      setTimeout(() => urlChecker.checkMonitoredUrl(url.id), 1000);
      
      res.json(url);
    } catch (error) {
      res.status(400).json({ message: "Invalid URL data" });
    }
  });

  // Update URL
  app.patch("/api/urls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const url = await storage.updateMonitoredUrl(id, updates);
      
      if (!url) {
        return res.status(404).json({ message: "URL not found" });
      }
      
      res.json(url);
    } catch (error) {
      res.status(400).json({ message: "Failed to update URL" });
    }
  });

  // Delete URL
  app.delete("/api/urls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMonitoredUrl(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "URL not found" });
      }
      
      res.json({ message: "URL deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete URL" });
    }
  });

  // Manually check a specific URL
  app.post("/api/urls/:id/check", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await urlChecker.checkMonitoredUrl(id);
      const url = await storage.getMonitoredUrl(id);
      
      if (!url) {
        return res.status(404).json({ message: "URL not found" });
      }
      
      res.json(url);
    } catch (error) {
      res.status(500).json({ message: "Failed to check URL" });
    }
  });

  // Get error logs
  app.get("/api/errors", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const errors = await storage.getErrorLogs(limit);
      res.json(errors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch error logs" });
    }
  });

  // Get email settings
  app.get("/api/email-settings", async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  // Update email settings
  app.post("/api/email-settings", async (req, res) => {
    try {
      const parsed = insertEmailSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateEmailSettings(parsed);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid email settings" });
    }
  });

  // Send test email
  app.post("/api/email-settings/test", async (req, res) => {
    try {
      const success = await emailService.sendTestEmail();
      
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(400).json({ message: "Failed to send test email. Check your settings." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Get dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const urls = await storage.getMonitoredUrls();
      const online = urls.filter(url => url.status === "online").length;
      const offline = urls.filter(url => url.status === "offline").length;
      const total = urls.length;
      
      // Get last check time
      const lastCheck = urls.reduce((latest, url) => {
        if (!url.lastCheck) return latest;
        return !latest || url.lastCheck > latest ? url.lastCheck : latest;
      }, null as Date | null);

      res.json({
        online,
        offline,
        total,
        lastCheck: lastCheck?.toISOString() || null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Setup periodic URL checking - every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running scheduled URL checks...");
    try {
      await urlChecker.checkAllUrls();
      console.log("Scheduled URL checks completed");
    } catch (error) {
      console.error("Error in scheduled URL checks:", error);
    }
  });

  // Also run checks more frequently for initial testing - every minute
  cron.schedule("* * * * *", async () => {
    try {
      await urlChecker.checkAllUrls();
    } catch (error) {
      console.error("Error in frequent URL checks:", error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
