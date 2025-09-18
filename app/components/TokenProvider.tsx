"use client";

import React from "react";
import { apiClient } from "../lib/api";

type TokenContextValue = {
  token: string | null;
  setToken: (t: string | null) => void;
};

const TokenContext = React.createContext<TokenContextValue | undefined>(undefined);

export function useToken() {
  const ctx = React.useContext(TokenContext);
  if (!ctx) throw new Error("useToken must be used within TokenProvider");
  return ctx;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("cv_token") : null;
    if (saved) {
      setTokenState(saved);
      apiClient.setToken(saved);
    }
  }, []);

  const setToken = React.useCallback((t: string | null) => {
    setTokenState(t);
    apiClient.setToken(t);
    if (typeof window !== "undefined") {
      if (t) window.localStorage.setItem("cv_token", t);
      else window.localStorage.removeItem("cv_token");
    }
  }, []);

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
}


