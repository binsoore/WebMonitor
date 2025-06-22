// CloudFlare Pages Functions API handler
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle CORS for all requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Import the API routes dynamically based on the path
    if (path.startsWith('/api/urls')) {
      const { handleUrlsAPI } = await import('../../server/api/urls');
      return await handleUrlsAPI(request, env);
    } else if (path.startsWith('/api/email-settings')) {
      const { handleEmailAPI } = await import('../../server/api/email');
      return await handleEmailAPI(request, env);
    } else if (path.startsWith('/api/errors')) {
      const { handleErrorsAPI } = await import('../../server/api/errors');
      return await handleErrorsAPI(request, env);
    } else if (path.startsWith('/api/stats')) {
      const { handleStatsAPI } = await import('../../server/api/stats');
      return await handleStatsAPI(request, env);
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}