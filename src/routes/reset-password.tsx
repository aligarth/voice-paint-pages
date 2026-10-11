import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Loader2, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Color My World" },
      {
        name: "description",
        content: "Set a new password for your Color My World account.",
      },
      { property: "og:title", content: "Choose a new password — Color My World" },
      {
        property: "og:description",
        content: "Set a new password for your Color My World account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const recovering = params.get("type") === "recovery";
    let active = true;
    let tries = 0;

    // The link in the email signs you in for this one purpose. Give it a
    // moment to land before deciding the link wasn't used.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setCanReset(true);
        return;
      }
      tries += 1;
      if (recovering && tries < 10) {
        window.setTimeout(() => void check(), 300);
      } else if (!recovering) {
        setCanReset(true);
      }
    };

    void check();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("password")
          ? "Please choose a password with at least 6 characters."
          : err.message,
      );
      return;
    }
    setDone(true);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link to="/" className="btn-crayon">
        <ArrowLeft className="h-4 w-4" /> Back to the cover
      </Link>

      <section className="paper-card mt-6 p-6">
        <h1 className="text-3xl font-extrabold">Choose a new password</h1>

        {done ? (
          <div className="mt-6 text-center">
            <p className="text-lg font-extrabold">Your password is changed.</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              You can color on from here.
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="btn-crayon mt-4"
            >
              Start coloring
            </button>
          </div>
        ) : canReset ? (
          <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block text-sm font-bold">
              New password
              <div className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-3">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {busy ? "Saving…" : "Save new password"}
            </button>
            {error && <p className="text-sm font-bold text-primary">{error}</p>}
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-sm font-semibold text-muted-foreground">
              This page only works from the reset link in your email. Open that link, or ask for a
              new one from the sign-in screen.
            </p>
            <Link to="/auth" className="btn-crayon mt-4">
              Go to sign in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
