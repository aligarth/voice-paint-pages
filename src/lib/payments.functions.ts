import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "./stripe.server";
import { PRICE_TO_PLAN } from "./subscriptionPlan";
import { PRINTED_BOOK_PRICE_ID } from "./printedBook";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data[0]) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

function checkEnv(env: unknown): StripeEnv {
  if (env !== "sandbox" && env !== "live") throw new Error("Invalid environment");
  return env;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv; bookId?: string | undefined }) => {
      const isBook = data.priceId === PRINTED_BOOK_PRICE_ID;
      if (!(data.priceId in PRICE_TO_PLAN) && !isBook) throw new Error("Invalid priceId");
      if (isBook && (typeof data.bookId !== "string" || !/^[0-9a-f-]{36}$/i.test(data.bookId))) {
        throw new Error("Choose a book first");
      }
      if (typeof data.returnUrl !== "string" || data.returnUrl.length > 500) throw new Error("Invalid returnUrl");
      return { ...data, environment: checkEnv(data.environment) };
    },
  )
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { userId, claims, supabase } = context as any;
      const email = (claims?.email as string | undefined) ?? undefined;
      const isBook = data.priceId === PRINTED_BOOK_PRICE_ID;
      if (isBook) {
        const { data: owned } = await supabase.from("books").select("id").eq("id", data.bookId).maybeSingle();
        if (!owned) return { error: "That book isn't on your shelf." };
      }
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) throw new Error("Price not found");
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      let description: string | undefined;
      if (isBook) {
        const productId = typeof price.product === "string" ? price.product : price.product.id;
        description = (await stripe.products.retrieve(productId)).name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: isBook ? "payment" : "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        metadata: { userId, managed_payments: "true", ...(isBook ? { bookId: data.bookId! } : {}) },
        ...(isBook
          ? { payment_intent_data: { description } }
          : { subscription_data: { metadata: { userId } } }),
      } as unknown as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => ({
    ...data,
    environment: checkEnv(data.environment),
  }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { supabase, userId } = context as any;
    const { data: row } = await supabase
      .from("account_plans")
      .select("stripe_customer_id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!row?.stripe_customer_id) return { error: "No subscription found yet." };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: row.stripe_customer_id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
