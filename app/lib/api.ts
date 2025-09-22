export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ApiConfig = {
  baseUrl?: string;
};

export class ApiClient {
  private accessToken: string | null;
  private readonly proxyBase: string;

  constructor(config?: ApiConfig) {
    this.accessToken = null;
    const base = config?.baseUrl || "/api/proxy";
    this.proxyBase = base.replace(/\/$/, "");
  }

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      "accept": "application/json",
    };
    if (this.accessToken) {
      headers["authorization"] = `Bearer ${this.accessToken}`;
    }
    return { ...headers, ...(extra || {}) };
  }

  async request<T = unknown, E = unknown>(path: string, options?: { method?: HttpMethod; headers?: HeadersInit; body?: unknown }): Promise<{ data: T | null; error: E | null; status: number; raw: Response }> {
    const url = `${this.proxyBase}${path.startsWith("/") ? path : `/${path}`}`;
    const method = options?.method || "GET";
    const isJsonBody = options?.body && typeof options.body === "object" && !(options.body instanceof ArrayBuffer) && !(options.body instanceof Blob) && !(options.body instanceof FormData);

    const headers = this.buildHeaders(
      isJsonBody ? { "content-type": "application/json", ...(options?.headers || {}) } : options?.headers
    );

    const body: BodyInit | undefined = isJsonBody
      ? JSON.stringify(options?.body)
      : (options?.body as BodyInit | undefined);

    const resp = await fetch(url, { method, headers, body });
    let data: unknown = null;
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await resp.json();
      } catch {
        data = null;
      }
    } else if (contentType.startsWith("text/")) {
      data = await resp.text();
    }
    const ok = resp.ok;
    return { data: ok ? (data as T) : null, error: ok ? null : (data as E), status: resp.status, raw: resp };
  }

  // Auth
  createAccessToken(body: { clientId: string; clientSecret: string }) {
    return this.request<{ token: string }>("/auth/token", { method: "POST", body });
  }

  // General
  getLocales() {
    return this.request<Array<{ locale: string; description: string }>>("/locales", { method: "GET" });
  }

  // Audio
  createAudio(body: { text: string; locale: string; age?: number }) {
    return this.request("/audio", { method: "POST", body });
  }

  getAudios() {
    return this.request<Array<Record<string, unknown>>>("/audio", { method: "GET" });
  }

  deleteAudio(audioId: string) {
    return this.request(`/audio/${audioId}`, { method: "DELETE" });
  }

  async uploadAudioFile(audioId: string, file: File | Blob) {
    const headers: HeadersInit = {
      "content-type": "application/octet-stream",
    };
    const res = await this.request(`/audio/${audioId}/file`, { method: "PUT", headers, body: file });
    return res;
  }

  // Text - Sentences
  getSentences(params: { languageCode: string; licence?: string; limit?: number; offset?: number }) {
    const sp = new URLSearchParams();
    sp.set("languageCode", params.languageCode);
    if (params.licence) sp.set("taxonomy[Licence]", params.licence);
    if (typeof params.limit === "number") sp.set("limit", String(params.limit));
    if (typeof params.offset === "number") sp.set("offset", String(params.offset));
    return this.request<{ data: Array<{ id: string; text: string; languageCode: string; bucket?: string }>; meta?: { limit?: number; offset?: number; returned?: number } }, { detail?: string }>(`/text/sentences?${sp.toString()}`);
  }
}

export const apiClient = new ApiClient();

