/**
 * Netlify Edge Function - Stealth v23.0
 * Optimized for: MCI, Irancell, Samantel, Asiatech
 */

export default async (request, context) => {
  const url = new URL(request.url);
  
  // Settings from Netlify Environment Variables
  const TARGET = (Deno.env.get("TARGET_DOMAIN") || "").replace(/\/$/, "");
  const SECRET_PATH = Deno.env.get("SECRET_PATH") || "p4r34m"; 
  const FAKE_SNI = Deno.env.get("FAKE_SNI_HOST") || "react.dev";

  // 1. Camouflage Landing Page
  const MASK_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Edge Delivery Network</title>
    <style>body{font-family:sans-serif;padding:50px;background:#0f172a;color:#f8fafc}h1{color:#38bdf8}</style>
    </head>
    <body>
      <h1>Node: Operational</h1>
      <p>Global CDN edge status: <strong>Active</strong></p>
      <p>Region: <strong>Europe-Frankfurt</strong></p>
    </body>
    </html>
  `;

  // 2. Routing Logic: Secret path check
  if (!url.pathname.startsWith(`/${SECRET_PATH}`)) {
    return new Response(MASK_HTML, { headers: { "content-type": "text/html" } });
  }

  if (!TARGET) return new Response("Configuration Missing: Set TARGET_DOMAIN in Netlify", { status: 500 });

  try {
    const actualPath = url.pathname.replace(`/${SECRET_PATH}`, "");
    const destination = `${TARGET}${actualPath}${url.search}`;
    const targetHost = new URL(TARGET).host;

    const secureHeaders = new Headers(request.headers);
    secureHeaders.set("Host", targetHost);
    secureHeaders.set("X-Forwarded-Host", FAKE_SNI);
    secureHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    
    // Scrub Netlify footprints
    secureHeaders.delete("x-nf-edge-functions");
    secureHeaders.delete("via");

    const response = await fetch(destination, {
      method: request.method,
      headers: secureHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual"
    });

    const finalHeaders = new Headers(response.headers);
    finalHeaders.set("Server", "nginx/1.24");

    return new Response(response.body, {
      status: response.status,
      headers: finalHeaders
    });

  } catch (err) {
    return new Response(null, { status: 502 });
  }
};
