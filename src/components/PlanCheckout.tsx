import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { createCheckoutSession } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export function PlanCheckout({ priceId }: { priceId: string }) {
  const create = useServerFn(createCheckoutSession);
  const fetchClientSecret = useCallback(async () => {
    const result = await create({
      data: {
        priceId,
        returnUrl: `${window.location.origin}/plans?checkout=done`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not start");
    return result.clientSecret;
  }, [create, priceId]);

  return (
    <div className="mt-6 rounded-2xl border-2 border-border bg-card p-2">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export function PaymentTestModeBanner() {
  const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;
  if (!token) {
    return (
      <div className="w-full border-b border-destructive bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Real payments aren't switched on yet for this site.
      </div>
    );
  }
  if (token.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-accent bg-accent/30 px-4 py-2 text-center text-sm text-accent-foreground">
        All payments made in the preview are in test mode.{" "}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Read more
        </a>
      </div>
    );
  }
  return null;
}
