"use client";
import React from "react";
import { apiClient } from "./lib/api";
import { useToken } from "./components/TokenProvider";

export default function Home() {
  const { token, setToken } = useToken();
  const [clientId, setClientId] = React.useState("");
  const [clientSecret, setClientSecret] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const [locales, setLocales] = React.useState<Array<{ locale: string; description: string }>>([]);
  const [localesLoading, setLocalesLoading] = React.useState(false);
  const [localesError, setLocalesError] = React.useState<string | null>(null);

  const [audios, setAudios] = React.useState<any[]>([]);
  const [audiosLoading, setAudiosLoading] = React.useState(false);
  const [audiosError, setAudiosError] = React.useState<string | null>(null);

  const [newAudioText, setNewAudioText] = React.useState("");
  const [newAudioLocale, setNewAudioLocale] = React.useState("");
  const [newAudioAge, setNewAudioAge] = React.useState<number | "">("");
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createdAudioId, setCreatedAudioId] = React.useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Sentences state
  const [sentenceLang, setSentenceLang] = React.useState("en");
  const [sentenceLicence, setSentenceLicence] = React.useState("");
  const [sentenceLimit, setSentenceLimit] = React.useState<number>(1);
  const [sentences, setSentences] = React.useState<any[] | null>(null);
  const [sentencesLoading, setSentencesLoading] = React.useState(false);
  const [sentencesError, setSentencesError] = React.useState<string | null>(null);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const { data, error } = await apiClient.createAccessToken({ clientId, clientSecret });
    setAuthLoading(false);
    if (error) {
      setAuthError(typeof error === "string" ? error : error?.detail || "Failed to get token");
      return;
    }
    setToken(data?.token || null);
  }

  async function fetchLocales() {
    setLocalesLoading(true);
    setLocalesError(null);
    const { data, error, status } = await apiClient.getLocales();
    setLocalesLoading(false);
    if (error) {
      if (status === 404) {
        setLocalesError("Endpoint not available on this API base. Configure a server that supports /locales.");
      } else {
        setLocalesError(error?.detail || "Failed to load locales");
      }
    } else {
      setLocales(data || []);
      if (!newAudioLocale && data && data.length > 0) setNewAudioLocale(data[0].locale);
    }
  }

  async function fetchAudios() {
    setAudiosLoading(true);
    setAudiosError(null);
    const { data, error, status } = await apiClient.getAudios();
    setAudiosLoading(false);
    if (error) {
      if (status === 404) setAudiosError("Endpoint not available on this API base. Configure a server that supports /audio.");
      else setAudiosError(error?.detail || "Failed to load audios");
    }
    else setAudios(data || []);
  }

  async function createAudio() {
    setCreateLoading(true);
    setCreateError(null);
    const body: any = { text: newAudioText, locale: newAudioLocale };
    if (newAudioAge !== "") body.age = Number(newAudioAge);
    const { data, error, raw } = await apiClient.createAudio(body);
    setCreateLoading(false);
    if (error) {
      setCreateError(error?.detail || "Failed to create audio");
      return;
    }
    const location = raw.headers.get("location");
    const id = data?.id || (location ? location.split("/").pop() : null);
    setCreatedAudioId(id || null);
    await fetchAudios();
  }

  async function removeAudio(id: string) {
    await apiClient.deleteAudio(id);
    await fetchAudios();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !createdAudioId) return;
    setUploadLoading(true);
    setUploadError(null);
    const { error } = await apiClient.uploadAudioFile(createdAudioId, file);
    setUploadLoading(false);
    if (error) setUploadError(error?.detail || "Upload failed");
  }

  React.useEffect(() => {
    if (token) {
      fetchLocales();
      fetchAudios();
    }
  }, [token]);

  async function fetchSentences() {
    setSentencesLoading(true);
    setSentencesError(null);
    const { data, error } = await apiClient.getSentences({ languageCode: sentenceLang, licence: sentenceLicence, limit: sentenceLimit });
    setSentencesLoading(false);
    if (error) setSentencesError(error?.detail || "Failed to fetch sentences");
    else setSentences(data?.data || []);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 dark:from-neutral-950 dark:to-neutral-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Common Voice API Tester</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Use your credentials to fetch a token and interact with endpoints.</p>

        <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-sm">
          <h2 className="text-lg font-medium">Authentication</h2>
          <form onSubmit={handleAuth} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} required />
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="Client Secret" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} required />
            <button disabled={authLoading} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 disabled:opacity-60">{authLoading ? "Requesting..." : "Get Token"}</button>
          </form>
          <div className="mt-3 text-sm">
            <div className="truncate"><span className="font-medium">Token:</span> {token ? <span className="text-emerald-600">stored</span> : <span className="text-rose-600">not set</span>}</div>
            {authError && <div className="text-rose-600 mt-1">{authError}</div>}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Sentences</h2>
            <button onClick={fetchSentences} disabled={!token || sentencesLoading} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm disabled:opacity-60">Fetch</button>
          </div>
          {!token && <p className="text-sm text-gray-600 mt-2">Authenticate to fetch sentences.</p>}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="languageCode (e.g. luo)" value={sentenceLang} onChange={(e) => setSentenceLang(e.target.value)} />
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="Licence (optional, e.g. NOODL)" value={sentenceLicence} onChange={(e) => setSentenceLicence(e.target.value)} />
            <input type="number" className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="limit" value={sentenceLimit} onChange={(e) => setSentenceLimit(Number(e.target.value) || 1)} />
          </div>
          {sentencesError && <p className="text-rose-600 text-sm mt-2">{sentencesError}</p>}
          <div className="mt-4 space-y-3">
            {sentences?.map((s) => (
              <div key={s.id} className="rounded-md border border-black/10 dark:border-white/10 p-3 text-sm">
                <div className="font-mono text-xs text-gray-500">{s.id}</div>
                <div className="mt-1">{s.text}</div>
                <div className="mt-1 text-gray-600 dark:text-gray-400 text-xs">lang: {s.languageCode} • bucket: {s.bucket}</div>
              </div>
            ))}
            {sentences && sentences.length === 0 && <div className="text-sm text-gray-600">No results.</div>}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Locales</h2>
            <button onClick={fetchLocales} disabled={!token || localesLoading} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm disabled:opacity-60">Refresh</button>
          </div>
          {!token && <p className="text-sm text-gray-600 mt-2">Authenticate to load locales.</p>}
          {localesError && <p className="text-rose-600 text-sm mt-2">{localesError}</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {locales.map((l) => (
              <div key={l.locale} className="rounded-md border border-black/10 dark:border-white/10 px-3 py-2 text-sm flex items-center justify-between">
                <span className="font-mono">{l.locale}</span>
                <span className="text-gray-600 dark:text-gray-400">{l.description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Audio Records</h2>
            <button onClick={fetchAudios} disabled={!token || audiosLoading} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm disabled:opacity-60">Refresh</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 md:col-span-2" placeholder="Text" value={newAudioText} onChange={(e) => setNewAudioText(e.target.value)} />
            <select className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" value={newAudioLocale} onChange={(e) => setNewAudioLocale(e.target.value)}>
              <option value="">Select locale</option>
              {locales.map((l) => (
                <option key={l.locale} value={l.locale}>{l.locale}</option>
              ))}
            </select>
            <input type="number" className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="Age (optional)" value={newAudioAge} onChange={(e) => setNewAudioAge(e.target.value === "" ? "" : Number(e.target.value))} />
            <button onClick={createAudio} disabled={!token || createLoading || !newAudioText || !newAudioLocale} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 disabled:opacity-60">{createLoading ? "Creating..." : "Create"}</button>
          </div>
          {createError && <p className="text-rose-600 text-sm mt-2">{createError}</p>}
          {createdAudioId && (
            <div className="mt-3 text-sm">
              <div>Created ID: <span className="font-mono">{createdAudioId}</span></div>
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <span>Upload file:</span>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
              </label>
              {uploadLoading && <span className="ml-2 text-gray-600">Uploading...</span>}
              {uploadError && <div className="text-rose-600 mt-1">{uploadError}</div>}
            </div>
          )}

          <div className="mt-6 divide-y divide-black/5 dark:divide-white/10">
            {audios.map((a) => (
              <div key={a.id || a.url || Math.random()} className="py-3 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-mono">{a.id || "(no id)"}</span>
                  <span className="text-gray-600 dark:text-gray-400">{a.text}</span>
                </div>
                <div className="flex items-center gap-3">
                  {a.url && <a className="underline" href={a.url} target="_blank" rel="noreferrer">file</a>}
                  <button onClick={() => removeAudio(a.id)} className="rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {audiosError && <p className="text-rose-600 text-sm mt-2">{audiosError}</p>}
        </section>
      </div>
    </div>
  );
}
