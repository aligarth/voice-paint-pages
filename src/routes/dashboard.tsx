import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/useAccount";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Customers — Color My Words" },
      { name: "description", content: "Owner view of sign-ups, confirmed emails and paid upgrades." },
      { property: "og:title", content: "Customers — Color My Words" },
      { property: "og:description", content: "Owner view of sign-ups, confirmed emails and paid upgrades." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Stats = {
  signups_total: number;
  signups_period: number;
  confirmed_total: number;
  confirmed_period: number;
  paid_by_plan: Record<string, number>;
  upgrades_period: number;
  printed_books_total: number;
  printed_books_period: number;
  recent: { email: string; created_at: string; confirmed: boolean; plan: string; environment: string | null }[];
};

const PLAN_NAMES: Record<string, string> = { standard: "Coloring Plus", premium: "Coloring Unlimited", free: "Free" };

function Card({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="paper-card p-5">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-4xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{sub}</p>
    </div>
  );
}

function Dashboard() {
  const { signedIn } = useAccount();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    setError(null);
    void supabase.rpc("admin_customer_stats", { _days: days }).then(({ data, error: err }) => {
      if (err) setError(err.message.includes("Not allowed") ? "This page is only for the app's owner." : err.message);
      else setStats(data as unknown as Stats);
    });
  }, [signedIn, days]);

  const paidTotal = stats ? Object.values(stats.paid_by_plan).reduce((a, b) => a + b, 0) : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/settings" className="btn-crayon mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold">Your customers</h1>

      {!signedIn && <p className="mt-4 font-semibold">Sign in to see your customers.</p>}
      {error && <p className="mt-4 font-bold text-destructive">{error}</p>}
      {signedIn && !stats && !error && <Loader2 className="mt-6 h-6 w-6 animate-spin" />}

      {stats && (
        <>
          <div className="mt-4 flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`btn-crayon text-sm ${d === days ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setDays(d)}
              >
                Last {d} days
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="New sign-ups" value={stats.signups_period} sub={`${stats.signups_total} all time`} />
            <Card label="Confirmed emails" value={stats.confirmed_period} sub={`${stats.confirmed_total} all time`} />
            <Card label="Paid upgrades" value={stats.upgrades_period} sub={`${paidTotal} paying now`} />
            <Card label="Printed books sold" value={stats.printed_books_period} sub={`${stats.printed_books_total} all time`} />
          </div>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            Paying now:{" "}
            {Object.keys(stats.paid_by_plan).length
              ? Object.entries(stats.paid_by_plan).map(([p, n]) => `${PLAN_NAMES[p] ?? p} ${n}`).join(" · ")
              : "nobody yet"}
          </p>

          <h2 className="mt-8 text-xl font-extrabold">Newest accounts</h2>
          <div className="paper-card mt-3 overflow-x-auto p-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2">Email</th>
                  <th className="p-2">Joined</th>
                  <th className="p-2">Email confirmed</th>
                  <th className="p-2">Plan</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.email + r.created_at} className="border-t border-border">
                    <td className="p-2 font-semibold">{r.email}</td>
                    <td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-2">{r.confirmed ? "Yes" : "Not yet"}</td>
                    <td className="p-2">
                      {PLAN_NAMES[r.plan] ?? r.plan}
                      {r.plan !== "free" && r.environment === "sandbox" ? " (test)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
