/**
 * Cloudflare Worker — Telegram Bot API Proxy
 * 
 * Proxies requests from Indian VPS to Telegram API
 * Deploy: wrangler deploy
 */
export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    // Rewrite to Telegram API
    const telegramUrl = "https://api.telegram.org" + url.pathname + url.search
    
    // Forward the request
    const response = await fetch(telegramUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" ? request.body : undefined,
    })
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
}
