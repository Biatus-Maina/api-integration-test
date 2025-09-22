import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPPORTED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

function getApiBase(): string {
  const envBase = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
  if (!envBase) {
    throw new Error("API_BASE (or NEXT_PUBLIC_API_BASE) is not set in env. Configure it in Vercel Environment Variables.");
  }
  return envBase.replace(/\/$/, "");
}

async function forward(req: NextRequest, params: { slug?: string[] }) {
  const apiBase = getApiBase();
  const path = (params.slug || []).join("/");
  const url = `${apiBase}/${path}${req.nextUrl.search}`;

  const headers = new Headers();

  req.headers.forEach((value, key) => {
    // Skip Next-specific headers
    if (key.toLowerCase().startsWith("x-next")) return;
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });

  // Ensure we don't send a content-length that could be wrong after streaming
  headers.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: SUPPORTED_METHODS.includes(req.method as typeof SUPPORTED_METHODS[number]) && req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    // Important to preserve duplex for streaming uploads
    // @ts-expect-error - duplex is a Node extension
    duplex: "half",
  };

  const upstream = await fetch(url, init);

  const respHeaders = new Headers(upstream.headers);
  // Avoid exposing upstream server details
  respHeaders.delete("server");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}


