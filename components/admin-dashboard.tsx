"use client";

import { useCallback, useState } from "react";

type WaitlistRow = {
  id: string;
  email: string;
  inviteCode: string;
  referralCode: string | null;
  source: string | null;
  createdAt: string;
};

type AdminData = {
  waitlistCount: number;
  investorCount: number;
  latestWaitlist: WaitlistRow[];
  topReferrers: { email: string; inviteCode: string; referrals: number }[];
  analytics: {
    referralSignups: number;
    directSignups: number;
    estimatedConversionRate: number;
    pageViews: number;
    startHubClicks: number;
    waitlistCtaClicks: number;
    requestDeckClicks: number;
    topTrafficSources: { source: string; count: number }[];
  };
  securityEvents: {
    id: string;
    time: string;
    type: string;
    severity: "info" | "low" | "medium" | "high";
    detail: string;
  }[];
};

export function AdminDashboard() {
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("crowvo-admin-token") ?? "";
  });
  const [isAuthed, setIsAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOverview = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/overview", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "You are authenticated but not authorized as admin.");
      }
      const payload = (await response.json()) as AdminData;
      setData(payload);
      setError("");
      setIsAuthed(true);
      localStorage.setItem("crowvo-admin-token", token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      setData(null);
      setIsAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken.trim()) {
      setError("Enter an admin token.");
      return;
    }
    await loadOverview(adminToken.trim());
  }

  async function exportCsv() {
    if (!isAuthed || !adminToken) {
      return;
    }
    const response = await fetch("/api/admin/waitlist", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    if (!response.ok) {
      setError("Failed to export CSV.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "waitlist.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function signOut() {
    localStorage.removeItem("crowvo-admin-token");
    setAdminToken("");
    setData(null);
    setIsAuthed(false);
    setError("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/85">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted">Token-secured analytics, referral growth, and login security monitoring.</p>
        </div>
        {!isAuthed ? (
          <form onSubmit={onSignIn} className="flex items-center gap-2">
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/20 dark:bg-black/30"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[#5865F2] to-[#7c5cff] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </form>
        ) : (
          <button
            onClick={signOut}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          >
            Sign out
          </button>
        )}
      </div>

      {loading ? <p className="text-sm text-muted">Loading...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <p className="text-xs text-muted">Total waitlist users</p>
              <p className="mt-1 text-2xl font-semibold">{data.waitlistCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <p className="text-xs text-muted">Investor leads</p>
              <p className="mt-1 text-2xl font-semibold">{data.investorCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <p className="text-xs text-muted">Export waitlist</p>
              <button onClick={exportCsv} className="mt-2 text-sm text-indigo-600 dark:text-indigo-300">
                Download CSV
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <h2 className="text-lg font-semibold">Top referrers</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.topReferrers.map((item) => (
                  <li
                    key={item.inviteCode}
                    className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-white/10 dark:bg-transparent"
                  >
                    <span>{item.email}</span>
                    <span className="text-indigo-600 dark:text-indigo-300">{item.referrals} referrals</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <h2 className="text-lg font-semibold">Analytics Snapshot</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-muted">Page views</span>
                  <span className="font-medium">{data.analytics.pageViews}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Referral signups</span>
                  <span className="font-medium">{data.analytics.referralSignups}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Direct signups</span>
                  <span className="font-medium">{data.analytics.directSignups}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Investor conversion</span>
                  <span className="font-medium">{data.analytics.estimatedConversionRate}%</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Start hub clicks</span>
                  <span className="font-medium">{data.analytics.startHubClicks}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Waitlist CTA clicks</span>
                  <span className="font-medium">{data.analytics.waitlistCtaClicks}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">Request deck clicks</span>
                  <span className="font-medium">{data.analytics.requestDeckClicks}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <h2 className="text-lg font-semibold">Security Log</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.securityEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-white/10 dark:bg-transparent"
                  >
                    <p className="font-medium capitalize">{event.type.replace("-", " ")}</p>
                    <p className="text-xs text-muted">{event.detail}</p>
                    <p className="mt-1 text-[11px] text-muted">{new Date(event.time).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
            <h2 className="text-lg font-semibold">Attribution Sources</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {data.analytics.topTrafficSources.map((source) => (
                <div
                  key={source.source}
                  className="rounded-lg border border-slate-200/70 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-transparent"
                >
                  <p className="font-medium capitalize">{source.source}</p>
                  <p className="text-xs text-muted">{source.count} events</p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 text-xs text-muted dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Invite</th>
                    <th className="px-4 py-3">Referred By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.latestWaitlist.map((userRow) => (
                    <tr key={userRow.id} className="border-b border-slate-200/70 dark:border-white/5">
                      <td className="px-4 py-3">{userRow.email}</td>
                      <td className="px-4 py-3 text-muted">{userRow.inviteCode}</td>
                      <td className="px-4 py-3 text-muted">{userRow.referralCode ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
