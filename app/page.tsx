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


  // Sentences state
  const [sentenceLang, setSentenceLang] = React.useState("en");
  const [sentenceLicence, setSentenceLicence] = React.useState("");
  const [sentenceLimit, setSentenceLimit] = React.useState<number>(1);
  const [sentenceOffset, setSentenceOffset] = React.useState<number>(0);
  const [sentences, setSentences] = React.useState<any[] | null>(null);
  const [sentencesLoading, setSentencesLoading] = React.useState(false);
  const [sentencesError, setSentencesError] = React.useState<string | null>(null);
  const [sentencesMeta, setSentencesMeta] = React.useState<any>(null);
  const [responseTime, setResponseTime] = React.useState<number | null>(null);
  const [testHistory, setTestHistory] = React.useState<Array<{
    timestamp: string;
    language: string;
    offset: number;
    limit: number;
    responseTime: number;
    success: boolean;
    error?: string;
  }>>([]);

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



  // Reset offset when language or other parameters change
  React.useEffect(() => {
    setSentenceOffset(0);
  }, [sentenceLang, sentenceLicence, sentenceLimit]);

  async function fetchSentences() {
    setSentencesLoading(true);
    setSentencesError(null);
    const startTime = performance.now();
    
    const { data, error } = await apiClient.getSentences({ 
      languageCode: sentenceLang, 
      licence: sentenceLicence, 
      limit: sentenceLimit,
      offset: sentenceOffset 
    });
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    setResponseTime(duration);
    
    setSentencesLoading(false);
    
    // Record test result
    const testResult = {
      timestamp: new Date().toLocaleTimeString(),
      language: sentenceLang,
      offset: sentenceOffset,
      limit: sentenceLimit,
      responseTime: duration,
      success: !error,
      error: error?.detail || undefined
    };
    setTestHistory(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 tests
    
    if (error) setSentencesError(error?.detail || "Failed to fetch sentences");
    else {
      setSentences(data?.data || []);
      setSentencesMeta(data?.meta || null);
    }
  }

  async function fetchNextSentence() {
    setSentenceOffset(prev => prev + sentenceLimit);
    await fetchSentences();
  }

  function resetSentences() {
    setSentenceOffset(0);
    setSentences(null);
    setSentencesError(null);
    setSentencesMeta(null);
    setResponseTime(null);
  }

  function clearTestHistory() {
    setTestHistory([]);
  }

  // Calculate report statistics
  const totalTests = testHistory.length;
  const successfulTests = testHistory.filter(t => t.success).length;
  const failedTests = totalTests - successfulTests;
  const avgResponseTime = totalTests > 0 ? Math.round(testHistory.reduce((sum, t) => sum + t.responseTime, 0) / totalTests) : 0;
  const minResponseTime = totalTests > 0 ? Math.min(...testHistory.map(t => t.responseTime)) : 0;
  const maxResponseTime = totalTests > 0 ? Math.max(...testHistory.map(t => t.responseTime)) : 0;

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
            <div className="flex gap-2">
              <button onClick={fetchSentences} disabled={!token || sentencesLoading} className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm disabled:opacity-60">Fetch</button>
              <button onClick={fetchNextSentence} disabled={!token || sentencesLoading || !sentences} className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm disabled:opacity-60">Next Sentence</button>
              <button onClick={resetSentences} disabled={!sentences} className="rounded-md bg-gray-600 text-white px-3 py-1.5 text-sm disabled:opacity-60">Reset</button>
            </div>
          </div>
          {!token && <p className="text-sm text-gray-600 mt-2">Authenticate to fetch sentences.</p>}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="languageCode (e.g. luo)" value={sentenceLang} onChange={(e) => setSentenceLang(e.target.value)} />
            <input className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="Licence (optional, e.g. NOODL)" value={sentenceLicence} onChange={(e) => setSentenceLicence(e.target.value)} />
            <input type="number" className="rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2" placeholder="limit" value={sentenceLimit} onChange={(e) => setSentenceLimit(Number(e.target.value) || 1)} />
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Offset: {sentenceOffset}</span>
            </div>
          </div>
          {sentencesError && <p className="text-rose-600 text-sm mt-2">{sentencesError}</p>}
          {(sentencesMeta || responseTime !== null) && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">API Response Info:</div>
              <div className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                {responseTime !== null && <div>Response time: {responseTime}ms</div>}
                <div>Returned: {sentencesMeta?.returned || sentences?.length || 0}</div>
                <div>Limit: {sentencesMeta?.limit || sentenceLimit}</div>
                <div>Offset: {sentencesMeta?.offset || sentenceOffset}</div>
                {sentencesMeta && (
                  <div className="mt-2 text-xs text-gray-500">
                    Raw metadata: {JSON.stringify(sentencesMeta, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )}
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

        {totalTests > 0 && (
          <section className="mt-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">API Test Report</h2>
              <button onClick={clearTestHistory} className="rounded-md bg-gray-600 text-white px-3 py-1.5 text-sm">Clear History</button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTests}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Tests</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{successfulTests}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedTests}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgResponseTime}ms</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Avg Response</div>
              </div>
            </div>

            {totalTests > 1 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Response Time Range</div>
                  <div className="text-lg font-semibold">{minResponseTime}ms - {maxResponseTime}ms</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                  <div className="text-lg font-semibold">{totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0}%</div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Tests</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {testHistory.map((test, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${test.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="font-mono">{test.timestamp}</span>
                      <span className="text-gray-500">{test.language}</span>
                      <span className="text-gray-500">offset:{test.offset}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{test.responseTime}ms</span>
                      {!test.success && test.error && (
                        <span className="text-red-500 truncate max-w-32" title={test.error}>
                          {test.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
