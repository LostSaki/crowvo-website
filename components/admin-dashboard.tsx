"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase-client";

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
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        const token = await nextUser.getIdToken();
        const response = await fetch("/api/admin/overview", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("You are authenticated but not authorized as admin.");
        }
        const payload = (await response.json()) as AdminData;
        setData(payload);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function exportCsv() {
    if (!user) {
      return;
    }
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/waitlist", {
      headers: { authorization: `Bearer ${token}` },
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted">Firebase-secured analytics, referral growth, and login security monitoring.</p>
        </div>
        {!user ? (
          <button
            onClick={() => signInWithPopup(firebaseAuth, googleProvider)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in with Google
          </button>
        ) : (
          <button
            onClick={() => signOut(firebaseAuth)}
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
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
              <p className="text-xs text-muted">Total waitlist users</p>
              <p className="mt-1 text-2xl font-semibold">{data.waitlistCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
              <p className="text-xs text-muted">Investor leads</p>
              <p className="mt-1 text-2xl font-semibold">{data.investorCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
              <p className="text-xs text-muted">Export waitlist</p>
              <button onClick={exportCsv} className="mt-2 text-sm text-indigo-600 dark:text-indigo-300">
                Download CSV
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
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

            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Analytics Snapshot</h2>
              <div className="mt-3 space-y-2 text-sm">
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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
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

          <section className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-white/15 dark:bg-white/5">
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
