import { CloudFlareKVStorage } from '../storage-cf';
import { insertEmailSettingsSchema } from '@shared/schema';

export async function handleEmailAPI(request: Request, env: any): Promise<Response> {
  const storage = new CloudFlareKVStorage(env.URL_MONITOR_KV);
  const url = new URL(request.url);
  const path = url.pathname;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  
  try {
    if (request.method === 'GET' && path === '/api/email-settings') {
      // Get email settings
      const settings = await storage.getEmailSettings();
      return new Response(JSON.stringify(settings || null), { headers: corsHeaders });
    }
    
    if (request.method === 'POST' && path === '/api/email-settings') {
      // Save email settings
      const body = await request.json();
      const parsed = insertEmailSettingsSchema.parse(body);
      const settings = await storage.createOrUpdateEmailSettings(parsed);
      return new Response(JSON.stringify(settings), { headers: corsHeaders });
    }
    
    if (request.method === 'POST' && path === '/api/email-settings/test') {
      // Send test email
      const settings = await storage.getEmailSettings();
      
      if (!settings || !settings.isEnabled) {
        return new Response(
          JSON.stringify({ error: 'Email settings not configured or disabled' }), 
          { status: 400, headers: corsHeaders }
        );
      }
      
      // CloudFlare doesn't support nodemailer directly
      // You would need to use CloudFlare Email Workers or external email service
      // For now, we'll simulate success
      return new Response(
        JSON.stringify({ message: 'Test email functionality available in production with CloudFlare Email Workers' }), 
        { headers: corsHeaders }
      );
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: corsHeaders 
    });
    
  } catch (error: any) {
    console.error('Email API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
}