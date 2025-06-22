import { CloudFlareKVStorage } from '../storage-cf';
import { insertMonitoredUrlSchema } from '@shared/schema';

export async function handleUrlsAPI(request: Request, env: any): Promise<Response> {
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
    if (request.method === 'GET' && path === '/api/urls') {
      // Get all URLs
      const urls = await storage.getMonitoredUrls();
      return new Response(JSON.stringify(urls), { headers: corsHeaders });
    }
    
    if (request.method === 'POST' && path === '/api/urls') {
      // Add new URL
      const body = await request.json();
      const parsed = insertMonitoredUrlSchema.parse(body);
      const newUrl = await storage.createMonitoredUrl(parsed);
      return new Response(JSON.stringify(newUrl), { headers: corsHeaders });
    }
    
    // Handle URL-specific operations (/:id/check, etc.)
    const urlMatch = path.match(/^\/api\/urls\/(\d+)(.*)$/);
    if (urlMatch) {
      const urlId = parseInt(urlMatch[1]);
      const action = urlMatch[2];
      
      if (request.method === 'POST' && action === '/check') {
        // Manual URL check
        const monitoredUrl = await storage.getMonitoredUrl(urlId);
        if (!monitoredUrl) {
          return new Response(JSON.stringify({ error: 'URL not found' }), { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        
        // Perform check (simplified for CloudFlare)
        try {
          const response = await fetch(monitoredUrl.url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(30000)
          });
          
          const isOnline = response.ok;
          const responseTime = Date.now(); // Simplified
          
          const updated = await storage.updateMonitoredUrl(urlId, {
            status: isOnline ? 'online' : 'offline',
            responseTime: responseTime,
            lastCheck: new Date(),
            totalChecks: (monitoredUrl.totalChecks || 0) + 1,
            successfulChecks: (monitoredUrl.successfulChecks || 0) + (isOnline ? 1 : 0),
            uptime: ((monitoredUrl.successfulChecks || 0) + (isOnline ? 1 : 0)) / ((monitoredUrl.totalChecks || 0) + 1) * 100
          });
          
          return new Response(JSON.stringify(updated), { headers: corsHeaders });
        } catch (error) {
          // Handle offline case
          const updated = await storage.updateMonitoredUrl(urlId, {
            status: 'offline',
            lastCheck: new Date(),
            totalChecks: (monitoredUrl.totalChecks || 0) + 1,
            uptime: (monitoredUrl.successfulChecks || 0) / ((monitoredUrl.totalChecks || 0) + 1) * 100
          });
          
          return new Response(JSON.stringify(updated), { headers: corsHeaders });
        }
      }
      
      if (request.method === 'DELETE') {
        // Delete URL
        await storage.deleteMonitoredUrl(urlId);
        return new Response(JSON.stringify({ message: 'URL deleted' }), { headers: corsHeaders });
      }
      
      if (request.method === 'PATCH') {
        // Update URL
        const body = await request.json();
        const updated = await storage.updateMonitoredUrl(urlId, body);
        if (!updated) {
          return new Response(JSON.stringify({ error: 'URL not found' }), { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        return new Response(JSON.stringify(updated), { headers: corsHeaders });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: corsHeaders 
    });
    
  } catch (error: any) {
    console.error('URLs API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
}