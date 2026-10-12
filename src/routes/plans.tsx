import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { MusicPlayer } from "@/components/MusicPlayer";
import { PaymentTestModeBanner, PlanCheckout } from "@/components/PlanCheckout";
import { refreshAccount, rememberDestination } from "@/lib/accountState";
import { PLAN_LABELS, type PlanId } from "@/lib/plan";
import { PLAN_TO_PRICE } from "@/lib/subscriptionPlan";
import { useAccount } from "@/lib/useAccount";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  validateSearch: (s: Record<string, unknown>): { checkout?: string | undefined } => ({
    checkout: typeof s["checkout"] === "string" ? s["checkout"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plans — Color My Words" },
      {
        name: "description",
        content:
          "Color a page free, or pick Coloring Plus ($9.99/month, 15 pages) or Coloring Unlimited ($24.99/month).",
      },
      { property: "og:title", content: "Plans — Color My Words" },
      {
        property: "og:description",
        content: "Free coloring with one page a month, or a plan with more pages, saved books and printing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://colormywords.app/plans" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://colormywords.app/plans" }],
  }),
  component: Plans,
});

type Tier = { id: PlanId; price: string; every: string; blurb: string; includes: string[] };

const TIERS: Tier[] = [
  {
    id: "free",
    price: "$0",
    every: "",
    blurb: "Color a page and see how it feels.",
    includes: ["1 AI page each month", "Every brush, crayon, marker and color", "Kept for 24 hours", "No saving, printing or sharing"],
  },
  {
    id: "standard",
    price: "$9.99",
    every: "each month",
    blurb: "For anyone coloring every week.",
    includes: ["15 AI pages each month", "3 books each month in My Bookshelf", "Save, print as PDF and download as ZIP", "Share a gallery link"],
  },
  {
    id: "premium",
    price: "$24.99",
    every: "each month",
    blurb: "For a whole family, or a classroom.",
    includes: ["Unlimited AI pages", "Unlimited books in My Bookshelf", "Everything in Coloring Plus", "Printed book for $24.99 — coming soon"],
  },
];

const RANK: Record<PlanId, number> = { free: 0, standard: 1, premium: 2 };

function Plans() {
  const { signedIn, plan } = useAccount();
  const { checkout } = Route.useSearch();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (checkout !== "done" || !signedIn) return;
    setNotice("Thanks! Your plan is being switched on…");
    let tries = 0;
    const tick = async () => {
      tries += 1;
      const s = await refreshAccount().catch(() => null);
      if (s && s.plan !== "free") {
        setNotice(`You're on ${PLAN_LABELS[s.plan]} now. Happy coloring!`);
        return;
      }
      if (tries < 10) setTimeout(tick, 2000);
      else setNotice("Payment received. Your plan will show up in a moment — refresh Settings soon.");
    };
    tick();
  }, [checkout, signedIn]);

  function pick(id: PlanId) {
    if (!signedIn) {
      rememberDestination("/plans");
      navigate({ to: "/auth" });
      return;
    }
    setChosen(id);
  }

  return (
    <>
      <PaymentTestModeBanner />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/" className="btn-crayon">
          <ArrowLeft className="h-4 w-4" /> Back to the cover
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Plans</h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          You're on {PLAN_LABELS[plan]}. Pick a plan whenever you'd like more.
        </p>
        {notice && <p className="mt-3 rounded-xl bg-primary/10 p-3 font-bold">{notice}</p>}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {TIERS.map((tier) => {
            const current = tier.id === plan;
            const canBuy = !!PLAN_TO_PRICE[tier.id] && RANK[tier.id] > RANK[plan];
            return (
              <section key={tier.id} className={cn("paper-card flex flex-col p-5", current && "border-primary")}>
                <h2 className="text-xl font-extrabold">{PLAN_LABELS[tier.id]}</h2>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{tier.blurb}</p>
                <p className="mt-4 text-3xl font-extrabold">
                  {tier.price}
                  {tier.every && <span className="ml-1 text-sm font-bold"> {tier.every}</span>}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {tier.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm font-semibold">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                {canBuy ? (
                  <button type="button" onClick={() => pick(tier.id)} className="btn-crayon mt-5 w-full justify-center">
                    <Sparkles className="h-4 w-4" /> Upgrade for {tier.price}/month
                  </button>
                ) : (
                  <p className="mt-5 text-center text-sm font-extrabold text-muted-foreground">
                    {current ? "Your plan" : tier.id === "free" ? "Included" : "Change in Settings"}
                  </p>
                )}
              </section>
            );
          })}
        </div>

        {chosen && PLAN_TO_PRICE[chosen] && (
          <section className="mt-8">
            <h2 className="text-xl font-extrabold">Checkout — {PLAN_LABELS[chosen]}</h2>
            <PlanCheckout key={chosen} priceId={PLAN_TO_PRICE[chosen]!} />
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/books" search={{ view: "bookshelf" }} className="btn-crayon text-sm">
            <BookOpen className="h-4 w-4" /> My Bookshelf
          </Link>
        </div>

        <MusicPlayer />
      </main>
    </>
  );
}
