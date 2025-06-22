import { CloudFlareKVStorage } from '../storage-cf';

export async function handleErrorsAPI(request: Request, env: any): Promise<Response> {
  const storage = new CloudFlareKVStorage(env.URL_MONITOR_KV);
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  
  try {
    if (request.method === 'GET') {
      // Get error logs
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const errors = await storage.getErrorLogs(limit);
      return new Response(JSON.stringify(errors), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: corsHeaders 
    });
    
  } catch (error: any) {
    console.error('Errors API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
}