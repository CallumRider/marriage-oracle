"use strict";

(() => {
    const CONFIG = Object.freeze({
        siteName: "The Marriage Oracle",
        priceText: "£0.99",
        pricePence: 99,
        currency: "gbp",
        demoMode: false,
        paymentFunctions: Object.freeze({
            createCheckout: "create-checkout-session",
            verifyPayment: "verify-payment",
            redeemPromo: "redeem-promo"
        })
    });

    const STORAGE_KEYS = Object.freeze({
        profile: "marriageOracleProfileV2",
        answers: "marriageOracleAnswersV2",
        privateAnswers: "marriageOraclePrivateAnswersV2",
        questionIndex: "marriageOracleQuestionIndexV2",
        result: "marriageOracleResultV2",
        activeReadingId: "marriageOracleActiveReadingIdV1",
        currentReadingId: "marriageOracleCurrentReadingIdV1",
        pendingUnlock: "marriageOraclePendingUnlockV1",
        awaitingPayment: "marriageOracleAwaitingPayment"
    });

    const PRIVATE_ANSWER_IDS = new Set([
        "beliefRole",
        "sharedBeliefs",
        "portraitBackground"
    ]);

    const state = {
        currentQuestionIndex: 0,
        answers: {},
        profile: { mode: "guest", name: "", email: "" },
        finalResult: null,
        loadingFrame: null,
        portraitMessageTimer: null,
        quoteTimer: null
    };

    const elements = {};
    const modules = {};
    let initialised = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        Object.assign(elements, {
            screens: {
                home: byId("home-screen"),
                profile: byId("profile-screen"),
                quiz: byId("quiz-screen"),
                loading: byId("loading-screen"),
                result: byId("result-screen")
            },
            startButtons: [
                byId("hero-start-button"),
                byId("header-start-button"),
                byId("bottom-start-button"),
                byId("footer-start-button")
            ].filter(Boolean),
            profileForm: byId("profile-form"),
            guestButton: byId("guest-button"),
            profileNameInput: byId("profile-name"),
            profileEmailInput: byId("profile-email"),
            profileError: byId("profile-error"),
            questionForm: byId("question-form"),
            questionTitle: byId("question-title"),
            questionHelp: byId("question-help"),
            questionNumberLabel: byId("question-number-label"),
            answerArea: byId("answer-area"),
            questionError: byId("question-error"),
            nextButton: byId("next-button"),
            backButton: byId("back-button"),
            sectionName: byId("section-name"),
            progressCount: byId("progress-count"),
            progressPercentage: byId("progress-percentage"),
            progressTrack: byId("progress-track"),
            progressBar: byId("progress-bar"),
            guideSpeech: byId("guide-speech"),
            savedStatus: byId("saved-status"),
            quitQuizButton: byId("quit-quiz-button"),
            saveExitDialog: byId("save-exit-dialog"),
            continueQuizButton: byId("continue-quiz-button"),
            confirmExitButton: byId("confirm-exit-button"),
            loadingProgressBar: byId("loading-progress-bar"),
            loadingPercentage: byId("loading-percentage"),
            loadingMessage: byId("loading-message"),
            analysisItems: [
                byId("analysis-one"),
                byId("analysis-two"),
                byId("analysis-three"),
                byId("analysis-four")
            ].filter(Boolean),
            premiumReading: byId("premium-reading"),
            lockedOverlay: byId("locked-overlay"),
            resultActions: byId("result-actions"),
            unlockButton: byId("unlock-button"),
            shareButton: byId("share-button"),
            emailButton: byId("email-button"),
            printButton: byId("print-button"),
            restartButton: byId("restart-button"),
            paymentNote: byId("payment-note"),
            paymentStatusMessage: byId("payment-status-message"),
            promoForm: byId("promo-code-form"),
            promoInput: byId("promo-code-input"),
            promoSubmitButton: byId("promo-code-submit"),
            promoMessage: byId("promo-code-message"),
            priceBadge: byId("price-badge")
        });
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function getStorage(storageName) {
        try {
            return window[storageName] ?? null;
        } catch (error) {
            console.warn(`${storageName} is not available in this browser context.`, error);
            return null;
        }
    }

    function readJSON(storageName, key, fallback) {
        const storage = getStorage(storageName);
        if (!storage) return fallback;

        try {
            const raw = storage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (error) {
            console.warn(`Could not read ${key} from browser storage.`, error);
            return fallback;
        }
    }

    function readText(storageName, key, fallback = null) {
        const storage = getStorage(storageName);
        if (!storage) return fallback;

        try {
            return storage.getItem(key) ?? fallback;
        } catch (error) {
            console.warn(`Could not read ${key} from browser storage.`, error);
            return fallback;
        }
    }

    function writeJSON(storageName, key, value) {
        const storage = getStorage(storageName);
        if (!storage) return false;

        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Could not save ${key} to browser storage.`, error);
            return false;
        }
    }

    function writeText(storageName, key, value) {
        const storage = getStorage(storageName);
        if (!storage) return false;

        try {
            storage.setItem(key, String(value));
            return true;
        } catch (error) {
            console.warn(`Could not save ${key} to browser storage.`, error);
            return false;
        }
    }

    function removeStoredValue(storageName, key) {
        const storage = getStorage(storageName);
        if (!storage) return;

        try {
            storage.removeItem(key);
        } catch (error) {
            console.warn(`Could not remove ${key} from browser storage.`, error);
        }
    }

    function saveProgress() {
        const normalAnswers = {};
        const privateAnswers = {};

        Object.entries(state.answers).forEach(([key, value]) => {
            const target = PRIVATE_ANSWER_IDS.has(key)
                ? privateAnswers
                : normalAnswers;
            target[key] = value;
        });

        writeJSON("localStorage", STORAGE_KEYS.answers, normalAnswers);
        writeJSON("sessionStorage", STORAGE_KEYS.privateAnswers, privateAnswers);
        writeText("localStorage", STORAGE_KEYS.questionIndex, state.currentQuestionIndex);

        modules.auth?.queueProgressSync?.();
    }

    function saveProfile() {
        if (state.profile.mode === "saved" || state.profile.mode === "account") {
            writeJSON("localStorage", STORAGE_KEYS.profile, state.profile);
        } else {
            removeStoredValue("localStorage", STORAGE_KEYS.profile);
        }
    }

    function saveResult(result) {
        state.finalResult = result;
        writeJSON("localStorage", STORAGE_KEYS.result, result);
        modules.auth?.saveCompletedReading?.(result);
    }

    function restoreSavedProfile() {
        const saved = readJSON("localStorage", STORAGE_KEYS.profile, null);

        if (!isPlainObject(saved)) {
            return;
        }

        const mode = saved.mode === "account"
            ? "account"
            : saved.mode === "saved"
                ? "saved"
                : "guest";

        state.profile = {
            mode,
            name: typeof saved.name === "string" ? saved.name : "",
            email: typeof saved.email === "string" ? saved.email : ""
        };
    }

    function restoreSavedProgress() {
        const savedAnswers = readJSON("localStorage", STORAGE_KEYS.answers, {});
        const privateAnswers = readJSON(
            "sessionStorage",
            STORAGE_KEYS.privateAnswers,
            {}
        );

        state.answers = {
            ...(isPlainObject(savedAnswers) ? savedAnswers : {}),
            ...(isPlainObject(privateAnswers) ? privateAnswers : {})
        };

        const savedIndex = Number(
            readText("localStorage", STORAGE_KEYS.questionIndex, "0")
        );

        const questionCount = modules.quiz?.questions?.length ?? 0;
        state.currentQuestionIndex = Number.isInteger(savedIndex)
            && savedIndex >= 0
            && savedIndex < questionCount
            ? savedIndex
            : 0;

        const savedResult = readJSON("localStorage", STORAGE_KEYS.result, null);
        state.finalResult = isPlainObject(savedResult) ? savedResult : null;
    }

    function clearQuizProgress() {
        removeStoredValue("localStorage", STORAGE_KEYS.answers);
        removeStoredValue("sessionStorage", STORAGE_KEYS.privateAnswers);
        removeStoredValue("localStorage", STORAGE_KEYS.questionIndex);
        removeStoredValue("localStorage", STORAGE_KEYS.result);
        removeStoredValue("sessionStorage", STORAGE_KEYS.awaitingPayment);
        removeStoredValue("sessionStorage", STORAGE_KEYS.pendingUnlock);
        removeStoredValue("localStorage", STORAGE_KEYS.currentReadingId);

        state.currentQuestionIndex = 0;
        state.answers = {};
        state.finalResult = null;
    }

    function showScreen(screenName) {
        const target = elements.screens?.[screenName];

        if (!target) {
            console.error(`Unknown screen: ${screenName}`);
            return;
        }

        Object.entries(elements.screens).forEach(([name, element]) => {
            if (element) {
                element.hidden = name !== screenName;
            }
        });

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion() ? "auto" : "smooth"
        });
    }

    function createSeed(value) {
        const text = typeof value === "string" ? value : JSON.stringify(value);
        let hash = 2166136261;

        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }

        return hash >>> 0;
    }

    function choose(list, seed, offset = 0) {
        if (!Array.isArray(list) || list.length === 0) {
            return undefined;
        }

        const index = Math.abs((Number(seed) || 0) + offset) % list.length;
        return list[index];
    }

    function capitalise(value) {
        const text = String(value ?? "");
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
    }

    function toRoman(number) {
        const numerals = [
            [10, "X"],
            [9, "IX"],
            [5, "V"],
            [4, "IV"],
            [1, "I"]
        ];
        let remaining = Math.max(0, Math.floor(Number(number) || 0));
        let result = "";

        numerals.forEach(([value, symbol]) => {
            while (remaining >= value) {
                result += symbol;
                remaining -= value;
            }
        });

        return result;
    }

    function prefersReducedMotion() {
        return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    }

    function startHomeQuoteRotation() {
        const messageElement = byId("home-guide-message");
        if (!messageElement || prefersReducedMotion()) {
            return;
        }

        const messages = [
            "The smallest choices often reveal the greatest clues.",
            "A lasting bond is often hidden inside ordinary preferences.",
            "Your answers tell a story long before the final card is turned.",
            "Choose honestly. The most convincing reading begins there.",
            "Thirty-three small decisions can create thousands of possible readings."
        ];
        let index = 0;

        window.clearInterval(state.quoteTimer);
        state.quoteTimer = window.setInterval(() => {
            index = (index + 1) % messages.length;
            messageElement.textContent = messages[index];
        }, 6000);
    }

    function openSaveDialog() {
        saveProgress();

        const copy = byId("save-exit-copy");
        if (copy) {
            copy.textContent = state.profile.mode === "account"
                ? "Your current answers are being saved to your account. You can continue on this or another device."
                : "Your current answers are saved in this browser. You can return later on this device.";
        }

        if (elements.saveExitDialog) {
            elements.saveExitDialog.hidden = false;
            elements.continueQuizButton?.focus();
        }
    }

    function closeSaveDialog() {
        if (elements.saveExitDialog) {
            elements.saveExitDialog.hidden = true;
        }
    }

    function bindCoreEvents() {
        elements.quitQuizButton?.addEventListener("click", openSaveDialog);
        elements.continueQuizButton?.addEventListener("click", closeSaveDialog);

        elements.confirmExitButton?.addEventListener("click", () => {
            closeSaveDialog();
            showScreen("home");
        });

        elements.saveExitDialog?.addEventListener("click", (event) => {
            if (event.target === elements.saveExitDialog) {
                closeSaveDialog();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !elements.saveExitDialog?.hidden) {
                closeSaveDialog();
            }
        });

        document.querySelectorAll("[data-go-home]").forEach((button) => {
            button.addEventListener("click", () => showScreen("home"));
        });
    }

    function configureStaticText() {
        const currentYear = byId("current-year");
        if (currentYear) {
            currentYear.textContent = String(new Date().getFullYear());
        }

        if (elements.priceBadge) {
            elements.priceBadge.textContent = CONFIG.priceText;
        }

        if (elements.unlockButton) {
            elements.unlockButton.textContent = CONFIG.demoMode
                ? `Preview Full Reading — ${CONFIG.priceText}`
                : `Unlock Full Reading — ${CONFIG.priceText}`;
        }

        if (elements.paymentNote) {
            elements.paymentNote.textContent = CONFIG.demoMode
                ? "Testing mode is active. No payment will be taken."
                : "Secure checkout by Stripe. You must be signed in so the unlock can be saved to your account.";
        }
    }

    function validateMarkup() {
        const required = [
            "home-screen",
            "profile-screen",
            "quiz-screen",
            "loading-screen",
            "result-screen",
            "question-form",
            "premium-reading",
            "unlock-button"
        ];
        const missing = required.filter((id) => !byId(id));

        if (missing.length > 0) {
            console.error(
                "The Marriage Oracle could not start because these elements are missing:",
                missing.join(", ")
            );
            return false;
        }

        return true;
    }

    function init() {
        if (initialised) {
            return;
        }

        initialised = true;
        cacheElements();

        if (!validateMarkup()) {
            return;
        }

        configureStaticText();
        restoreSavedProfile();
        restoreSavedProgress();
        bindCoreEvents();

        modules.auth?.init?.();
        modules.quiz?.init?.();
        modules.results?.init?.();
        modules.payments?.init?.();

        startHomeQuoteRotation();
    }

    function reset() {
        Object.values(STORAGE_KEYS).forEach((key) => {
            removeStoredValue("localStorage", key);
            removeStoredValue("sessionStorage", key);
        });
        window.location.reload();
    }

    window.MarriageOracle = {
        config: CONFIG,
        storageKeys: STORAGE_KEYS,
        privateAnswerIds: PRIVATE_ANSWER_IDS,
        state,
        elements,
        modules,
        utils: {
            createSeed,
            choose,
            capitalise,
            toRoman,
            prefersReducedMotion
        },
        storage: {
            getStorage,
            readJSON,
            readText,
            writeJSON,
            writeText,
            removeStoredValue
        },
        init,
        showScreen,
        saveProgress,
        saveProfile,
        saveResult,
        restoreSavedProfile,
        restoreSavedProgress,
        clearQuizProgress,
        reset
    };

    window.resetMarriageOracle = reset;
    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
