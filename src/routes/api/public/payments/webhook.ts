import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { planForSubscription } from "@/lib/subscriptionPlan";

async function applySubscription(sub: any, env: StripeEnv, deleted = false) {
  const userId = sub.metadata?.userId;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.error("Subscription without a valid userId", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || null;
  const status = deleted ? "canceled" : sub.status;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("account_plans").upsert(
    {
      owner_id: userId,
      plan: planForSubscription(priceId, status),
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      stripe_subscription_id: sub.id,
      subscription_status: status,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );
  if (error) throw new Error(error.message);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          const event = await verifyWebhook(request, rawEnv);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await applySubscription(event.data.object, rawEnv);
              break;
            case "customer.subscription.deleted":
              await applySubscription(event.data.object, rawEnv, true);
              break;
            default:
              break;
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
