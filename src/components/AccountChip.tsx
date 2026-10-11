import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/useAccount";

/**
 * Shows who is signed in and lets them leave. Every screen that needs an
 * account uses this, so the signed-in state is never a stale button.
 */
export function AccountChip() {
  const { signedIn, email } = useAccount();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!signedIn) {
    return (
      <Link to="/auth" className="btn-crayon text-sm">
        Sign in
      </Link>
    );
  }

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
      <span className="rounded-full border-2 border-border bg-card px-3 py-1.5">
        {email?.split("@")[0] || "Signed in"}
      </span>
      <button type="button" onClick={() => void signOut()} className="btn-crayon text-sm">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
