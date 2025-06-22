import { CloudFlareKVStorage } from '../storage-cf';

export async function handleStatsAPI(request: Request, env: any): Promise<Response> {
  const storage = new CloudFlareKVStorage(env.URL_MONITOR_KV);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  
  try {
    if (request.method === 'GET') {
      // Get dashboard statistics
      const urls = await storage.getMonitoredUrls();
      const online = urls.filter(url => url.status === 'online').length;
      const offline = urls.filter(url => url.status === 'offline').length;
      const total = urls.length;
      
      // Get last check time
      const lastCheck = urls.reduce((latest, url) => {
        if (!url.lastCheck) return latest;
        return !latest || url.lastCheck > latest ? url.lastCheck : latest;
      }, null as Date | null);
      
      const stats = {
        online,
        offline,
        total,
        lastCheck: lastCheck?.toISOString() || null,
      };
      
      return new Response(JSON.stringify(stats), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: corsHeaders 
    });
    
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
}