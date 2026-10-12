import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Loader2, Lock, Mail } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { takeDestination } from "@/lib/accountState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Color My Words" },
      {
        name: "description",
        content:
          "Sign in to keep your coloring pages, books and premium plan private to you, on any device.",
      },
      { property: "og:title", content: "Sign in — Color My Words" },
      {
        property: "og:description",
        content: "Your pages, books and plan — private to your own account.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://colormywords.app/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://colormywords.app/auth" }],
  }),
  component: AuthPage,
});

function friendly(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "That email and password don't match. Try again, or create an account.";
  }
  if (text.includes("email not confirmed")) {
    return "Your email still needs confirming. Open the link we sent you, then sign in.";
  }
  if (text.includes("already registered") || text.includes("already exists")) {
    return "That email already has an account. Sign in instead.";
  }
  if (text.includes("rate limit") || text.includes("too many requests")) {
    return "That was a bit quick. Wait a minute and try once more.";
  }
  if (text.includes("password")) {
    return "Please choose a password with at least 6 characters.";
  }
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const finish = () => {
    const dest = takeDestination();
    void navigate({ to: dest.startsWith("/books") ? "/books" : "/" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const clean = email.trim().toLowerCase();

    if (!clean || !password) {
      setError("Please fill in both your email and password.");
      setBusy(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email: clean,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (err) {
        setError(friendly(err.message));
        return;
      }
      if (data.session) {
        finish();
        return;
      }
      setAwaitingConfirm(true);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: clean,
      password,
    });
    setBusy(false);
    if (err) {
      setError(friendly(err.message));
      return;
    }
    finish();
  };

  const resetPassword = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError("Type your email first, then tap forgot password.");
      return;
    }
    setError(null);
    setNotice(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(friendly(err.message));
      return;
    }
    setNotice(
      "If that email has an account, a reset link is on its way. Not there? Check your junk folder and tap \"Not Junk\".",
    );
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link to="/" className="btn-crayon">
        <ArrowLeft className="h-4 w-4" /> Back to the cover
      </Link>

      <section className="paper-card mt-6 p-6">
        <h1 className="text-3xl font-extrabold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your pages, books and plan stay private to you — and follow you to any phone or computer.
        </p>

        {awaitingConfirm ? (
          <div className="mt-6 rounded-2xl border-2 border-border bg-card p-4 text-center">
            <p className="text-lg font-extrabold">Check your email</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              We sent a confirmation link to {email.trim().toLowerCase()}. Open it to finish
              setting up, then come back and sign in.
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Not there? Look in your junk folder and tap "Not Junk" — that makes sure our next
              emails reach your inbox.
            </p>
            <button
              type="button"
              onClick={() => {
                setAwaitingConfirm(false);
                setMode("signin");
              }}
              className="btn-crayon mt-4"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block text-sm font-bold">
              Email
              <div className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-transparent px-1 py-3 font-semibold outline-none"
                />
              </div>
            </label>

            <label className="block text-sm font-bold">
              Password
              <div className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-3">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent px-1 py-3 font-semibold outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              {busy
                ? "One moment…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create my account"}
            </button>

            {error && <p className="text-sm font-bold text-primary">{error}</p>}
            {notice && <p className="text-sm font-bold text-primary">{notice}</p>}
          </form>
        )}

        {!awaitingConfirm && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setNotice(null);
              }}
              className="rounded-full border-2 border-border px-4 py-2 hover:bg-muted"
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
            <button
              type="button"
              onClick={() => void resetPassword()}
              className="rounded-full px-2 py-2 underline"
            >
              Forgot password?
            </button>
          </div>
        )}
      </section>

      <p className={cn("mt-4 text-center text-xs font-semibold text-muted-foreground")}>
        Nothing is shared with anyone else. Not even us, unless a plan says so.
      </p>
    </main>
  );
}
