import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const monitoredUrls = pgTable("monitored_urls", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  checkInterval: integer("check_interval").notNull().default(5), // minutes
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("unknown"), // online, offline, unknown
  responseTime: real("response_time"), // milliseconds
  lastCheck: timestamp("last_check"),
  uptime: real("uptime").default(0), // percentage
  totalChecks: integer("total_checks").default(0),
  successfulChecks: integer("successful_checks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  urlId: integer("url_id").references(() => monitoredUrls.id),
  url: text("url").notNull(),
  errorType: text("error_type").notNull(), // timeout, http_error, connection_error
  errorMessage: text("error_message").notNull(),
  statusCode: integer("status_code"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  smtpServer: text("smtp_server").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  fromEmail: text("from_email").notNull(),
  toEmails: text("to_emails").notNull(), // comma-separated
  username: text("username"),
  password: text("password"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastTest: timestamp("last_test"),
});

export const insertMonitoredUrlSchema = createInsertSchema(monitoredUrls).omit({
  id: true,
  status: true,
  responseTime: true,
  lastCheck: true,
  uptime: true,
  totalChecks: true,
  successfulChecks: true,
  createdAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  timestamp: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  lastTest: true,
});

export type InsertMonitoredUrl = z.infer<typeof insertMonitoredUrlSchema>;
export type MonitoredUrl = typeof monitoredUrls.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
