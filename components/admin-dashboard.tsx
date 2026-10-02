"use client";

import { useCallback, useEffect, useState } from "react";
import { CrowvoWordmark } from "@/components/marketing-ui";
import { useCrowvoAppUrl } from "@/lib/use-crowvo-app-url";

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
  tier: "USER" | "DEVELOPER" | "ADMIN";
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
  platformRole?: string;
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

type WaitlistSignup = {
  id: string;
  email: string;
  communityType: string | null;
  status: string;
  inviteCode: string | null;
  createdAt: string;
};

type Tab = "overview" | "access-codes" | "waitlist" | "users" | "audit" | "platform" | "feedback";

type FeedbackItem = {
  id: string;
  userId: string | null;
  type: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  screenshotUrl: string | null;
  contactEmail: string | null;
  pageUrl: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  appVersion: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string; avatarUrl: string | null } | null;
};

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
  const [waitlist, setWaitlist] = useState<WaitlistSignup[]>([]);
  const [waitlistMeta, setWaitlistMeta] = useState<{ slotsRemaining?: number; autoInvited?: number; queued?: number } | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [teamMaxUses, setTeamMaxUses] = useState({ DEVELOPER: 50, ADMIN: 25 });
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState("NEW");
  const [feedbackSearch, setFeedbackSearch] = useState("");

  const loadOverview = useCallback(async (user: string, pass: string) => {
    setLoading(true);
    try {
      const [overviewRes, codesRes] = await Promise.all([
        fetch("/api/admin/overview", { headers: authHeaders(user, pass) }),
        fetch("/api/admin/access-codes", { headers: authHeaders(user, pass) }),
      ]);
      if (!overviewRes.ok) {
        const payload = (await overviewRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not load admin data.");
      }
      const payload = (await overviewRes.json()) as AdminData;
      setData(payload);
      if (codesRes.ok) {
        const codesPayload = (await codesRes.json()) as { codes?: AccessCode[] };
        setCodes(codesPayload.codes ?? []);
        setApiOk(true);
      }
      setError("");
      setIsAuthed(true);
      localStorage.setItem("crowvo-admin-user", user);
      localStorage.setItem("crowvo-admin-pass", pass);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      setData(null);
      setIsAuthed(false);
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
          setApiOk(true);
        } else if (nextTab === "waitlist") {
          const [wlRes, metaRes] = await Promise.all([
            fetch("/api/admin/waitlist", { headers: authHeaders(user, pass) }),
            fetch("/api/waitlist"),
          ]);
          const wlPayload = (await wlRes.json()) as { signups?: WaitlistSignup[]; error?: string };
          if (!wlRes.ok) throw new Error(wlPayload.error ?? "Failed to load waitlist.");
          setWaitlist(wlPayload.signups ?? []);
          if (metaRes.ok) {
            setWaitlistMeta((await metaRes.json()) as { slotsRemaining?: number; autoInvited?: number; queued?: number });
          }
        } else if (nextTab === "feedback") {
          const params = new URLSearchParams();
          if (feedbackFilter) params.set("status", feedbackFilter);
          if (feedbackSearch.trim()) params.set("q", feedbackSearch.trim());
          const res = await fetch(`/api/admin/feedback?${params}`, { headers: authHeaders(user, pass) });
          const payload = (await res.json()) as { feedback?: FeedbackItem[]; error?: string };
          if (!res.ok) throw new Error(payload.error ?? "Failed to load feedback.");
          setFeedback(payload.feedback ?? []);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
        if (nextTab === "platform" || nextTab === "access-codes") setApiOk(false);
      } finally {
        setLoading(false);
      }
    },
    [isAuthed, feedbackFilter, feedbackSearch],
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("crowvo-admin-user") ?? "";
    const savedPass = localStorage.getItem("crowvo-admin-pass") ?? "";
    setUsername(savedUser);
    setPassword(savedPass);
    if (savedUser && savedPass) void loadOverview(savedUser, savedPass);
  }, [loadOverview]);

  useEffect(() => {
    if (!isAuthed) return;
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    if (tab !== "overview") void loadTab(tab, user, pass);
  }, [tab, isAuthed, loadTab, username, password]);

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your admin username and password.");
      return;
    }
    await loadOverview(username.trim(), password);
  }

  async function createCode(opts: { tier: "USER" | "DEVELOPER" | "ADMIN"; singleUse?: boolean; maxUses?: number; label: string }) {
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { ...authHeaders(user, pass), "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: opts.tier,
          singleUse: opts.singleUse ?? opts.tier === "USER",
          maxUses: opts.maxUses ?? (opts.tier === "USER" ? 1 : opts.tier === "ADMIN" ? 25 : 50),
          label: opts.label,
          createdByLabel: user,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Create failed.");
      await loadTab("access-codes", user, pass);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create code.");
    } finally {
      setCreating(false);
    }
  }

  async function updateCodeMaxUses(id: string, maxUses: number) {
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    const res = await fetch(`/api/admin/access-codes?id=${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(user, pass), "Content-Type": "application/json" },
      body: JSON.stringify({ maxUses }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Update failed.");
    await loadTab("access-codes", user, pass);
  }

  async function deactivateCode(id: string) {
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    await fetch(`/api/admin/access-codes?id=${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(user, pass), "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    await loadTab("access-codes", user, pass);
  }

  async function updateFeedbackStatus(id: string, status: string) {
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    const res = await fetch(`/api/admin/feedback?id=${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(user, pass), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Update failed.");
    await loadTab("feedback", user, pass);
  }

  function signOut() {
    localStorage.removeItem("crowvo-admin-user");
    localStorage.removeItem("crowvo-admin-pass");
    setUsername("");
    setPassword("");
    setData(null);
    setIsAuthed(false);
    setError("");
  }

  async function approveWaitlist(id: string) {
    const user = localStorage.getItem("crowvo-admin-user") ?? username;
    const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
    const res = await fetch("/api/admin/waitlist", {
      method: "POST",
      headers: { ...authHeaders(user, pass), "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Approve failed.");
    await loadTab("waitlist", user, pass);
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
  }

  const appUrl = useCrowvoAppUrl();
  const joinUrl = `${appUrl}/join`;

  const activeTeamCode = (tier: AccessCode["tier"]) =>
    codes.find((c) => c.tier === tier && c.active && !c.singleUse);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "feedback", label: "Feedback" },
    { id: "waitlist", label: "Waitlist" },
    { id: "access-codes", label: "Access Codes" },
    { id: "users", label: "Users" },
    { id: "platform", label: "Platform" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <CrowvoWordmark size="sm" />
          <div>
            <h1 className="text-2xl font-semibold">Control Center</h1>
            <p className="text-sm text-muted">Public Beta operations, feedback, access codes, and platform metrics.</p>
          </div>
        </div>
        {!isAuthed ? (
          <form onSubmit={onSignIn} className="flex flex-wrap items-center gap-2">
            <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="h-10 rounded-xl border border-border bg-surface-elevated px-3 text-sm" />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-10 rounded-xl border border-border bg-surface-elevated px-3 text-sm" />
            <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Sign in</button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <a href={`${appUrl}/login`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Launch App</a>
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

      {isAuthed && apiOk === false ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          API connection failed. Set Cloudflare secrets <code className="text-xs">CROWVO_API_URL</code> and{" "}
          <code className="text-xs">CROWVO_ADMIN_API_KEY</code> (must match Railway ADMIN_API_KEY), then redeploy.
        </p>
      ) : null}

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
            <h2 className="text-lg font-semibold">Team access codes</h2>
            <p className="mt-1 text-sm text-muted">
              Secure random codes for your team. Testers get single-use USER codes from waitlist or &quot;User invite&quot; below.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  { tier: "ADMIN" as const, label: "Admin", desc: "Platform admins · Control Center + in-app admin" },
                  { tier: "DEVELOPER" as const, label: "Developer", desc: "Engineering · stats + read-only admin" },
                  { tier: "USER" as const, label: "User", desc: "Single-use only · clean account (waitlist / invite)" },
                ] as const
              ).map((item) => {
                const team = item.tier !== "USER" ? activeTeamCode(item.tier) : null;
                return (
                  <div key={item.tier} className="rounded-xl border border-border bg-surface-elevated p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.label}</p>
                    <p className="mt-1 font-mono text-sm break-all">
                      {item.tier === "USER" ? "(generate per person)" : team?.code ?? "—"}
                    </p>
                    {team ? (
                      <button type="button" onClick={() => copyText(team.code)} className="mt-1 text-xs text-accent hover:underline">
                        Copy code
                      </button>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">{item.desc}</p>
                    {team ? (
                      <p className="mt-1 text-xs text-muted">
                        {team.remainingUses ?? "∞"} uses left
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="block flex-1 overflow-x-auto rounded-lg bg-surface-elevated px-3 py-2 text-sm">{joinUrl}</code>
              <button type="button" onClick={() => copyText(joinUrl)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Copy join link
              </button>
            </div>
          </section>
        </>
      ) : null}

      {isAuthed && tab === "feedback" ? (
        <section className="glass-panel space-y-4 rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Beta feedback</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={feedbackSearch}
              onChange={(e) => setFeedbackSearch(e.target.value)}
              placeholder="Search feedback…"
              className="h-9 min-w-[180px] flex-1 rounded-lg border border-border bg-surface-elevated px-3 text-sm"
            />
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface-elevated px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const user = localStorage.getItem("crowvo-admin-user") ?? username;
                const pass = localStorage.getItem("crowvo-admin-pass") ?? password;
                void loadTab("feedback", user, pass);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{f.subject}</p>
                      <p className="mt-1 text-xs text-muted">
                        {f.type.replace("_", " ")} · {f.status.replace("_", " ")} · {new Date(f.createdAt).toLocaleString()}
                      </p>
                      {f.user ? (
                        <a
                          href={`${appUrl}/app/profile/${f.user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-accent hover:underline"
                        >
                          @{f.user.username}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(["NEW", "IN_REVIEW", "COMPLETED", "ARCHIVED"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void updateFeedbackStatus(f.id, s).catch((e) => setError(e instanceof Error ? e.message : "Failed"))}
                          className="rounded border border-border px-2 py-0.5 text-[10px] hover:border-accent/40"
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{f.description}</p>
                  {f.pageUrl ? (
                    <p className="mt-2 text-xs text-muted">
                      Page: <span className="font-mono">{f.pageUrl}</span>
                    </p>
                  ) : null}
                  {(f.browser || f.os || f.device) ? (
                    <p className="mt-1 text-xs text-muted">
                      {[f.browser, f.os, f.device].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {f.screenshotUrl ? (
                    <a href={f.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.screenshotUrl} alt="Screenshot" className="max-h-40 rounded-lg border border-border" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {isAuthed && tab === "waitlist" ? (
        <section className="space-y-4">
          {waitlistMeta ? (
            <p className="text-sm text-muted">
              Auto-invite slots remaining: <strong>{waitlistMeta.slotsRemaining ?? "—"}</strong> · Queued:{" "}
              {waitlistMeta.queued ?? 0}
            </p>
          ) : null}
          {waitlist.map((s) => (
            <div key={s.id} className="glass-panel rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{s.email}</p>
                  <p className="text-sm text-muted">{s.communityType ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted">
                    {s.status} · {new Date(s.createdAt).toLocaleString()}
                  </p>
                  {s.inviteCode ? <p className="mt-2 font-mono text-sm">{s.inviteCode}</p> : null}
                </div>
                {s.status === "queued" ? (
                  <button
                    type="button"
                    onClick={() => void approveWaitlist(s.id).catch((e) => setError(e instanceof Error ? e.message : "Failed"))}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve &amp; send code
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {waitlist.length === 0 ? <p className="text-sm text-muted">No waitlist signups yet.</p> : null}
        </section>
      ) : null}

      {isAuthed && tab === "access-codes" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              User invite max uses
              <input
                type="number"
                min={1}
                max={10000}
                value={inviteMaxUses}
                onChange={(e) => setInviteMaxUses(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 block h-9 w-24 rounded-lg border border-border bg-surface-elevated px-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              disabled={creating}
              onClick={() => void createCode({ tier: "USER", label: "User invite", maxUses: inviteMaxUses, singleUse: inviteMaxUses === 1 })}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              User invite
            </button>
            <label className="text-sm text-muted">
              Dev team max
              <input
                type="number"
                min={1}
                max={10000}
                value={teamMaxUses.DEVELOPER}
                onChange={(e) => setTeamMaxUses((s) => ({ ...s, DEVELOPER: Math.max(1, Number(e.target.value) || 1) }))}
                className="mt-1 block h-9 w-24 rounded-lg border border-border bg-surface-elevated px-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              disabled={creating}
              onClick={() => void createCode({ tier: "DEVELOPER", singleUse: false, label: "Developer team", maxUses: teamMaxUses.DEVELOPER })}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Rotate developer code
            </button>
            <label className="text-sm text-muted">
              Admin team max
              <input
                type="number"
                min={1}
                max={10000}
                value={teamMaxUses.ADMIN}
                onChange={(e) => setTeamMaxUses((s) => ({ ...s, ADMIN: Math.max(1, Number(e.target.value) || 1) }))}
                className="mt-1 block h-9 w-24 rounded-lg border border-border bg-surface-elevated px-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              disabled={creating}
              onClick={() => void createCode({ tier: "ADMIN", singleUse: false, label: "Platform admin team", maxUses: teamMaxUses.ADMIN })}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Rotate admin code
            </button>
          </div>
          <div className="space-y-3">
            {codes.map((code) => (
              <div key={code.id} className="glass-panel rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg">{code.code}</p>
                    <button type="button" onClick={() => copyText(code.code)} className="mt-1 text-xs text-accent hover:underline">
                      Copy code
                    </button>
                    <p className="text-sm text-muted">
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{code.tier}</span>
                      {" · "}
                      {code.label ?? "Untitled"} · {code.active ? "Active" : "Deactivated"}
                    </p>
                    {code.note ? <p className="mt-1 text-xs text-muted">{code.note}</p> : null}
                  </div>
                  <div className="text-right text-sm">
                    <p>{code.uses} used{code.remainingUses != null ? ` · ${code.remainingUses} left` : ""}</p>
                    {code.active ? (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={Math.max(1, code.uses)}
                          max={10000}
                          defaultValue={code.maxUses ?? 1}
                          key={`${code.id}-${code.maxUses}`}
                          className="h-8 w-16 rounded border border-border bg-surface-elevated px-2 text-xs"
                          onBlur={(e) => {
                            const next = Math.max(code.uses, Number(e.target.value) || 1);
                            if (next !== code.maxUses) {
                              void updateCodeMaxUses(code.id, next).catch((err) =>
                                setError(err instanceof Error ? err.message : "Could not update limit."),
                              );
                            }
                          }}
                        />
                        <span className="text-xs text-muted">max</span>
                      </div>
                    ) : null}
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
                <th className="pb-2">Role</th>
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
                  <td className="py-2 text-xs">{u.platformRole?.replace("_", " ") ?? "USER"}</td>
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
