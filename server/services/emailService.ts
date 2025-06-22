import nodemailer from "nodemailer";
import { storage } from "../storage";
import type { MonitoredUrl } from "@shared/schema";

interface CheckResult {
  isOnline: boolean;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  errorType?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async getTransporter(): Promise<nodemailer.Transporter | null> {
    const settings = await storage.getEmailSettings();
    
    if (!settings || !settings.isEnabled) {
      console.log('Email settings not found or disabled');
      return null;
    }

    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    console.log('Email settings:', {
      smtpServer: settings.smtpServer,
      smtpPort: settings.smtpPort,
      fromEmail: settings.fromEmail,
      toEmails: settings.toEmails,
      hasUsername: !!settings.username,
      hasPassword: !!settings.password,
      hasGmailAppPassword: !!gmailAppPassword,
      isEnabled: settings.isEnabled
    });
    
    // Always create new transporter to avoid cached connection issues
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service for better compatibility
      auth: settings.username && (gmailAppPassword || settings.password) ? {
        user: settings.username,
        pass: gmailAppPassword || settings.password,
      } : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });

    return this.transporter;
  }

  async sendDowntimeAlert(url: MonitoredUrl, checkResult: CheckResult): Promise<void> {
    const transporter = await this.getTransporter();
    const settings = await storage.getEmailSettings();
    
    if (!transporter || !settings) {
      return;
    }

    const recipients = settings.toEmails.split(',').map(email => email.trim());
    
    const subject = `🚨 Website Down Alert: ${url.name || url.url}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0 0 16px 0;">🚨 Website Down Alert</h2>
          <p style="margin: 0 0 12px 0;"><strong>URL:</strong> ${url.url}</p>
          <p style="margin: 0 0 12px 0;"><strong>Name:</strong> ${url.name || 'N/A'}</p>
          <p style="margin: 0 0 12px 0;"><strong>Error:</strong> ${checkResult.error || 'Unknown error'}</p>
          <p style="margin: 0 0 12px 0;"><strong>Status Code:</strong> ${checkResult.statusCode || 'N/A'}</p>
          <p style="margin: 0 0 12px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 0;"><strong>Current Uptime:</strong> ${url.uptime?.toFixed(1) || 0}%</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated alert from your URL monitoring system. 
          Please check the website and resolve any issues as soon as possible.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: settings.fromEmail,
        to: recipients,
        subject,
        html,
      });
      
      // Log successful downtime alert
      await storage.createErrorLog({
        urlId: url.id,
        error: null,
        errorType: 'EMAIL_ALERT_SUCCESS',
        statusCode: null,
        responseTime: null,
        details: `Downtime alert sent for ${url.name || url.url}`
      });
    } catch (error: any) {
      console.error('Failed to send downtime alert email:', error);
      
      // Log email alert failure
      await storage.createErrorLog({
        urlId: url.id,
        error: error.message || 'Failed to send downtime alert',
        errorType: 'EMAIL_ALERT_FAILED',
        statusCode: null,
        responseTime: null,
        details: `SMTP Error when alerting for ${url.name || url.url}: ${error.code || 'UNKNOWN'}`
      });
    }
  }

  async sendRecoveryAlert(url: MonitoredUrl, checkResult: CheckResult): Promise<void> {
    const transporter = await this.getTransporter();
    const settings = await storage.getEmailSettings();
    
    if (!transporter || !settings) {
      return;
    }

    const recipients = settings.toEmails.split(',').map(email => email.trim());
    
    const subject = `✅ Website Recovery: ${url.name || url.url}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin: 0 0 16px 0;">✅ Website Recovery</h2>
          <p style="margin: 0 0 12px 0;"><strong>URL:</strong> ${url.url}</p>
          <p style="margin: 0 0 12px 0;"><strong>Name:</strong> ${url.name || 'N/A'}</p>
          <p style="margin: 0 0 12px 0;"><strong>Response Time:</strong> ${checkResult.responseTime || 'N/A'}ms</p>
          <p style="margin: 0 0 12px 0;"><strong>Status Code:</strong> ${checkResult.statusCode || 'N/A'}</p>
          <p style="margin: 0 0 12px 0;"><strong>Recovery Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 0;"><strong>Current Uptime:</strong> ${url.uptime?.toFixed(1) || 0}%</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Your website is now back online and responding normally.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: settings.fromEmail,
        to: recipients,
        subject,
        html,
      });
      
      // Log successful recovery alert
      await storage.createErrorLog({
        urlId: url.id,
        error: null,
        errorType: 'EMAIL_RECOVERY_SUCCESS',
        statusCode: null,
        responseTime: null,
        details: `Recovery alert sent for ${url.name || url.url}`
      });
    } catch (error: any) {
      console.error('Failed to send recovery alert email:', error);
      
      // Log email recovery alert failure
      await storage.createErrorLog({
        urlId: url.id,
        error: error.message || 'Failed to send recovery alert',
        errorType: 'EMAIL_RECOVERY_FAILED',
        statusCode: null,
        responseTime: null,
        details: `SMTP Error when sending recovery alert for ${url.name || url.url}: ${error.code || 'UNKNOWN'}`
      });
    }
  }

  async sendTestEmail(): Promise<boolean> {
    const transporter = await this.getTransporter();
    const settings = await storage.getEmailSettings();
    
    if (!transporter || !settings) {
      return false;
    }

    const recipients = settings.toEmails.split(',').map(email => email.trim());
    
    const subject = `Test Email from URL Monitor`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px;">
          <h2 style="color: #2563eb; margin: 0 0 16px 0;">📧 Test Email</h2>
          <p>This is a test email from your URL monitoring system.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #16a34a; font-weight: bold;">✅ Email configuration is working correctly!</p>
        </div>
      </div>
    `;

    try {
      console.log('Attempting to send test email...');
      console.log('From:', settings.fromEmail);
      console.log('To:', recipients);
      
      const result = await transporter.sendMail({
        from: settings.fromEmail,
        to: recipients,
        subject,
        html,
      });
      
      console.log('Email sent successfully:', result.messageId);
      
      // Log successful email test
      await storage.createErrorLog({
        urlId: null,
        error: null,
        errorType: 'EMAIL_TEST_SUCCESS',
        statusCode: null,
        responseTime: null,
        details: `Test email sent successfully to ${recipients.join(', ')}`
      });
      
      // Update last test time
      await storage.createOrUpdateEmailSettings({
        ...settings,
        lastTest: new Date(),
      });
      
      return true;
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      
      // Log email error
      await storage.createErrorLog({
        urlId: null,
        error: error.message || 'Failed to send test email',
        errorType: 'EMAIL_TEST_FAILED',
        statusCode: null,
        responseTime: null,
        details: `SMTP Error: ${error.code || 'UNKNOWN'} - ${error.command || 'N/A'}`
      });
      
      throw error;
    }
  }
}

export const emailService = new EmailService();
