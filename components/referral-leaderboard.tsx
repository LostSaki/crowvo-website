"use client";

import { useEffect, useState } from "react";

type Leader = {
  rank: number;
  email: string;
  inviteCode: string;
  referrals: number;
};

export function ReferralLeaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    fetch("/api/referrals/leaderboard")
      .then((response) => response.json())
      .then((data: { leaders?: Leader[] }) => setLeaders(data.leaders ?? []))
      .catch(() => setLeaders([]));
  }, []);

  if (leaders.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
      <h3 className="text-2xl font-semibold">Referral leaderboard</h3>
      <p className="mt-2 text-sm text-muted">Top ambassadors unlocking faster beta invites.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {leaders.slice(0, 6).map((leader) => (
          <div
            key={leader.inviteCode}
            className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-transparent"
          >
            <p className="text-indigo-500 dark:text-indigo-300">#{leader.rank}</p>
            <p>{leader.email}</p>
            <p className="text-muted">{leader.referrals} successful referrals</p>
          </div>
        ))}
      </div>
    </section>
  );
}
