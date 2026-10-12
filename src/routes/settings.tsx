import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Shows the customer dashboard link only to the app's owner. */
function OwnerLink() {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (!id) return;
      void supabase.rpc("has_role", { _user_id: id, _role: "admin" }).then(({ data: ok }) => setIsOwner(Boolean(ok)));
    });
  }, []);
  if (!isOwner) return null;
  return (
    <Link to="/dashboard" className="btn-crayon w-full justify-center">
      See your customers
    </Link>
  );
}

import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

import { AccountChip } from "@/components/AccountChip";
import { PLAN_LABELS } from "@/lib/plan";
import { useAccount } from "@/lib/useAccount";
import { bookAllowance, pageAllowance } from "@/lib/usage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Color My Words" },
      { name: "description", content: "Your plan and how many coloring pages you have left this month." },
      { property: "og:title", content: "Settings — Color My Words" },
      { property: "og:description", content: "Your plan and pages left this month in Color My Words." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://colormywords.app/settings" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://colormywords.app/settings" }],
  }),
  component: Settings,
});

function Meter({ label, used, cap }: { label: string; used: number; cap: number }) {
  const unlimited = !Number.isFinite(cap);
  const left = unlimited ? null : Math.max(0, cap - used);
  const pct = unlimited || cap === 0 ? (unlimited ? 0 : 100) : Math.min(100, (used / cap) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{unlimited ? "Unlimited" : `${left} of ${cap} left`}</span>
      </div>
      {!unlimited && (
        <div className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function ManageButton() {
  const portal = useServerFn(createPortalSession);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        className="btn-crayon w-full justify-center"
        onClick={async () => {
          setError(null);
          const r = await portal({
            data: { returnUrl: `${window.location.origin}/settings`, environment: getStripeEnvironment() },
          });
          if ("error" in r) setError(r.error);
          else window.open(r.url, "_blank");
        }}
      >
        Manage subscription
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function Settings() {
  const { signedIn, plan, account, pageAllowance, bookAllowance } = useAccount();
  const pageCap = pageAllowance;
  const unlimited = !Number.isFinite(pageCap);

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <AccountChip />
      {!signedIn ? (
        <p className="font-semibold text-muted-foreground">Sign in to see your plan and pages left.</p>
      ) : (
        <section className="space-y-4 rounded-2xl border-2 border-border bg-card p-5">
          <p className="text-lg font-extrabold">Plan: {PLAN_LABELS[plan]}</p>
          <Meter label="Pages this month" used={account.pages} cap={pageCap} />
          <Meter label="Books this month" used={account.books} cap={bookAllowance} />
          <p className="text-xs font-semibold text-muted-foreground">Allowance resets on the 1st of each month.</p>
          {!unlimited && (
            <Link to="/plans" className="btn-crayon w-full justify-center">
              <Sparkles className="h-4 w-4" /> {plan === "free" ? "See plans" : "Upgrade to Unlimited"}
            </Link>
          )}
          {plan !== "free" && <ManageButton />}
        </section>
      )}
      {signedIn && <OwnerLink />}
    </main>
  );
}
