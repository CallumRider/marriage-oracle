"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before payments.js");

    let initialised = false;
    let revealTimerOne = null;
    let revealTimerTwo = null;
    let processingReturn = false;

    function init() {
        if (initialised) return;
        initialised = true;

        App.elements.unlockButton?.addEventListener("click", handleUnlock);
        App.elements.promoForm?.addEventListener("submit", redeemPromoCode);
        App.elements.shareButton?.addEventListener("click", shareReading);
        App.elements.emailButton?.addEventListener("click", emailReading);
        App.elements.printButton?.addEventListener("click", () => window.print());
        App.elements.restartButton?.addEventListener("click", restartReading);

        document.addEventListener("marriage-oracle:auth-state", (event) => {
            if (!event.detail?.signedIn) return;

            continuePendingUnlockAfterSignIn().catch((error) => {
                console.error("The pending unlock could not be restored.", error);
            });
            handlePaymentReturn().catch((error) => {
                console.error("The payment return could not be processed.", error);
            });
        });

        handlePaymentReturn().catch((error) => {
            console.error("The payment return could not be processed.", error);
        });
    }

    async function handleUnlock() {
        hidePaymentStatus();
        hidePromoMessage();

        if (App.config.demoMode) {
            unlockPremiumReading();
            showPaymentStatus("Demo unlock complete. No payment was taken.", "success");
            return;
        }

        const auth = App.modules.auth;
        if (!auth?.configured || !auth.client) {
            showPaymentStatus(
                "Payments are not connected yet. Finish the Supabase payment setup before testing checkout.",
                "error"
            );
            return;
        }

        if (!auth.user) {
            App.storage.writeText(
                "sessionStorage",
                App.storageKeys.pendingUnlock,
                "true"
            );
            showPaymentStatus(
                "Sign in or create an account first. Your reading will be kept while you sign in.",
                "info"
            );
            auth.openProfileScreen();
            return;
        }

        setButtonBusy(App.elements.unlockButton, true, "Preparing Secure Checkout…");

        try {
            const readingId = await auth.ensureCurrentCompletedReading();
            if (!readingId) {
                throw new Error("Your completed reading could not be saved to your account.");
            }

            const { data, error } = await auth.client.functions.invoke(
                App.config.paymentFunctions.createCheckout,
                { body: { readingId } }
            );

            if (error) throw error;

            if (data?.alreadyUnlocked) {
                await auth.openReading(readingId);
                showPaymentStatus("This reading was already unlocked on your account.", "success");
                return;
            }

            if (!data?.url || typeof data.url !== "string") {
                throw new Error("Stripe Checkout did not return a secure checkout address.");
            }

            App.storage.writeText(
                "sessionStorage",
                App.storageKeys.awaitingPayment,
                readingId
            );
            window.location.assign(data.url);
        } catch (error) {
            showPaymentStatus(
                await humaniseFunctionError(
                    error,
                    "Secure checkout could not be opened. Please try again."
                ),
                "error"
            );
        } finally {
            setButtonBusy(App.elements.unlockButton, false);
        }
    }

    async function redeemPromoCode(event) {
        event.preventDefault();
        hidePaymentStatus();
        hidePromoMessage();

        const code = String(App.elements.promoInput?.value || "").trim();
        if (code.length < 3 || code.length > 64) {
            showPromoMessage("Enter a valid complimentary code.", "error");
            App.elements.promoInput?.focus();
            return;
        }

        const auth = App.modules.auth;
        if (!auth?.configured || !auth.client) {
            showPromoMessage("The account service is not connected yet.", "error");
            return;
        }

        if (!auth.user) {
            App.storage.writeText(
                "sessionStorage",
                App.storageKeys.pendingUnlock,
                "true"
            );
            showPromoMessage(
                "Sign in first so this complimentary unlock can be saved to your account.",
                "info"
            );
            auth.openProfileScreen();
            return;
        }

        setButtonBusy(App.elements.promoSubmitButton, true, "Checking…");
        if (App.elements.promoInput) App.elements.promoInput.disabled = true;

        try {
            const readingId = await auth.ensureCurrentCompletedReading();
            if (!readingId) {
                throw new Error("Your completed reading could not be saved to your account.");
            }

            const { data, error } = await auth.client.functions.invoke(
                App.config.paymentFunctions.redeemPromo,
                { body: { readingId, code } }
            );

            if (error) throw error;

            if (!data?.ok) {
                showPromoMessage(promoFailureMessage(data?.code), "error");
                return;
            }

            if (App.elements.promoInput) App.elements.promoInput.value = "";
            await auth.refreshCurrentReadingAccess();
            await auth.refreshReadings();
            showPaymentStatus(
                data.alreadyUnlocked
                    ? "This reading was already unlocked on your account."
                    : "Complimentary code accepted. Your full reading is now permanently unlocked.",
                "success"
            );
        } catch (error) {
            showPromoMessage(
                await humaniseFunctionError(
                    error,
                    "The complimentary code could not be checked. Please try again."
                ),
                "error"
            );
        } finally {
            if (App.elements.promoInput) App.elements.promoInput.disabled = false;
            setButtonBusy(App.elements.promoSubmitButton, false);
        }
    }

    async function continuePendingUnlockAfterSignIn() {
        const pending = App.storage.readText(
            "sessionStorage",
            App.storageKeys.pendingUnlock,
            null
        );
        if (pending !== "true" || !App.modules.auth.user) return;

        App.storage.removeStoredValue(
            "sessionStorage",
            App.storageKeys.pendingUnlock
        );

        const readingId = await App.modules.auth.ensureCurrentCompletedReading();
        if (!readingId || !App.state.finalResult) return;

        App.modules.results.displayResult(App.state.finalResult);
        lockPremiumReading();
        App.showScreen("result");
        showPaymentStatus(
            "You are signed in and this reading is saved. Choose secure checkout or enter your complimentary code.",
            "success"
        );
    }

    async function handlePaymentReturn() {
        if (processingReturn) return;

        const url = new URL(window.location.href);
        const state = url.searchParams.get("payment");
        if (state !== "success" && state !== "cancelled") return;

        processingReturn = true;

        try {
            await App.modules.auth?.waitUntilReady?.();

            if (state === "cancelled") {
                restoreLocalResultScreen();
                showPaymentStatus(
                    "Checkout was cancelled. Nothing was charged and your reading remains locked.",
                    "info"
                );
                clearPaymentReturnParameters(url);
                return;
            }

            const sessionId = url.searchParams.get("session_id");
            if (!sessionId) {
                restoreLocalResultScreen();
                showPaymentStatus(
                    "The payment return was missing its Stripe confirmation reference.",
                    "error"
                );
                clearPaymentReturnParameters(url);
                return;
            }

            const auth = App.modules.auth;
            if (!auth?.user) {
                App.storage.writeText(
                    "sessionStorage",
                    App.storageKeys.pendingUnlock,
                    "true"
                );
                auth?.openProfileScreen?.();
                return;
            }

            const { data, error } = await auth.client.functions.invoke(
                App.config.paymentFunctions.verifyPayment,
                { body: { sessionId } }
            );

            if (error) throw error;
            if (!data?.ok || !data?.readingId) {
                throw new Error("Stripe could not confirm this completed payment.");
            }

            await auth.openReading(data.readingId);
            await auth.refreshReadings();
            showPaymentStatus(
                "Payment confirmed. Your full reading is permanently unlocked on this account.",
                "success"
            );
            App.storage.removeStoredValue(
                "sessionStorage",
                App.storageKeys.awaitingPayment
            );
            clearPaymentReturnParameters(url);
        } catch (error) {
            restoreLocalResultScreen();
            showPaymentStatus(
                await humaniseFunctionError(
                    error,
                    "We could not confirm the payment yet. Refresh the page or open the reading from your account in a moment."
                ),
                "error"
            );
        } finally {
            processingReturn = false;
        }
    }

    function restoreLocalResultScreen() {
        if (!App.state.finalResult) return;
        App.modules.results.displayResult(App.state.finalResult);
        lockPremiumReading();
        App.showScreen("result");
    }

    function clearPaymentReturnParameters(url) {
        url.searchParams.delete("payment");
        url.searchParams.delete("session_id");
        const query = url.searchParams.toString();
        const nextUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
    }

    function applyAccessStatus(status, source = null) {
        if (status === "paid" || status === "promo") {
            unlockPremiumReading();
            return;
        }

        lockPremiumReading();
    }

    function lockPremiumReading() {
        App.elements.premiumReading?.classList.add("locked");
        App.elements.premiumReading?.classList.remove("unlocked");

        if (App.elements.lockedOverlay) {
            App.elements.lockedOverlay.hidden = false;
        }
        if (App.elements.resultActions) {
            App.elements.resultActions.hidden = true;
        }

        const portrait = document.getElementById("companion-portrait");
        const portraitWrap = document.getElementById("companion-portrait-wrap");
        portrait?.classList.add("portrait-obscured");
        portraitWrap?.classList.remove("portrait-is-revealing", "portrait-is-revealed");
    }

    function unlockPremiumReading() {
        App.elements.premiumReading?.classList.remove("locked");
        App.elements.premiumReading?.classList.add("unlocked");

        if (App.elements.lockedOverlay) {
            App.elements.lockedOverlay.hidden = true;
        }
        if (App.elements.resultActions) {
            App.elements.resultActions.hidden = false;
        }

        revealPortrait();

        window.setTimeout(() => {
            App.elements.resultActions?.scrollIntoView({
                behavior: App.utils.prefersReducedMotion() ? "auto" : "smooth",
                block: "center"
            });
        }, App.utils.prefersReducedMotion() ? 0 : 120);
    }

    function revealPortrait() {
        const portrait = document.getElementById("companion-portrait");
        const portraitWrap = document.getElementById("companion-portrait-wrap");
        if (!portrait || !portraitWrap) return;

        window.clearTimeout(revealTimerOne);
        window.clearTimeout(revealTimerTwo);
        portraitWrap.classList.remove("portrait-is-revealing", "portrait-is-revealed");

        if (App.utils.prefersReducedMotion()) {
            portrait.classList.remove("portrait-obscured");
            portraitWrap.classList.add("portrait-is-revealed");
            return;
        }

        void portraitWrap.offsetWidth;
        portraitWrap.classList.add("portrait-is-revealing");

        revealTimerOne = window.setTimeout(() => {
            portrait.classList.remove("portrait-obscured");
        }, 180);

        revealTimerTwo = window.setTimeout(() => {
            portraitWrap.classList.remove("portrait-is-revealing");
            portraitWrap.classList.add("portrait-is-revealed");
        }, 1650);
    }

    async function shareReading() {
        const result = App.state.finalResult;
        if (!result) return;

        const text = `${App.config.siteName} gave me a ${result.compatibility}% compatibility indication, the initial ${result.initial}, and the name clue ${result.name}.`;
        const shareData = {
            title: App.config.siteName,
            text,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(`${text} ${window.location.href}`);
                temporarilyChangeButton(App.elements.shareButton, "Reading Copied");
            } else {
                window.prompt("Copy your reading:", `${text} ${window.location.href}`);
            }
        } catch (error) {
            if (error?.name !== "AbortError") {
                console.warn("The reading could not be shared.", error);
            }
        }
    }

    function emailReading() {
        const result = App.state.finalResult;
        if (!result) return;

        const subject = encodeURIComponent("My Marriage Oracle entertainment reading");
        const body = encodeURIComponent(buildEmailBody(result));
        const recipient = App.state.profile.email || "";
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    }

    function restartReading() {
        const shouldRestart = window.confirm(
            App.state.profile.mode === "account"
                ? "Start a new reading? Your completed reading will remain saved in your account."
                : "Start again and clear the answers saved in this browser?"
        );
        if (!shouldRestart) return;

        if (App.state.profile.mode === "account" && App.modules.auth.user) {
            App.modules.auth.startNewReading().catch((error) => {
                console.error("A new account reading could not be started.", error);
                window.alert("The new reading could not be started. Please try again.");
            });
            return;
        }

        App.clearQuizProgress();
        App.state.answers = App.state.profile.mode === "saved" && App.state.profile.name
            ? { firstName: App.state.profile.name }
            : {};
        App.saveProgress();
        App.modules.auth.openProfileScreen();
    }

    function buildEmailBody(result) {
        return [
            `${App.config.siteName} — entertainment reading`,
            `Reference: ${result.reference}`,
            "",
            `Possible initial: ${result.initial}`,
            `Possible name: ${result.name}`,
            `Companion life stage: ${result.ageClue.title}`,
            `Compatibility indication: ${result.compatibility}%`,
            `Temperament: ${result.temperament}`,
            `Personality: ${result.personality.title}`,
            `Appearance: ${result.appearance.title}`,
            `Values: ${result.values.title}`,
            `Meeting clue: ${result.meeting[0]}`,
            `Relationship style: ${result.relationshipStyle.title}`,
            `Affection style: ${result.affection.title}`,
            `Timing clue: ${result.relationshipYear}`,
            `Future life: ${result.futureHome.title}`,
            "",
            `Oracle message: ${result.oracleMessage.title}`,
            result.oracleMessage.text,
            "",
            "For entertainment purposes only."
        ].join("\n");
    }

    function showPaymentStatus(message, type = "info") {
        const element = App.elements.paymentStatusMessage;
        if (!element) return;
        element.textContent = message;
        element.dataset.type = type;
        element.hidden = false;
    }

    function hidePaymentStatus() {
        const element = App.elements.paymentStatusMessage;
        if (!element) return;
        element.hidden = true;
        element.textContent = "";
        delete element.dataset.type;
    }

    function showPromoMessage(message, type = "info") {
        const element = App.elements.promoMessage;
        if (!element) return;
        element.textContent = message;
        element.dataset.type = type;
        element.hidden = false;
    }

    function hidePromoMessage() {
        const element = App.elements.promoMessage;
        if (!element) return;
        element.hidden = true;
        element.textContent = "";
        delete element.dataset.type;
    }

    function promoFailureMessage(code) {
        if (code === "rate_limited") {
            return "Too many code attempts were made. Wait 15 minutes and try again.";
        }
        if (code === "already_used") {
            return "This account has already used that complimentary code.";
        }
        if (code === "reading_not_found") {
            return "This completed reading could not be found on your account.";
        }
        return "That complimentary code is invalid, expired or has reached its usage limit.";
    }

    function setButtonBusy(button, busy, busyText = "Working…") {
        if (!button) return;

        if (busy) {
            button.dataset.originalText = button.textContent;
            button.textContent = busyText;
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            delete button.dataset.originalText;
            button.disabled = false;
        }
    }

    async function humaniseFunctionError(error, fallback) {
        const context = error?.context;
        if (context && typeof context.clone === "function") {
            try {
                const payload = await context.clone().json();
                if (typeof payload?.error === "string" && payload.error.trim()) {
                    return payload.error.trim();
                }
            } catch {
                // The response did not contain JSON; fall through to the safe message.
            }
        }

        const message = String(error?.message || "").trim();
        if (message && !message.toLowerCase().includes("edge function")) {
            return message;
        }
        return fallback;
    }

    function temporarilyChangeButton(button, temporaryText) {
        if (!button) return;
        const originalText = button.textContent;
        button.textContent = temporaryText;
        window.setTimeout(() => {
            button.textContent = originalText;
        }, 1800);
    }

    App.modules.payments = {
        init,
        applyAccessStatus,
        lockPremiumReading,
        unlockPremiumReading,
        buildEmailBody
    };
})();
