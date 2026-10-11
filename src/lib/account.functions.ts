/**
 * Server side of the coloring library.
 *
 * Every handler runs as the signed-in person (requireSupabaseAuth) and every
 * table is row-level-secured to owner_id = auth.uid(), so one person can never
 * read, change or delete another person's pages, books, counters or plan.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_LIMITS } from "./plan";
import type { SavedBook, SavedKind } from "./savedBooks";

export const MAX_BOOKS = 100;
const MAX_PAGES_PER_BOOK = 60;


/** Calendar month the counters belong to, e.g. "2026-10". */
function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const PAINTABLE = z.string().max(12_000_000);

const BOOK_INPUT = z.object({
  id: z.string().uuid().nullish(),
  title: z.string().min(1).max(200),
  savedAt: z.number().int(),
  pages: z.array(PAINTABLE).min(1).max(MAX_PAGES_PER_BOOK),
  paints: z.array(z.string().null()).optional(),
  pageTitles: z.array(z.string().max(200)).optional(),
  kind: z.enum(["page", "book"]).optional(),
  shareId: z.string().nullish(),
});

/** Reads the shelf as light rows: metadata plus the first picture for a cover. */
async function loadSummaries(supabase: any): Promise<SavedBook[]> {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, kind, page_count, share_id, saved_at")
    .order("saved_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: covers, coverError } = await supabase
    .from("book_pages")
    .select("book_id, art, paint, title")
    .eq("position", 0);
  if (coverError) throw new Error(coverError.message);

  const byBook = new Map<string, { art: string; paint: string | null; title: string }>();
  for (const row of covers ?? []) byBook.set(row.book_id, row);

  return (books ?? []).map((row: any) => {
    const cover = byBook.get(row.id);
    return {
      id: row.id,
      title: row.title,
      savedAt: new Date(row.saved_at).getTime(),
      pages: cover ? [cover.art] : [],
      paints: cover ? [cover.paint ?? null] : [],
      pageTitles: cover ? [cover.title] : [],
      kind: row.kind as SavedKind,
      pageCount: row.page_count,
      shareId: row.share_id ?? undefined,
    } satisfies SavedBook;
  });
}

/** The plan in force plus this month's counters, creating the row on first use. */
async function readAccount(supabase: any, userId: string) {
  const month = monthKey();

  const { data: planRow } = await supabase
    .from("account_plans")
    .select("plan")
    .eq("owner_id", userId)
    .maybeSingle();

  const { data: usageRow } = await supabase
    .from("usage")
    .select("month, pages, books")
    .eq("owner_id", userId)
    .maybeSingle();

  let pages = 0;
  let books = 0;
  if (!usageRow) {
    await supabase
      .from("usage")
      .upsert({ owner_id: userId, month, pages: 0, books: 0 }, { onConflict: "owner_id" });
  } else if (usageRow.month !== month) {
    // A new month starts the counters over.
    await supabase
      .from("usage")
      .update({ month, pages: 0, books: 0 })
      .eq("owner_id", userId);
  } else {
    pages = usageRow.pages;
    books = usageRow.books;
  }

  return {
    plan: (planRow?.plan ?? "free") as keyof typeof PLAN_LIMITS,
    month,
    pages,
    books,
  };
}

export const getEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await readAccount((context as any).supabase, (context as any).userId);
  });

/**
 * Takes one page or one book out of the month's allowance. The check and the
 * increment happen in a single conditional update, so two taps at once can't
 * both slip past the limit.
 */
export const consumeUsage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ kind: z.enum(["page", "book"]) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const userId = (context as any).userId;
    const account = await readAccount(supabase, userId);
    const limits = PLAN_LIMITS[account.plan];

    const used = data.kind === "page" ? account.pages : account.books;
    const cap = data.kind === "page" ? limits.pages : limits.books;
    if (!Number.isFinite(cap) || used < cap) {
      const column = data.kind === "page" ? "pages" : "books";
      const { data: updated, error } = await supabase
        .from("usage")
        .update({ [column]: used + 1 })
        .eq("owner_id", userId)
        .eq("month", account.month)
        .lt(column, Number.isFinite(cap) ? cap : Number.MAX_SAFE_INTEGER)
        .select("owner_id");
      if (error) throw new Error(error.message);
      if (!updated?.length) {
        return { ok: false, ...account };
      }
      return {
        ok: true,
        plan: account.plan,
        month: account.month,
        pages: data.kind === "page" ? used + 1 : account.pages,
        books: data.kind === "book" ? used + 1 : account.books,
      };
    }

    return { ok: false, ...account };
  });

export const listBookRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await loadSummaries((context as any).supabase);
  });

/** One book with every picture and painted layer. */
export const getBookRecord = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: book, error } = await supabase
      .from("books")
      .select("id, title, kind, page_count, share_id, saved_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!book) throw new Error("That book is no longer in your account.");

    const { data: rows, error: pageError } = await supabase
      .from("book_pages")
      .select("position, title, art, paint")
      .eq("book_id", data.id)
      .order("position", { ascending: true });
    if (pageError) throw new Error(pageError.message);

    return {
      id: book.id,
      title: book.title,
      savedAt: new Date(book.saved_at).getTime(),
      pages: (rows ?? []).map((row: any) => row.art),
      paints: (rows ?? []).map((row: any) => row.paint ?? null),
      pageTitles: (rows ?? []).map((row: any) => row.title),
      kind: book.kind as SavedKind,
      pageCount: book.page_count,
      shareId: book.share_id ?? undefined,
    } satisfies SavedBook;
  });

/** Creates or replaces a whole book and its pictures. */
export const saveBookRecord = createServerFn({ method: "POST" })
  .inputValidator(BOOK_INPUT)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const userId = (context as any).userId;
    const id = data.id ?? crypto.randomUUID();

    const { data: own } = await supabase
      .from("books")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();
    if (own && own.owner_id !== userId) {
      throw new Error("That book belongs to someone else, so it can't be changed.");
    }

    if (!own) {
      const { count } = await supabase
        .from("books")
        .select("id", { count: "exact", head: true });
      if ((count ?? 0) >= MAX_BOOKS) {
        throw new Error(`You can keep ${MAX_BOOKS} books. Delete one to save a new book.`);
      }
    }

    const kind: SavedKind = data.kind ?? (data.pages.length > 1 ? "book" : "page");
    const { error } = await supabase.from("books").upsert(
      {
        id,
        owner_id: userId,
        title: data.title.trim() || "My coloring book",
        kind,
        page_count: data.pages.length,
        share_id: data.shareId ?? null,
        saved_at: new Date(data.savedAt).toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    const { error: clearError } = await supabase.from("book_pages").delete().eq("book_id", id);
    if (clearError) throw new Error(clearError.message);

    const rows = data.pages.map((art, i) => ({
      book_id: id,
      owner_id: userId,
      position: i,
      title: data.pageTitles?.[i]?.trim() || `Page ${i + 1}`,
      art,
      paint: data.paints?.[i] ?? null,
    }));
    const { error: insertError } = await supabase.from("book_pages").insert(rows);
    if (insertError) throw new Error(insertError.message);

    return await loadSummaries(supabase);
  });

/** Stores one page's coloring without re-sending the whole book. */
export const savePagePaint = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.string().uuid(), index: z.number().int().min(0), paint: z.string().null() }),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { error } = await supabase
      .from("book_pages")
      .update({ paint: data.paint })
      .eq("book_id", data.id)
      .eq("position", data.index);
    if (error) throw new Error(error.message);
    return true;
  });

export const deleteBookRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;

    // Keep a copy of what was there so the app can offer to put it back.
    const { data: bookRow } = await supabase
      .from("books")
      .select("id, title, kind, page_count, share_id, saved_at")
      .eq("id", data.id)
      .maybeSingle();
    const { data: pageRows } = await supabase
      .from("book_pages")
      .select("position, title, art, paint")
      .eq("book_id", data.id)
      .order("position", { ascending: true });

    const { error } = await supabase.from("books").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    const removed: SavedBook | null = bookRow
      ? {
          id: bookRow.id,
          title: bookRow.title,
          savedAt: new Date(bookRow.saved_at).getTime(),
          pages: (pageRows ?? []).map((row: any) => row.art),
          paints: (pageRows ?? []).map((row: any) => row.paint ?? null),
          pageTitles: (pageRows ?? []).map((row: any) => row.title),
          kind: bookRow.kind as SavedKind,
          pageCount: bookRow.page_count,
          shareId: bookRow.share_id ?? undefined,
        }
      : null;

    return { books: await loadSummaries(supabase), removed };
  });

export const renameBookRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { error } = await supabase
      .from("books")
      .update({ title: data.title.trim() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return await loadSummaries(supabase);
  });

/** Removes one picture from a book, and the book itself when it runs empty. */
export const deleteBookPageRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), index: z.number().int().min(0) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { error } = await supabase
      .from("book_pages")
      .delete()
      .eq("book_id", data.id)
      .eq("position", data.index);
    if (error) throw new Error(error.message);

    const { data: left } = await supabase
      .from("book_pages")
      .select("id")
      .eq("book_id", data.id);
    const remaining = left?.length ?? 0;
    if (remaining === 0) {
      const { error: bookError } = await supabase.from("books").delete().eq("id", data.id);
      if (bookError) throw new Error(bookError.message);
    } else {
      // Close the gap the removed picture left so positions stay 0..n-1.
      const { data: rows } = await supabase
        .from("book_pages")
        .select("id, position")
        .eq("book_id", data.id)
        .order("position", { ascending: true });
      for (const [i, row] of (rows ?? []).entries()) {
        if (row.position === i) continue;
        await supabase.from("book_pages").update({ position: i }).eq("id", row.id);
      }
      await supabase.from("books").update({ page_count: remaining }).eq("id", data.id);
    }
    return await loadSummaries(supabase);
  });

/**
 * Deletes a standalone page and takes the same picture out of every book that
 * used it. Books left with nothing in them go too.
 */
export const deletePageAndCascadeRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;

    const { data: page } = await supabase
      .from("books")
      .select("id, kind")
      .eq("id", data.id)
      .maybeSingle();
    if (!page || page.kind !== "page") return await loadSummaries(supabase);

    const { data: rows } = await supabase.from("book_pages").select("art").eq("book_id", data.id);
    const art = rows?.[0]?.art;
    if (art) {
      const { error } = await supabase
        .from("book_pages")
        .delete()
        .eq("art", art)
        .neq("book_id", data.id);
      if (error) throw new Error(error.message);
    }

    const { error: dropError } = await supabase.from("books").delete().eq("id", data.id);
    if (dropError) throw new Error(dropError.message);

    const { data: allBooks } = await supabase.from("books").select("id");
    const { data: stillUsed } = await supabase.from("book_pages").select("book_id");
    const used = new Set((stillUsed ?? []).map((row: any) => row.book_id));
    const emptied = (allBooks ?? []).filter((row: any) => !used.has(row.id)).map((row: any) => row.id);
    if (emptied.length) {
      const { error } = await supabase.from("books").delete().in("id", emptied);
      if (error) throw new Error(error.message);
    }

    return await loadSummaries(supabase);
  });

/**
 * Copies what was saved on this device into the signed-in person's space.
 * Pictures already in the account are skipped, so it is safe to run twice.
 */
export const importFromDevice = createServerFn({ method: "POST" })
  .inputValidator(z.object({ records: z.array(BOOK_INPUT).max(MAX_BOOKS) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const userId = (context as any).userId;

    const { data: existing } = await supabase.from("book_pages").select("art");
    const seen = new Set((existing ?? []).map((row: any) => row.art));

    let imported = 0;
    for (const record of data.records) {
      if (!record.pages.length || seen.has(record.pages[0]!)) continue;
      const id = crypto.randomUUID();
      const kind: SavedKind = record.kind ?? (record.pages.length > 1 ? "book" : "page");
      const { error } = await supabase.from("books").insert({
        id,
        owner_id: userId,
        title: record.title.trim() || "My coloring book",
        kind,
        page_count: record.pages.length,
        share_id: record.shareId ?? null,
        saved_at: new Date(record.savedAt).toISOString(),
      });
      if (error) continue;
      const { error: pageError } = await supabase.from("book_pages").insert(
        record.pages.map((art, i) => ({
          book_id: id,
          owner_id: userId,
          position: i,
          title: record.pageTitles?.[i]?.trim() || `Page ${i + 1}`,
          art,
          paint: record.paints?.[i] ?? null,
        })),
      );
      if (pageError) {
        await supabase.from("books").delete().eq("id", id);
        continue;
      }
      record.pages.forEach((art) => seen.add(art));
      imported += 1;
    }

    return { imported, skipped: data.records.length - imported };
  });
