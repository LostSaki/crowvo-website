"use client";

import { useCallback, useEffect, useState } from "react";
import { crowvoAppUrl } from "@/lib/app-url";

type AdminData = {
  analytics: {
    pageViews: number;
    startHubClicks: number;
    launchAppClicks: number;
    requestDeckClicks: number;
    topTrafficSources: { source: string; count: number }[];
  };
};

type AccessCode = {
  id: string;
  code: string;
  label: string | null;
  note: string | null;
  singleUse: boolean;
  maxUses: number | null;
  uses: number;
  remainingUses: number | null;
  expiresAt: string | null;
  active: boolean;
  createdByLabel: string | null;
  createdAt: string;
  redemptions: { id: string; redeemedAt: string; user: { id: string; username: string; email: string } }[];
};

type PlatformUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  _count: { hubMembers: number; eventRsvps: number };
};

type AuditLog = {
  id: string;
  action: string;
  actorLabel: string | null;
  targetType: string | null;
  createdAt: string;
};

type Tab = "overview" | "access-codes" | "users" | "audit" | "platform";

type AdminSession = {
  username: string;
  password: string;
};

const ADMIN_USER_STORAGE_KEY = "crowvo-admin-user";
const LEGACY_ADMIN_PASS_STORAGE_KEY = "crowvo-admin-pass";

function basicAuthorizationHeader(username: string, password: string) {
  const pair = `${username}:${password}`;
  const bytes = new TextEncoder().encode(pair);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${btoa(binary)}`;
}

function authHeaders(user: string, pass: string) {
  return { authorization: basicAuthorizationHeader(user, pass) };
}

export function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [platformStats, setPlatformStats] = useState<Record<string, number> | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadOverview = useCallback(async (user: string, pass: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { headers: authHeaders(user, pass) });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not load admin data.");
      }
      const payload = (await response.json()) as AdminData;
      setData(payload);
      setError("");
      setIsAuthed(true);
      setSession({ username: user, password: pass });
      setPassword("");
      localStorage.setItem(ADMIN_USER_STORAGE_KEY, user);
      localStorage.removeItem(LEGACY_ADMIN_PASS_STORAGE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      setData(null);
      setIsAuthed(false);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTab = useCallback(
    async (nextTab: Tab, user: string, pass: string) => {
      if (!isAuthed) return;
      setLoading(true);
      try {
        if (nextTab === "access-codes") {
          const res = await fetch("/api/admin/access-codes", { headers: authHeaders(user, pass) });
          const payload = (await res.json()) as { codes?: AccessCode[]; error?: string };
          if (!res.ok) throw new Error(payload.error ?? "Failed to load codes.");
          setCodes(payload.codes ?? []);
        } else if (nextTab === "users") {
          const res = await fetch("/api/admin/platform?section=users", { headers: authHeaders(user, pass) });
          const payload = (await res.json()) as { users?: PlatformUser[]; error?: string };
          if (!res.ok) throw new Error(payload.error ?? "Failed to load users.");
          setUsers(payload.users ?? []);
        } else if (nextTab === "audit") {
          const res = await fetch("/api/admin/platform?section=audit", { headers: authHeaders(user, pass) });
          const payload = (await res.json()) as { logs?: AuditLog[]; error?: string };
          if (!res.ok) throw new Error(payload.error ?? "Failed to load audit logs.");
          setLogs(payload.logs ?? []);
        } else if (nextTab === "platform") {
          const res = await fetch("/api/admin/platform?section=stats", { headers: authHeaders(user, pass) });
          const payload = (await res.json()) as Record<string, number> & { error?: string };
          if (!res.ok) throw new Error(payload.error ?? "Failed to load platform stats.");
          setPlatformStats(payload);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [isAuthed],
  );

  useEffect(() => {
    const savedUser = localStorage.getItem(ADMIN_USER_STORAGE_KEY) ?? "";
    setUsername(savedUser);
    localStorage.removeItem(LEGACY_ADMIN_PASS_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!isAuthed || !session) return;
    if (tab !== "overview") void loadTab(tab, session.username, session.password);
  }, [tab, isAuthed, loadTab, session]);

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your admin username and password.");
      return;
    }
    await loadOverview(username.trim(), password);
  }

  async function createCode(singleUse: boolean) {
    if (!session) {
      setError("Sign in again to manage access codes.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { ...authHeaders(session.username, session.password), "Content-Type": "application/json" },
        body: JSON.stringify({ singleUse, maxUses: singleUse ? 1 : 25, label: singleUse ? "Single-use invite" : "Multi-use demo batch", createdByLabel: session.username }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Create failed.");
      await loadTab("access-codes", session.username, session.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create code.");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(id: string) {
    if (!session) {
      setError("Sign in again to manage access codes.");
      return;
    }
    await fetch(`/api/admin/access-codes?id=${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(session.username, session.password), "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    await loadTab("access-codes", session.username, session.password);
  }

  function signOut() {
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ADMIN_PASS_STORAGE_KEY);
    setUsername("");
    setPassword("");
    setSession(null);
    setData(null);
    setIsAuthed(false);
    setError("");
  }

  const appUrl = crowvoAppUrl;
  const joinUrl = `${appUrl}/join`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "access-codes", label: "Access Codes" },
    { id: "users", label: "Users" },
    { id: "platform", label: "Platform" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div>
          <h1 className="text-2xl font-semibold">Control Center</h1>
          <p className="text-sm text-muted">Demo access, users, platform metrics, and audit trail.</p>
        </div>
        {!isAuthed ? (
          <form onSubmit={onSignIn} className="flex flex-wrap items-center gap-2">
            <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="h-10 rounded-xl border border-border bg-surface-elevated px-3 text-sm" />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-10 rounded-xl border border-border bg-surface-elevated px-3 text-sm" />
            <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Sign in</button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <a href={appUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Launch App</a>
            <button onClick={signOut} className="rounded-xl border border-border px-4 py-2 text-sm">Sign out</button>
          </div>
        )}
      </div>

      {isAuthed ? (
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {isAuthed && tab === "overview" && data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Page views", data.analytics.pageViews],
              ["Launch app clicks", data.analytics.startHubClicks],
              ["Investor brief clicks", data.analytics.requestDeckClicks],
              ["Traffic sources", data.analytics.topTrafficSources.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="glass-panel rounded-2xl p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </section>
          <section className="glass-panel rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Demo signup link</h2>
            <p className="mt-1 text-sm text-muted">Share this with invited testers after generating access codes.</p>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-surface-elevated px-3 py-2 text-sm">{joinUrl}</code>
          </section>
        </>
      ) : null}

      {isAuthed && tab === "access-codes" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={creating} onClick={() => void createCode(false)} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Generate multi-use code</button>
            <button type="button" disabled={creating} onClick={() => void createCode(true)} className="rounded-xl border border-border px-4 py-2 text-sm">Generate single-use code</button>
          </div>
          <div className="space-y-3">
            {codes.map((code) => (
              <div key={code.id} className="glass-panel rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg">{code.code}</p>
                    <p className="text-sm text-muted">{code.label ?? "Untitled"} · {code.active ? "Active" : "Deactivated"}</p>
                    {code.note ? <p className="mt-1 text-xs text-muted">{code.note}</p> : null}
                  </div>
                  <div className="text-right text-sm">
                    <p>{code.uses} used{code.remainingUses != null ? ` · ${code.remainingUses} left` : ""}</p>
                    {code.expiresAt ? <p className="text-xs text-muted">Expires {new Date(code.expiresAt).toLocaleDateString()}</p> : null}
                    {code.active ? (
                      <button type="button" onClick={() => void deactivateCode(code.id)} className="mt-2 text-xs text-red-300 hover:underline">Deactivate</button>
                    ) : null}
                  </div>
                </div>
                {code.redemptions.length > 0 ? (
                  <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted">
                    {code.redemptions.map((r) => (
                      <li key={r.id}>@{r.user.username} · {new Date(r.redeemedAt).toLocaleString()}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isAuthed && tab === "users" ? (
        <section className="glass-panel overflow-x-auto rounded-2xl p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2">User</th>
                <th className="pb-2">Onboarding</th>
                <th className="pb-2">Hubs</th>
                <th className="pb-2">RSVPs</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-2">@{u.username}<br /><span className="text-xs text-muted">{u.email}</span></td>
                  <td className="py-2">{u.onboardingCompleted ? "Complete" : "Pending"}</td>
                  <td className="py-2">{u._count.hubMembers}</td>
                  <td className="py-2">{u._count.eventRsvps}</td>
                  <td className="py-2 text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {isAuthed && tab === "platform" && platformStats ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(platformStats)
            .filter(([key]) => key !== "error")
            .map(([key, value]) => (
              <div key={key} className="glass-panel rounded-2xl p-4">
                <p className="text-xs capitalize text-muted">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
        </section>
      ) : null}

      {isAuthed && tab === "audit" ? (
        <section className="glass-panel space-y-2 rounded-2xl p-4">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
              <span className="font-medium">{log.action}</span>
              <span className="text-xs text-muted">{log.actorLabel ?? "system"} · {new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
