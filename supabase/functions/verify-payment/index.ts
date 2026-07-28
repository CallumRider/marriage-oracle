import Stripe from "npm:stripe@22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const siteUrl = normaliseSiteUrl(Deno.env.get("SITE_URL") ?? "");
const stripe = new Stripe(stripeSecret);
const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    getSupabaseSecretKey(),
    { auth: { persistSession: false, autoRefreshToken: false } }
);

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders(request) });
    }
    if (request.method !== "POST") {
        return json(request, { error: "Method not allowed." }, 405);
    }
    if (!stripeSecret) {
        return json(request, { error: "Payment secrets are not configured." }, 500);
    }

    try {
        const user = await requireUser(request);
        const body = await request.json().catch(() => ({}));
        const sessionId = String(body?.sessionId ?? "").trim();

        if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
            return json(request, { error: "A valid Stripe session is required." }, 400);
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const readingId = String(session.metadata?.reading_id ?? "");
        const metadataUserId = String(session.metadata?.user_id ?? "");

        if (
            session.metadata?.product !== "marriage_oracle_full_reading"
            || metadataUserId !== user.id
            || !isUuid(readingId)
        ) {
            return json(request, { error: "This payment does not belong to your reading." }, 403);
        }

        if (
            session.status !== "complete"
            || session.payment_status !== "paid"
            || session.amount_total !== 99
            || String(session.currency ?? "").toLowerCase() !== "gbp"
        ) {
            return json(request, { error: "Stripe has not confirmed this payment as complete." }, 409);
        }

        const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? "";

        const { data, error } = await admin.rpc("grant_paid_reading_access", {
            p_user_id: user.id,
            p_reading_id: readingId,
            p_session_id: session.id,
            p_payment_intent_id: paymentIntentId,
            p_amount_total: session.amount_total,
            p_currency: session.currency,
            p_event_id: null,
            p_event_type: "checkout.return.verify"
        });

        if (error) throw error;

        return json(request, {
            ok: true,
            readingId,
            accessStatus: data?.access_status ?? "paid",
            alreadyUnlocked: Boolean(data?.already_unlocked)
        });
    } catch (error) {
        console.error("verify-payment failed", error);
        return json(request, { error: safeMessage(error) }, statusFor(error));
    }
});

async function requireUser(request: Request) {
    const authorization = request.headers.get("Authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new AuthError();

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw new AuthError();
    return data.user;
}

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

function normaliseSiteUrl(value: string) {
    try {
        const url = new URL(value);
        url.hash = "";
        url.search = "";
        return url.toString();
    } catch {
        return "";
    }
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function allowedOrigin(request: Request) {
    const origin = request.headers.get("Origin") ?? "";
    const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? siteUrl)
        .split(",")
        .map((item) => {
            try {
                return new URL(item.trim()).origin;
            } catch {
                return item.trim().replace(/\/$/, "");
            }
        })
        .filter(Boolean);
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    return configured.includes(origin.replace(/\/$/, "")) || local ? origin : "";
}

function corsHeaders(request: Request) {
    return {
        "Access-Control-Allow-Origin": allowedOrigin(request),
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin"
    };
}

function json(request: Request, body: unknown, status = 200) {
    return Response.json(body, {
        status,
        headers: { ...corsHeaders(request), "Cache-Control": "no-store" }
    });
}

function safeMessage(error: unknown) {
    if (error instanceof AuthError) return "Sign in before confirming the payment.";
    return "The completed payment could not be confirmed yet.";
}

function statusFor(error: unknown) {
    return error instanceof AuthError ? 401 : 500;
}

class AuthError extends Error {}

