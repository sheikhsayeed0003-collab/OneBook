"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Role, User } from "@/lib/types";

const USER_KEY = "onebook_user";

type AuthState = {
  user: User | null;
  ready: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setRole: (role: Role) => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(u: User | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore quota */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      setUser(data.user);
      writeCachedUser(data.user);
    } catch {
      // Keep last known session offline so the app shell stays usable
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = readCachedUser();
        if (cached) {
          setUser(cached);
          return;
        }
      }
      setUser(null);
      writeCachedUser(null);
    }
  };

  useEffect(() => {
    const cached = readCachedUser();
    if (cached) setUser(cached);
    refresh().finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      error,
      login: async (email, password) => {
        setError(null);
        const data = await api<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
        writeCachedUser(data.user);
      },
      register: async (input) => {
        setError(null);
        const data = await api<{ user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setUser(data.user);
        writeCachedUser(data.user);
      },
      logout: async () => {
        try {
          if (navigator.onLine) await api("/api/auth/logout", { method: "POST" });
        } finally {
          setUser(null);
          writeCachedUser(null);
        }
      },
      refresh,
      setRole: (role) =>
        setUser((u) => {
          const next = u ? { ...u, role } : u;
          writeCachedUser(next);
          return next;
        }),
      updateUser: async (patch) => {
        if (!navigator.onLine) {
          setUser((u) => {
            const next = u ? { ...u, ...patch } : u;
            writeCachedUser(next);
            return next;
          });
          return;
        }
        const data = await api<{ user: User }>("/api/users", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setUser(data.user);
        writeCachedUser(data.user);
      },
    }),
    [user, ready, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
