import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const Context = createContext(null);

export async function rosieRequest(path, options = {}) {
  let response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin", cache: "no-store",
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
    });
  } catch {
    throw new Error("Rosie cannot reach the ledger. Please check your connection.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Rosie could not finish that request.");
    error.status = response.status;
    error.retryAfter = payload.retryAfter;
    throw error;
  }
  return payload;
}

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const result = await rosieRequest("auth/session");
      setUser(result.user);
      setConnectionError("");
      return result.user;
    } catch (error) {
      setConnectionError(error.message);
      return null;
    } finally { setChecking(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = useCallback(async (username, pin) => {
    const result = await rosieRequest("auth/login", {
      method: "POST", body: JSON.stringify({ username, pin })
    });
    setUser(result.user);
    setConnectionError("");
    return result.user;
  }, []);
  const logout = useCallback(async () => {
    await rosieRequest("auth/logout", { method: "POST" });
    setUser(null);
  }, []);
  const register = useCallback(async (username, pin) => {
    const result = await rosieRequest("auth/register", {
      method: "POST", body: JSON.stringify({ username, pin })
    });
    setUser(result.user);
    setConnectionError("");
    return result.user;
  }, []);
  const value = useMemo(() => ({ user, checking, connectionError, refresh, login, register, logout }),
    [user, checking, connectionError, refresh, login, register, logout]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useRosieAccount() {
  const value = useContext(Context);
  if (!value) throw new Error("AccountProvider must wrap private RosieVerse features.");
  return value;
}
