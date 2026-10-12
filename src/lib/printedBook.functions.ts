import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOOK = z.object({ bookId: z.string().uuid() });

/** Whether the signed-in person has paid for a printed copy of this book. */
export const getPrintedBookStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BOOK.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: rows } = await supabase
      .from("book_purchases")
      .select("bonus_added")
      .eq("owner_id", userId)
      .eq("book_id", data.bookId);
    const list = (rows ?? []) as { bonus_added: boolean }[];
    return { purchased: list.length > 0, bonusAdded: list.some((r) => r.bonus_added) };
  });

/**
 * Claims the one-time bonus pages for a paid book. Returns true only the first time,
 * so a refresh or a second tab can never add the bonus pages twice.
 */
export const claimPrintedBookBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BOOK.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: already } = await supabaseAdmin
      .from("book_purchases")
      .select("id")
      .eq("owner_id", userId)
      .eq("book_id", data.bookId)
      .eq("bonus_added", true)
      .limit(1);
    if (already?.length) return { claimed: false };
    const { data: open } = await supabaseAdmin
      .from("book_purchases")
      .select("id")
      .eq("owner_id", userId)
      .eq("book_id", data.bookId)
      .eq("bonus_added", false)
      .limit(1);
    const row = open?.[0];
    if (!row) return { claimed: false };
    const { data: updated } = await supabaseAdmin
      .from("book_purchases")
      .update({ bonus_added: true, status: "ready" })
      .eq("id", row.id)
      .eq("bonus_added", false)
      .select("id");
    return { claimed: Boolean(updated?.length) };
  });
