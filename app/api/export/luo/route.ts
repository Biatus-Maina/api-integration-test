import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds (adjust per plan)

type Sentence = {
  id: string;
  text: string;
  languageCode: string;
  bucket?: string;
  [key: string]: any;
};

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get("pageSize") || 100)));
  const licence = searchParams.get("licence") || undefined;
  const dedupeBy = (searchParams.get("dedupeBy") || "text").toLowerCase(); // "text" | "id"

  // Prefer Authorization header; fallback to token param for convenience from browser
  const tokenHeader = req.headers.get("authorization");
  const tokenParam = searchParams.get("token");
  const bearer = tokenHeader || (tokenParam ? `Bearer ${tokenParam}` : null);

  if (!bearer) {
    return new Response(JSON.stringify({ error: "Missing Authorization token. Pass as 'Authorization: Bearer <token>' header or '?token=...'." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let offset = 0;
  const uniqueKeySet = new Set<string>();
  const results: Sentence[] = [];

  // Loop until API returns fewer than requested or zero
  for (;;) {
    const sp = new URLSearchParams();
    sp.set("languageCode", "luo");
    if (licence) sp.set("taxonomy[Licence]", licence);
    sp.set("limit", String(pageSize));
    sp.set("offset", String(offset));

    const url = `${origin}/api/proxy/text/sentences?${sp.toString()}`;
    const resp = await fetch(url, { headers: { authorization: bearer, accept: "application/json" } });
    if (!resp.ok) {
      const detail = await safeReadJson(resp);
      return new Response(JSON.stringify({ error: "Upstream request failed", status: resp.status, detail }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    const payload: { data?: Sentence[]; meta?: { returned?: number } } = await resp.json();
    const batch = payload.data || [];

    for (const s of batch) {
      const key = dedupeBy === "id" ? String(s.id) : String(s.text).trim();
      if (!uniqueKeySet.has(key)) {
        uniqueKeySet.add(key);
        results.push(s);
      }
    }

    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  const filename = `luo-sentences-${Date.now()}.json`;
  const body = JSON.stringify({ count: results.length, dedupeBy, licence: licence || null, languageCode: "luo", items: results }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}

async function safeReadJson(resp: Response): Promise<any> {
  try {
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await resp.json();
    const text = await resp.text();
    return { message: text };
  } catch {
    return null;
  }
}


