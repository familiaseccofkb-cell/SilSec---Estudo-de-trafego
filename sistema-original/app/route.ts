import html from "./shell";
export const dynamic = "force-dynamic";
export function GET() { return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } }); }
