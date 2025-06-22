import { 
  type User, 
  type InsertUser,
  type MonitoredUrl,
  type InsertMonitoredUrl,
  type ErrorLog,
  type InsertErrorLog,
  type EmailSettings,
  type InsertEmailSettings
} from "@shared/schema";

// CloudFlare compatible storage using KV or D1
export interface ICloudFlareStorage {
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

export class CloudFlareKVStorage implements ICloudFlareStorage {
  private kv: KVNamespace;
  
  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getUser(id: number): Promise<User | undefined> {
    const user = await this.kv.get(`user:${id}`, 'json');
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const usersList = await this.kv.list({ prefix: 'user:' });
    for (const key of usersList.keys) {
      const user = await this.kv.get(key.name, 'json') as User;
      if (user && user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Date.now(); // Simple ID generation
    const user: User = { ...insertUser, id };
    await this.kv.put(`user:${id}`, JSON.stringify(user));
    return user;
  }

  async getMonitoredUrls(): Promise<MonitoredUrl[]> {
    const urlsList = await this.kv.list({ prefix: 'url:' });
    const urls: MonitoredUrl[] = [];
    
    for (const key of urlsList.keys) {
      const url = await this.kv.get(key.name, 'json') as MonitoredUrl;
      if (url) urls.push(url);
    }
    
    return urls.sort((a, b) => a.id - b.id);
  }

  async getMonitoredUrl(id: number): Promise<MonitoredUrl | undefined> {
    const url = await this.kv.get(`url:${id}`, 'json');
    return url as MonitoredUrl | undefined;
  }

  async createMonitoredUrl(insertUrl: InsertMonitoredUrl): Promise<MonitoredUrl> {
    const id = Date.now(); // Simple ID generation
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
    
    await this.kv.put(`url:${id}`, JSON.stringify(url));
    return url;
  }

  async updateMonitoredUrl(id: number, updates: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined> {
    const existing = await this.getMonitoredUrl(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    await this.kv.put(`url:${id}`, JSON.stringify(updated));
    return updated;
  }

  async deleteMonitoredUrl(id: number): Promise<boolean> {
    await this.kv.delete(`url:${id}`);
    return true;
  }

  async getErrorLogs(limit = 50): Promise<ErrorLog[]> {
    const logsList = await this.kv.list({ prefix: 'error:' });
    const logs: ErrorLog[] = [];
    
    for (const key of logsList.keys) {
      const log = await this.kv.get(key.name, 'json') as ErrorLog;
      if (log) logs.push(log);
    }
    
    return logs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createErrorLog(insertLog: InsertErrorLog): Promise<ErrorLog> {
    const id = Date.now(); // Simple ID generation
    const log: ErrorLog = {
      id,
      url: insertLog.url,
      urlId: insertLog.urlId ?? null,
      errorType: insertLog.errorType,
      errorMessage: insertLog.errorMessage,
      statusCode: insertLog.statusCode ?? null,
      timestamp: new Date(),
    };
    
    await this.kv.put(`error:${id}`, JSON.stringify(log));
    return log;
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const settings = await this.kv.get('email-settings', 'json');
    return settings as EmailSettings | undefined;
  }

  async createOrUpdateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    const emailSettings: EmailSettings = {
      id: existing?.id || Date.now(),
      smtpServer: settings.smtpServer,
      smtpPort: settings.smtpPort,
      fromEmail: settings.fromEmail,
      toEmails: settings.toEmails,
      username: settings.username ?? null,
      password: settings.password ?? null,
      isEnabled: settings.isEnabled ?? true,
      lastTest: null,
    };
    
    await this.kv.put('email-settings', JSON.stringify(emailSettings));
    return emailSettings;
  }
}