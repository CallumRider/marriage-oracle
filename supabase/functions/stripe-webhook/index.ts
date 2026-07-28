import Stripe from "npm:stripe@22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const stripe = new Stripe(stripeSecret);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    getSupabaseSecretKey(),
    { auth: { persistSession: false, autoRefreshToken: false } }
);

Deno.serve(async (request) => {
    if (request.method !== "POST") {
        return new Response("Method not allowed.", { status: 405 });
    }
    if (!stripeSecret || !webhookSecret) {
        return new Response("Webhook secrets are not configured.", { status: 500 });
    }

    const signature = request.headers.get("Stripe-Signature") ?? "";
    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (error) {
        console.error("Invalid Stripe webhook signature", error);
        return new Response("Invalid signature.", { status: 400 });
    }

    if (
        event.type !== "checkout.session.completed"
        && event.type !== "checkout.session.async_payment_succeeded"
    ) {
        return Response.json({ received: true, ignored: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
        return Response.json({ received: true, pending: true });
    }

    const readingId = String(session.metadata?.reading_id ?? "");
    const userId = String(session.metadata?.user_id ?? "");
    if (
        session.metadata?.product !== "marriage_oracle_full_reading"
        || !isUuid(readingId)
        || !isUuid(userId)
        || session.amount_total !== 99
        || String(session.currency ?? "").toLowerCase() !== "gbp"
    ) {
        console.error("Stripe session metadata or amount did not match", session.id);
        return new Response("Unexpected Checkout Session.", { status: 400 });
    }

    const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? "";

    const { data, error } = await admin.rpc("grant_paid_reading_access", {
        p_user_id: userId,
        p_reading_id: readingId,
        p_session_id: session.id,
        p_payment_intent_id: paymentIntentId,
        p_amount_total: session.amount_total,
        p_currency: session.currency,
        p_event_id: event.id,
        p_event_type: event.type
    });

    if (error) {
        console.error("Could not grant paid reading access", error);
        return new Response("Database update failed.", { status: 500 });
    }

    return Response.json({ received: true, result: data });
});

function getSupabaseSecretKey() {
    const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (modern) {
        try {
            const keys = JSON.parse(modern);
            const value = keys.default ?? Object.values(keys)[0];
            if (typeof value === "string" && value) return value;
        } catch {
            // Fall through to the legacy key.
        }
    }
    return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

