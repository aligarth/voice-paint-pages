import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Check, Sparkles } from "lucide-react";

import { MusicPlayer } from "@/components/MusicPlayer";
import { PLAN_LABELS, currentPlan, type PlanId } from "@/lib/plan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Plans — Color My World" },
      {
        name: "description",
        content:
          "Color a page free, or pick a plan for more pages every month, saved books, printing and a printed book for $1.",
      },
      { property: "og:title", content: "Plans — Color My World" },
      {
        property: "og:description",
        content:
          "Free coloring with one page a month, or a plan with more pages, saved books, printing and a printed book for $1.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plans,
});

type Tier = {
  id: PlanId;
  price: string;
  every: string;
  blurb: string;
  includes: string[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    price: "$0",
    every: "",
    blurb: "Color a page and see how it feels.",
    includes: [
      "1 AI page each month",
      "Every brush, crayon, marker and color",
      "Kept for 24 hours",
      "No saving, printing or sharing",
    ],
  },
  {
    id: "standard",
    price: "$9.99",
    every: "each month",
    blurb: "For anyone coloring every week.",
    includes: [
      "15 AI pages each month",
      "3 books each month in My Bookshelf",
      "Save, print as PDF and download as ZIP",
      "Share a gallery link",
    ],
  },
  {
    id: "premium",
    price: "$24.99",
    every: "each month",
    blurb: "For a whole family, or a classroom.",
    includes: [
      "Unlimited AI pages",
      "Unlimited books in My Bookshelf",
      "Everything in Coloring Plus",
      "Printed book for $24.99 — up to 10 pages",
    ],
  },
];

function Plans() {
  const plan = currentPlan();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="btn-crayon">
        <ArrowLeft className="h-4 w-4" /> Back to the cover
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Plans</h1>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">
        You're on {PLAN_LABELS[plan]}. Pick a plan whenever you'd like more.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <section
            key={tier.id}
            className={cn("paper-card flex flex-col p-5", tier.id === plan && "border-primary")}
          >
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
            <button
              type="button"
              disabled
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-muted px-5 py-2.5 text-sm font-extrabold text-muted-foreground"
            >
              <Sparkles className="h-4 w-4" /> Coming soon
            </button>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold text-muted-foreground">
        Sign-up isn't open yet — no payment method is connected, so nothing is charged. When it
        opens, the printed book ($1, up to 10 pages) needs a payment method and a shipping address.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/books" search={{ view: "bookshelf" }} className="btn-crayon text-sm">
          <BookOpen className="h-4 w-4" /> My Bookshelf
        </Link>
      </div>

      <MusicPlayer />
    </main>
  );
}
