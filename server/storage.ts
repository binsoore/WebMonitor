import { 
  users, 
  monitoredUrls, 
  errorLogs, 
  emailSettings,
  type User, 
  type InsertUser,
  type MonitoredUrl,
  type InsertMonitoredUrl,
  type ErrorLog,
  type InsertErrorLog,
  type EmailSettings,
  type InsertEmailSettings
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Monitored URLs
  getMonitoredUrls(): Promise<MonitoredUrl[]>;
  getMonitoredUrl(id: number): Promise<MonitoredUrl | undefined>;
  createMonitoredUrl(url: InsertMonitoredUrl): Promise<MonitoredUrl>;
  updateMonitoredUrl(id: number, updates: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined>;
  deleteMonitoredUrl(id: number): Promise<boolean>;
  
  // Error Logs
  getErrorLogs(limit?: number): Promise<ErrorLog[]>;
  createErrorLog(log: InsertErrorLog): Promise<ErrorLog>;
  
  // Email Settings
  getEmailSettings(): Promise<EmailSettings | undefined>;
  createOrUpdateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private monitoredUrlsMap: Map<number, MonitoredUrl>;
  private errorLogsMap: Map<number, ErrorLog>;
  private emailSettingsData: EmailSettings | undefined;
  private currentUserId: number;
  private currentUrlId: number;
  private currentErrorLogId: number;
  private currentEmailSettingsId: number;

  constructor() {
    this.users = new Map();
    this.monitoredUrlsMap = new Map();
    this.errorLogsMap = new Map();
    this.emailSettingsData = undefined;
    this.currentUserId = 1;
    this.currentUrlId = 1;
    this.currentErrorLogId = 1;
    this.currentEmailSettingsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMonitoredUrls(): Promise<MonitoredUrl[]> {
    return Array.from(this.monitoredUrlsMap.values());
  }

  async getMonitoredUrl(id: number): Promise<MonitoredUrl | undefined> {
    return this.monitoredUrlsMap.get(id);
  }

  async createMonitoredUrl(insertUrl: InsertMonitoredUrl): Promise<MonitoredUrl> {
    const id = this.currentUrlId++;
    const url: MonitoredUrl = {
      id,
      name: insertUrl.name,
      url: insertUrl.url,
      checkInterval: insertUrl.checkInterval ?? 5,
      isActive: insertUrl.isActive ?? true,
      status: "unknown",
      responseTime: null,
      lastCheck: null,
      uptime: 0,
      totalChecks: 0,
      successfulChecks: 0,
      createdAt: new Date(),
    };
    this.monitoredUrlsMap.set(id, url);
    return url;
  }

  async updateMonitoredUrl(id: number, updates: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined> {
    const existing = this.monitoredUrlsMap.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.monitoredUrlsMap.set(id, updated);
    return updated;
  }

  async deleteMonitoredUrl(id: number): Promise<boolean> {
    return this.monitoredUrlsMap.delete(id);
  }

  async getErrorLogs(limit = 50): Promise<ErrorLog[]> {
    const logs = Array.from(this.errorLogsMap.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return logs.slice(0, limit);
  }

  async createErrorLog(insertLog: InsertErrorLog): Promise<ErrorLog> {
    const id = this.currentErrorLogId++;
    const log: ErrorLog = {
      id,
      url: insertLog.url,
      urlId: insertLog.urlId ?? null,
      errorType: insertLog.errorType,
      errorMessage: insertLog.errorMessage,
      statusCode: insertLog.statusCode ?? null,
      timestamp: new Date(),
    };
    this.errorLogsMap.set(id, log);
    return log;
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    return this.emailSettingsData;
  }

  async createOrUpdateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const emailSettings: EmailSettings = {
      id: this.emailSettingsData?.id || this.currentEmailSettingsId++,
      smtpServer: settings.smtpServer,
      smtpPort: settings.smtpPort,
      fromEmail: settings.fromEmail,
      toEmails: settings.toEmails,
      username: settings.username ?? null,
      password: settings.password ?? null,
      isEnabled: settings.isEnabled ?? true,
      lastTest: null,
    };
    this.emailSettingsData = emailSettings;
    return emailSettings;
  }
}

export const storage = new MemStorage();
