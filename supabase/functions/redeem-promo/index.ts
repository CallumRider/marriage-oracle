import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const siteUrl = normaliseSiteUrl(Deno.env.get("SITE_URL") ?? "");
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

    try {
        const user = await requireUser(request);
        const body = await request.json().catch(() => ({}));
        const readingId = String(body?.readingId ?? "").trim();
        const rawCode = String(body?.code ?? "").trim();

        if (!isUuid(readingId)) {
            return json(request, { ok: false, code: "reading_not_found" }, 400);
        }
        if (rawCode.length < 3 || rawCode.length > 64) {
            return json(request, { ok: false, code: "invalid" }, 400);
        }

        const codeHash = await sha256Hex(rawCode.toLowerCase());
        const { data, error } = await admin.rpc("redeem_promo_code_admin", {
            p_user_id: user.id,
            p_reading_id: readingId,
            p_code_hash: codeHash
        });

        if (error) throw error;

        return json(request, {
            ok: Boolean(data?.ok),
            code: data?.code ?? null,
            readingId: data?.reading_id ?? readingId,
            accessStatus: data?.access_status ?? null,
            alreadyUnlocked: Boolean(data?.already_unlocked)
        });
    } catch (error) {
        console.error("redeem-promo failed", error);
        return json(request, { error: safeMessage(error) }, statusFor(error));
    }
});

async function sha256Hex(value: string) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

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
    if (error instanceof AuthError) return "Sign in before applying a complimentary code.";
    return "The complimentary code could not be checked.";
}

function statusFor(error: unknown) {
    return error instanceof AuthError ? 401 : 500;
}

class AuthError extends Error {}

