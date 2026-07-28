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
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }
    if (request.method !== "POST") {
        return json(request, { error: "Method not allowed." }, 405);
    }
    if (!stripeSecret || !siteUrl) {
        return json(request, { error: "Payment secrets are not configured." }, 500);
    }

    try {
        const user = await requireUser(request);
        const body = await request.json().catch(() => ({}));
        const readingId = String(body?.readingId ?? "").trim();

        if (!isUuid(readingId)) {
            return json(request, { error: "A valid completed reading is required." }, 400);
        }

        const { data: reading, error: readingError } = await admin
            .from("readings")
            .select("id, user_id, status, access_status")
            .eq("id", readingId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (readingError) throw readingError;
        if (!reading || reading.status !== "completed") {
            return json(request, { error: "Completed reading not found." }, 404);
        }
        if (reading.access_status !== "locked") {
            return json(request, {
                ok: true,
                alreadyUnlocked: true,
                readingId: reading.id,
                accessStatus: reading.access_status
            });
        }

        const metadata = {
            product: "marriage_oracle_full_reading",
            reading_id: reading.id,
            user_id: user.id
        };
        const successUrl = appendQuery(
            siteUrl,
            "payment=success&session_id={CHECKOUT_SESSION_ID}"
        );
        const cancelUrl = appendQuery(siteUrl, "payment=cancelled");

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: user.email ?? undefined,
            client_reference_id: reading.id,
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: "gbp",
                    unit_amount: 99,
                    product_data: {
                        name: "The Marriage Oracle — Full Reading",
                        description: "Permanent access to one completed entertainment reading."
                    }
                }
            }],
            metadata,
            payment_intent_data: { metadata },
            success_url: successUrl,
            cancel_url: cancelUrl,
            submit_type: "pay"
        }, {
            idempotencyKey: `marriage-oracle-reading-${reading.id}`
        });

        if (!session.url) {
            throw new Error("Stripe did not create a Checkout URL.");
        }

        return json(request, {
            ok: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error("create-checkout-session failed", error);
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

function appendQuery(base: string, query: string) {
    return `${base}${base.includes("?") ? "&" : "?"}${query}`;
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
    const origin = allowedOrigin(request);
    return {
        "Access-Control-Allow-Origin": origin,
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
    if (error instanceof AuthError) return "Sign in before starting checkout.";
    return "Secure checkout could not be created. Please try again.";
}

function statusFor(error: unknown) {
    return error instanceof AuthError ? 401 : 500;
}

class AuthError extends Error {}

