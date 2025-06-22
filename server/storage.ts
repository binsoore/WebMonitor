import type { User, InsertUser, MonitoredUrl, InsertMonitoredUrl, ErrorLog, InsertErrorLog, EmailSettings, InsertEmailSettings } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

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

interface StorageData {
  users: Map<number, User>;
  monitoredUrls: Map<number, MonitoredUrl>;
  errorLogs: Map<number, ErrorLog>;
  emailSettings: EmailSettings | undefined;
  counters: {
    userId: number;
    urlId: number;
    errorLogId: number;
    emailSettingsId: number;
  };
}

export class FileStorage implements IStorage {
  private dataPath: string;
  private data: StorageData;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'storage.json');
    this.data = {
      users: new Map(),
      monitoredUrls: new Map(),
      errorLogs: new Map(),
      emailSettings: undefined,
      counters: {
        userId: 1,
        urlId: 1,
        errorLogId: 1,
        emailSettingsId: 1,
      },
    };
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      this.data.users = new Map(jsonData.users || []);
      this.data.monitoredUrls = new Map(jsonData.monitoredUrls || []);
      this.data.errorLogs = new Map(jsonData.errorLogs || []);
      this.data.emailSettings = jsonData.emailSettings;
      this.data.counters = jsonData.counters || {
        userId: 1,
        urlId: 1,
        errorLogId: 1,
        emailSettingsId: 1,
      };
      
      console.log('Settings loaded from file:', {
        urls: this.data.monitoredUrls.size,
        errorLogs: this.data.errorLogs.size,
        hasEmailSettings: !!this.data.emailSettings
      });
    } catch (error) {
      console.log('Starting with empty settings');
    }
  }

  private async saveData(): Promise<void> {
    try {
      const jsonData = {
        users: Array.from(this.data.users.entries()),
        monitoredUrls: Array.from(this.data.monitoredUrls.entries()),
        errorLogs: Array.from(this.data.errorLogs.entries()),
        emailSettings: this.data.emailSettings,
        counters: this.data.counters,
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const usersArray = Array.from(this.data.users.values());
    return usersArray.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.data.counters.userId++;
    const user: User = { ...insertUser, id };
    this.data.users.set(id, user);
    await this.saveData();
    return user;
  }

  async getMonitoredUrls(): Promise<MonitoredUrl[]> {
    return Array.from(this.data.monitoredUrls.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getMonitoredUrl(id: number): Promise<MonitoredUrl | undefined> {
    return this.data.monitoredUrls.get(id);
  }

  async createMonitoredUrl(insertUrl: InsertMonitoredUrl): Promise<MonitoredUrl> {
    const id = this.data.counters.urlId++;
    const url: MonitoredUrl = {
      id,
      name: insertUrl.name,
      status: 'pending',
      url: insertUrl.url,
      checkInterval: insertUrl.checkInterval || 5,
      isActive: true,
      responseTime: null,
      lastCheck: null,
      uptime: 100,
      totalChecks: 0,
      successfulChecks: 0,
      createdAt: new Date(),
    };
    this.data.monitoredUrls.set(id, url);
    await this.saveData();
    return url;
  }

  async updateMonitoredUrl(id: number, updates: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined> {
    const url = this.data.monitoredUrls.get(id);
    if (!url) return undefined;

    const updatedUrl = { ...url, ...updates };
    this.data.monitoredUrls.set(id, updatedUrl);
    await this.saveData();
    return updatedUrl;
  }

  async deleteMonitoredUrl(id: number): Promise<boolean> {
    const deleted = this.data.monitoredUrls.delete(id);
    if (deleted) {
      await this.saveData();
    }
    return deleted;
  }

  async getErrorLogs(limit = 50): Promise<ErrorLog[]> {
    const logs = Array.from(this.data.errorLogs.values())
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
    return logs;
  }

  async createErrorLog(insertLog: InsertErrorLog): Promise<ErrorLog> {
    const id = this.data.counters.errorLogId++;
    const log: ErrorLog = {
      id,
      url: insertLog.url || '',
      urlId: insertLog.urlId || null,
      errorType: insertLog.errorType,
      errorMessage: insertLog.errorMessage || '',
      statusCode: insertLog.statusCode || null,
      timestamp: new Date(),
    };
    this.data.errorLogs.set(id, log);
    await this.saveData();
    return log;
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    return this.data.emailSettings;
  }

  async createOrUpdateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const emailSettings: EmailSettings = {
      id: this.data.emailSettings?.id || this.data.counters.emailSettingsId++,
      username: settings.username || null,
      password: settings.password || null,
      smtpServer: settings.smtpServer,
      smtpPort: settings.smtpPort,
      fromEmail: settings.fromEmail,
      toEmails: settings.toEmails,
      isEnabled: settings.isEnabled || false,
      lastTest: this.data.emailSettings?.lastTest || null,
    };
    this.data.emailSettings = emailSettings;
    await this.saveData();
    return emailSettings;
  }
}

// Use file storage for persistence across app restarts
export const storage = new FileStorage();