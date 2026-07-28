"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before auth.js");

    const ACCOUNT_SYNC_DELAY = 700;
    const MAX_SAVED_READINGS = 12;

    const account = {
        client: null,
        user: null,
        profile: null,
        readings: [],
        activeReadingId: null,
        syncTimer: null,
        syncChain: Promise.resolve(),
        authSubscription: null,
        initialised: false,
        configured: false,
        handlingSessionFor: null
    };

    const ui = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheUi() {
        Object.assign(ui, {
            accountButton: byId("account-button"),
            authLoadingPanel: byId("auth-loading-panel"),
            signedOutPanel: byId("auth-signed-out-panel"),
            dashboard: byId("account-dashboard"),
            guestButton: byId("guest-button"),
            signInTab: byId("sign-in-tab"),
            signUpTab: byId("sign-up-tab"),
            signInForm: byId("sign-in-form"),
            signUpForm: byId("sign-up-form"),
            forgotPasswordForm: byId("forgot-password-form"),
            showForgotButton: byId("show-forgot-password-button"),
            cancelForgotButton: byId("cancel-forgot-password-button"),
            signInEmail: byId("sign-in-email"),
            signInPassword: byId("sign-in-password"),
            signUpName: byId("sign-up-name"),
            signUpEmail: byId("sign-up-email"),
            signUpPassword: byId("sign-up-password"),
            signUpPasswordConfirm: byId("sign-up-password-confirm"),
            forgotPasswordEmail: byId("forgot-password-email"),
            authMessage: byId("auth-message"),
            accountName: byId("account-name"),
            accountEmail: byId("account-email"),
            signOutButton: byId("sign-out-button"),
            resumeButton: byId("account-resume-button"),
            newReadingButton: byId("account-new-reading-button"),
            refreshReadingsButton: byId("refresh-readings-button"),
            readingsList: byId("account-readings-list"),
            readingsEmpty: byId("account-readings-empty"),
            dashboardMessage: byId("account-dashboard-message"),
            recoveryDialog: byId("password-recovery-dialog"),
            recoveryForm: byId("password-recovery-form"),
            recoveryPassword: byId("recovery-password"),
            recoveryPasswordConfirm: byId("recovery-password-confirm"),
            recoveryMessage: byId("password-recovery-message")
        });
    }

    function init() {
        if (account.initialised) return;
        account.initialised = true;

        cacheUi();
        bindEvents();
        showLoadingState();

        account.activeReadingId = App.storage.readText(
            "localStorage",
            App.storageKeys.activeReadingId,
            null
        );

        account.configured = initialiseSupabaseClient();

        if (!account.configured) {
            showSignedOutState();
            showAuthMessage(
                "Account setup is not connected yet. Guest readings still work. Add your Supabase project URL and publishable key to assets/js/supabase-config.js.",
                "error"
            );
            setAccountFormsDisabled(true);
            return;
        }

        subscribeToAuthChanges();
        restoreSession();
    }

    function initialiseSupabaseClient() {
        const config = window.MarriageOracleSupabaseConfig;
        const factory = window.supabase?.createClient;

        if (typeof factory !== "function") {
            console.error("The Supabase browser library did not load.");
            return false;
        }

        if (!isUsableConfig(config)) {
            return false;
        }

        account.client = factory(config.url.trim(), config.publishableKey.trim(), {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        return true;
    }

    function isUsableConfig(config) {
        if (!config || typeof config !== "object") return false;

        const url = String(config.url || "").trim();
        const key = String(config.publishableKey || "").trim();

        return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)
            && key.length > 30
            && !url.includes("PASTE_")
            && !key.includes("PASTE_");
    }

    function bindEvents() {
        App.elements.startButtons.forEach((button) => {
            button.addEventListener("click", openProfileScreen);
        });

        ui.accountButton?.addEventListener("click", openProfileScreen);
        ui.guestButton?.addEventListener("click", continueAsGuest);

        ui.signInTab?.addEventListener("click", () => showAuthView("sign-in"));
        ui.signUpTab?.addEventListener("click", () => showAuthView("sign-up"));
        ui.showForgotButton?.addEventListener("click", () => showAuthView("forgot"));
        ui.cancelForgotButton?.addEventListener("click", () => showAuthView("sign-in"));

        ui.signInForm?.addEventListener("submit", signIn);
        ui.signUpForm?.addEventListener("submit", signUp);
        ui.forgotPasswordForm?.addEventListener("submit", sendPasswordRecovery);
        ui.recoveryForm?.addEventListener("submit", updateRecoveredPassword);

        ui.signOutButton?.addEventListener("click", signOut);
        ui.resumeButton?.addEventListener("click", resumeLatestReading);
        ui.newReadingButton?.addEventListener("click", startNewReading);
        ui.refreshReadingsButton?.addEventListener("click", refreshAccountData);
        ui.readingsList?.addEventListener("click", handleReadingListClick);
    }

    function subscribeToAuthChanges() {
        const { data } = account.client.auth.onAuthStateChange((event, session) => {
            window.setTimeout(() => {
                handleAuthState(event, session).catch((error) => {
                    console.error("Could not update the account state.", error);
                    showAuthMessage(humaniseError(error), "error");
                });
            }, 0);
        });

        account.authSubscription = data?.subscription ?? null;
    }

    async function restoreSession() {
        try {
            const { data, error } = await account.client.auth.getSession();
            if (error) throw error;
            await handleAuthState("INITIAL_SESSION", data.session);
        } catch (error) {
            console.error("Could not restore the Supabase session.", error);
            showSignedOutState();
            showAuthMessage(
                "We could not check your account. Check your connection and try again, or continue as a guest.",
                "error"
            );
        }
    }

    async function handleAuthState(event, session) {
        if (event === "PASSWORD_RECOVERY") {
            showRecoveryDialog();
        }

        if (!session?.user) {
            account.user = null;
            account.profile = null;
            account.readings = [];
            account.activeReadingId = null;
            account.handlingSessionFor = null;
            App.storage.removeStoredValue("localStorage", App.storageKeys.activeReadingId);

            if (App.state.profile.mode === "account") {
                App.state.profile = { mode: "guest", name: "", email: "" };
                App.saveProfile();
            }

            showSignedOutState();
            updateHeaderAccountButton();
            return;
        }

        account.user = session.user;
        const sessionKey = `${session.user.id}:${session.user.updated_at || ""}`;

        if (account.handlingSessionFor === sessionKey && event !== "USER_UPDATED") {
            showDashboardState();
            return;
        }

        account.handlingSessionFor = sessionKey;
        await loadProfile();
        applyAccountProfile();
        await loadReadings();
        showDashboardState();
        updateHeaderAccountButton();
    }

    async function loadProfile() {
        const user = account.user;
        if (!user) return;

        const fallbackName = cleanName(
            user.user_metadata?.first_name
            || App.state.profile.name
            || "Reader"
        ) || "Reader";

        const { data, error } = await account.client
            .from("profiles")
            .select("id, first_name, created_at, updated_at")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            account.profile = data;
            return;
        }

        const { data: created, error: createError } = await account.client
            .from("profiles")
            .upsert({ id: user.id, first_name: fallbackName }, { onConflict: "id" })
            .select("id, first_name, created_at, updated_at")
            .single();

        if (createError) throw createError;
        account.profile = created;
    }

    function applyAccountProfile() {
        if (!account.user) return;

        const name = cleanName(account.profile?.first_name || "Reader") || "Reader";
        const email = cleanEmail(account.user.email || "");

        App.state.profile = {
            mode: "account",
            name,
            email
        };
        App.saveProfile();

        if (!App.state.answers.firstName) {
            App.state.answers.firstName = name;
        }
    }

    async function loadReadings() {
        if (!account.user) return;

        const { data, error } = await account.client
            .from("readings")
            .select("id, status, current_question_index, result, created_at, updated_at, completed_at")
            .order("updated_at", { ascending: false })
            .limit(MAX_SAVED_READINGS);

        if (error) throw error;

        account.readings = Array.isArray(data) ? data : [];

        const storedId = App.storage.readText(
            "localStorage",
            App.storageKeys.activeReadingId,
            null
        );
        const storedReading = account.readings.find(
            (reading) => reading.id === storedId && reading.status === "in_progress"
        );
        const latestInProgress = account.readings.find(
            (reading) => reading.status === "in_progress"
        );

        account.activeReadingId = storedReading?.id || latestInProgress?.id || null;
        persistActiveReadingId();
        renderReadings();
    }

    async function refreshAccountData() {
        if (!account.user) return;

        setButtonBusy(ui.refreshReadingsButton, true, "Refreshing…");
        hideDashboardMessage();

        try {
            await loadReadings();
            showDashboardMessage("Your saved readings are up to date.", "success");
        } catch (error) {
            showDashboardMessage(humaniseError(error), "error");
        } finally {
            setButtonBusy(ui.refreshReadingsButton, false);
        }
    }

    function openProfileScreen() {
        hideAuthMessage();
        hideDashboardMessage();
        App.showScreen("profile");

        if (!account.configured) {
            showSignedOutState();
            showAuthMessage(
                "Account setup is not connected yet. Guest readings still work. Add your Supabase project URL and publishable key to assets/js/supabase-config.js.",
                "error"
            );
            return;
        }

        if (account.user) {
            showDashboardState();
            loadReadings().catch((error) => {
                showDashboardMessage(humaniseError(error), "error");
            });
        } else {
            showSignedOutState();
            showAuthView("sign-in");
        }
    }

    function continueAsGuest() {
        account.activeReadingId = null;
        App.storage.removeStoredValue("localStorage", App.storageKeys.activeReadingId);
        App.state.profile = { mode: "guest", name: "", email: "" };
        App.saveProfile();
        beginOrResumeQuiz();
    }

    function beginOrResumeQuiz() {
        const questionCount = App.modules.quiz.questions.length;

        if (
            !Number.isInteger(App.state.currentQuestionIndex)
            || App.state.currentQuestionIndex < 0
            || App.state.currentQuestionIndex >= questionCount
        ) {
            App.state.currentQuestionIndex = 0;
        }

        App.showScreen("quiz");
        App.modules.quiz.renderQuestion();
    }

    async function signIn(event) {
        event.preventDefault();
        hideAuthMessage();

        if (!account.configured) return;

        const email = cleanEmail(ui.signInEmail?.value || "");
        const password = String(ui.signInPassword?.value || "");

        if (!isValidEmail(email)) {
            showAuthMessage("Please enter a valid email address.", "error");
            ui.signInEmail?.focus();
            return;
        }

        if (password.length < 8) {
            showAuthMessage("Your password must contain at least 8 characters.", "error");
            ui.signInPassword?.focus();
            return;
        }

        setFormBusy(ui.signInForm, true, "Signing In…");

        try {
            const { error } = await account.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            ui.signInForm?.reset();
            showAuthMessage("Signed in successfully. Loading your saved readings…", "success");
        } catch (error) {
            showAuthMessage(humaniseAuthError(error), "error");
        } finally {
            setFormBusy(ui.signInForm, false);
        }
    }

    async function signUp(event) {
        event.preventDefault();
        hideAuthMessage();

        if (!account.configured) return;

        const name = cleanName(ui.signUpName?.value || "");
        const email = cleanEmail(ui.signUpEmail?.value || "");
        const password = String(ui.signUpPassword?.value || "");
        const confirmation = String(ui.signUpPasswordConfirm?.value || "");

        if (!name) {
            showAuthMessage("Please enter your first name.", "error");
            ui.signUpName?.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showAuthMessage("Please enter a valid email address.", "error");
            ui.signUpEmail?.focus();
            return;
        }

        if (password.length < 8) {
            showAuthMessage("Create a password containing at least 8 characters.", "error");
            ui.signUpPassword?.focus();
            return;
        }

        if (password !== confirmation) {
            showAuthMessage("The two passwords do not match.", "error");
            ui.signUpPasswordConfirm?.focus();
            return;
        }

        setFormBusy(ui.signUpForm, true, "Creating Account…");

        try {
            const { data, error } = await account.client.auth.signUp({
                email,
                password,
                options: {
                    data: { first_name: name },
                    emailRedirectTo: getRedirectUrl()
                }
            });

            if (error) throw error;

            ui.signUpForm?.reset();

            if (data.session) {
                showAuthMessage("Your account has been created. Loading your dashboard…", "success");
            } else {
                showAuthMessage(
                    "Your account has been created. Check your email and follow the confirmation link before signing in.",
                    "success"
                );
                showAuthView("sign-in", { keepMessage: true });
                if (ui.signInEmail) ui.signInEmail.value = email;
            }
        } catch (error) {
            showAuthMessage(humaniseAuthError(error), "error");
        } finally {
            setFormBusy(ui.signUpForm, false);
        }
    }

    async function sendPasswordRecovery(event) {
        event.preventDefault();
        hideAuthMessage();

        const email = cleanEmail(ui.forgotPasswordEmail?.value || "");
        if (!isValidEmail(email)) {
            showAuthMessage("Please enter a valid email address.", "error");
            ui.forgotPasswordEmail?.focus();
            return;
        }

        setFormBusy(ui.forgotPasswordForm, true, "Sending…");

        try {
            const { error } = await account.client.auth.resetPasswordForEmail(email, {
                redirectTo: getRedirectUrl()
            });
            if (error) throw error;

            showAuthMessage(
                "If an account exists for that address, a recovery email is on its way.",
                "success"
            );
        } catch (error) {
            showAuthMessage(humaniseAuthError(error), "error");
        } finally {
            setFormBusy(ui.forgotPasswordForm, false);
        }
    }

    async function updateRecoveredPassword(event) {
        event.preventDefault();
        hideRecoveryMessage();

        const password = String(ui.recoveryPassword?.value || "");
        const confirmation = String(ui.recoveryPasswordConfirm?.value || "");

        if (password.length < 8) {
            showRecoveryMessage("Use at least 8 characters for the new password.", "error");
            ui.recoveryPassword?.focus();
            return;
        }

        if (password !== confirmation) {
            showRecoveryMessage("The two passwords do not match.", "error");
            ui.recoveryPasswordConfirm?.focus();
            return;
        }

        setFormBusy(ui.recoveryForm, true, "Saving…");

        try {
            const { error } = await account.client.auth.updateUser({ password });
            if (error) throw error;

            ui.recoveryForm?.reset();
            showRecoveryMessage("Your password has been updated successfully.", "success");
            window.setTimeout(() => {
                hideRecoveryDialog();
                openProfileScreen();
            }, 900);
        } catch (error) {
            showRecoveryMessage(humaniseAuthError(error), "error");
        } finally {
            setFormBusy(ui.recoveryForm, false);
        }
    }

    async function signOut() {
        if (!account.client) return;

        setButtonBusy(ui.signOutButton, true, "Signing Out…");
        hideDashboardMessage();

        try {
            await flushProgressSync();
            const { error } = await account.client.auth.signOut();
            if (error) throw error;

            App.state.profile = { mode: "guest", name: "", email: "" };
            App.saveProfile();
            App.showScreen("home");
        } catch (error) {
            showDashboardMessage(humaniseAuthError(error), "error");
        } finally {
            setButtonBusy(ui.signOutButton, false);
        }
    }

    async function startNewReading() {
        hideDashboardMessage();
        setButtonBusy(ui.newReadingButton, true, "Preparing…");

        try {
            App.clearQuizProgress();
            account.activeReadingId = null;
            persistActiveReadingId();

            App.state.answers = App.state.profile.name
                ? { firstName: App.state.profile.name }
                : {};
            App.state.currentQuestionIndex = 0;
            App.state.finalResult = null;

            await ensureActiveReading();
            App.saveProgress();
            beginOrResumeQuiz();
        } catch (error) {
            showDashboardMessage(humaniseError(error), "error");
        } finally {
            setButtonBusy(ui.newReadingButton, false);
        }
    }

    async function resumeLatestReading() {
        const reading = account.readings.find(
            (item) => item.id === account.activeReadingId && item.status === "in_progress"
        ) || account.readings.find((item) => item.status === "in_progress");

        if (reading) {
            await resumeReading(reading.id);
            return;
        }

        if (App.state.finalResult) {
            setButtonBusy(ui.resumeButton, true, "Saving…");
            try {
                await enqueueSync(() => syncProgress(App.state.finalResult));
                App.modules.results.displayResult(App.state.finalResult);
                App.modules.payments.lockPremiumReading();
                App.showScreen("result");
            } finally {
                setButtonBusy(ui.resumeButton, false);
            }
            return;
        }

        if (hasMeaningfulLocalProgress()) {
            setButtonBusy(ui.resumeButton, true, "Saving…");
            try {
                await ensureActiveReading();
                App.saveProgress();
                beginOrResumeQuiz();
            } finally {
                setButtonBusy(ui.resumeButton, false);
            }
            return;
        }

        showDashboardMessage("There is no unfinished reading to resume.", "error");
    }

    async function handleReadingListClick(event) {
        const button = event.target.closest("button[data-reading-action]");
        if (!button) return;

        const readingId = button.dataset.readingId;
        const action = button.dataset.readingAction;
        if (!readingId || !action) return;

        if (action === "open") {
            setButtonBusy(button, true, "Opening…");
            try {
                await resumeReading(readingId);
            } catch (error) {
                showDashboardMessage(humaniseError(error), "error");
            } finally {
                setButtonBusy(button, false);
            }
            return;
        }

        if (action === "delete") {
            await deleteReading(readingId, button);
        }
    }

    async function resumeReading(readingId) {
        if (!account.user) return;

        hideDashboardMessage();

        const { data, error } = await account.client
            .from("readings")
            .select("id, status, current_question_index, answers, result, created_at, updated_at, completed_at")
            .eq("id", readingId)
            .single();

        if (error) throw error;

        account.activeReadingId = data.status === "in_progress" ? data.id : null;
        persistActiveReadingId();

        App.state.answers = isPlainObject(data.answers) ? data.answers : {};
        App.state.currentQuestionIndex = clampQuestionIndex(data.current_question_index);
        App.state.finalResult = isPlainObject(data.result) ? data.result : null;

        writeRestoredReadingToBrowser();

        if (data.status === "completed" && App.state.finalResult) {
            App.modules.results.displayResult(App.state.finalResult);
            App.modules.payments.lockPremiumReading();
            App.showScreen("result");
            return;
        }

        beginOrResumeQuiz();
    }

    async function deleteReading(readingId, button) {
        const shouldDelete = window.confirm(
            "Delete this saved reading permanently? This cannot be undone."
        );
        if (!shouldDelete) return;

        setButtonBusy(button, true, "Deleting…");
        hideDashboardMessage();

        try {
            const { error } = await account.client
                .from("readings")
                .delete()
                .eq("id", readingId);
            if (error) throw error;

            if (account.activeReadingId === readingId) {
                account.activeReadingId = null;
                persistActiveReadingId();
            }

            await loadReadings();
            showDashboardMessage("The saved reading has been deleted.", "success");
        } catch (error) {
            showDashboardMessage(humaniseError(error), "error");
        } finally {
            setButtonBusy(button, false);
        }
    }

    function writeRestoredReadingToBrowser() {
        const normalAnswers = {};
        const privateAnswers = {};

        Object.entries(App.state.answers).forEach(([key, value]) => {
            const target = App.privateAnswerIds.has(key) ? privateAnswers : normalAnswers;
            target[key] = value;
        });

        App.storage.writeJSON("localStorage", App.storageKeys.answers, normalAnswers);
        App.storage.writeJSON("sessionStorage", App.storageKeys.privateAnswers, privateAnswers);
        App.storage.writeText(
            "localStorage",
            App.storageKeys.questionIndex,
            App.state.currentQuestionIndex
        );

        if (App.state.finalResult) {
            App.storage.writeJSON("localStorage", App.storageKeys.result, App.state.finalResult);
        } else {
            App.storage.removeStoredValue("localStorage", App.storageKeys.result);
        }
    }

    function queueProgressSync() {
        if (!account.configured || !account.user || App.state.profile.mode !== "account") {
            return;
        }

        window.clearTimeout(account.syncTimer);
        account.syncTimer = window.setTimeout(() => {
            enqueueSync(syncProgress);
        }, ACCOUNT_SYNC_DELAY);
    }

    function saveCompletedReading(result) {
        if (!account.configured || !account.user || App.state.profile.mode !== "account") {
            return;
        }

        window.clearTimeout(account.syncTimer);
        enqueueSync(() => syncProgress(result));
    }

    function enqueueSync(task) {
        account.syncChain = account.syncChain
            .catch(() => undefined)
            .then(task)
            .catch((error) => {
                console.error("Could not save the reading to Supabase.", error);
                showDashboardMessage(
                    "Your browser copy is safe, but the account copy could not be updated yet.",
                    "error"
                );
            });

        return account.syncChain;
    }

    async function flushProgressSync() {
        window.clearTimeout(account.syncTimer);

        if (
            !account.configured
            || !account.user
            || App.state.profile.mode !== "account"
            || !account.activeReadingId
        ) {
            return;
        }

        await enqueueSync(() => syncProgress(null));
    }

    async function syncProgress(completedResult) {
        if (!account.user) return;

        const result = completedResult === undefined ? null : completedResult;
        const isCompleted = Boolean(result);
        const payload = {
            user_id: account.user.id,
            status: isCompleted ? "completed" : "in_progress",
            current_question_index: clampQuestionIndex(App.state.currentQuestionIndex),
            answers: sanitiseJsonObject(App.state.answers),
            result: isCompleted ? sanitiseJsonObject(result) : null,
            completed_at: isCompleted ? new Date().toISOString() : null
        };

        if (!account.activeReadingId) {
            const { data, error } = await account.client
                .from("readings")
                .insert(payload)
                .select("id")
                .single();

            if (error) throw error;
            account.activeReadingId = isCompleted ? null : data.id;
            if (isCompleted) {
                App.storage.removeStoredValue("localStorage", App.storageKeys.activeReadingId);
            } else {
                persistActiveReadingId();
            }
        } else {
            const readingId = account.activeReadingId;
            const { error } = await account.client
                .from("readings")
                .update(payload)
                .eq("id", readingId);

            if (error) throw error;

            if (isCompleted) {
                account.activeReadingId = null;
                persistActiveReadingId();
            }
        }

        if (isCompleted) {
            await loadReadings();
            account.activeReadingId = null;
            persistActiveReadingId();
        }
    }

    async function ensureActiveReading() {
        if (!account.user) return null;
        if (account.activeReadingId) return account.activeReadingId;

        const payload = {
            user_id: account.user.id,
            status: "in_progress",
            current_question_index: clampQuestionIndex(App.state.currentQuestionIndex),
            answers: sanitiseJsonObject(App.state.answers),
            result: null,
            completed_at: null
        };

        const { data, error } = await account.client
            .from("readings")
            .insert(payload)
            .select("id")
            .single();

        if (error) throw error;

        account.activeReadingId = data.id;
        persistActiveReadingId();
        return data.id;
    }

    function clearActiveReading() {
        window.clearTimeout(account.syncTimer);
        account.activeReadingId = null;
        persistActiveReadingId();
    }

    async function updateFirstName(name) {
        const cleaned = cleanName(name);
        if (!cleaned || !account.user) return;

        App.state.profile.name = cleaned;
        App.saveProfile();

        const { error } = await account.client
            .from("profiles")
            .update({ first_name: cleaned })
            .eq("id", account.user.id);

        if (error) {
            console.warn("The account name could not be updated.", error);
            return;
        }

        account.profile = { ...account.profile, first_name: cleaned };
        renderAccountSummary();
    }

    function renderReadings() {
        if (!ui.readingsList || !ui.readingsEmpty) return;

        ui.readingsList.replaceChildren();
        ui.readingsEmpty.hidden = account.readings.length !== 0;

        account.readings.forEach((reading) => {
            ui.readingsList.appendChild(createReadingCard(reading));
        });

        const hasInProgress = account.readings.some(
            (reading) => reading.status === "in_progress"
        );
        const hasLocalReading = hasMeaningfulLocalProgress();

        if (ui.resumeButton) {
            ui.resumeButton.hidden = !hasInProgress && !hasLocalReading;
            ui.resumeButton.textContent = hasInProgress
                ? "Resume Current Reading"
                : App.state.finalResult
                    ? "Save This Reading to My Account"
                    : "Save & Resume This Reading";
        }
    }


    function hasMeaningfulLocalProgress() {
        if (App.state.finalResult) return true;
        if (App.state.currentQuestionIndex > 0) return true;

        return Object.keys(App.state.answers).some((key) => key !== "firstName");
    }

    function createReadingCard(reading) {
        const article = document.createElement("article");
        article.className = "saved-reading-card";

        const main = document.createElement("div");
        main.className = "saved-reading-copy";

        const status = document.createElement("span");
        status.className = `reading-status reading-status-${reading.status}`;
        status.textContent = reading.status === "completed" ? "Completed" : "In progress";

        const title = document.createElement("h4");
        title.textContent = getReadingTitle(reading);

        const details = document.createElement("p");
        details.textContent = getReadingDetails(reading);

        main.append(status, title, details);

        const actions = document.createElement("div");
        actions.className = "saved-reading-actions";

        const openButton = document.createElement("button");
        openButton.className = "secondary-button compact-button";
        openButton.type = "button";
        openButton.dataset.readingAction = "open";
        openButton.dataset.readingId = reading.id;
        openButton.textContent = reading.status === "completed" ? "View Reading" : "Resume";

        const deleteButton = document.createElement("button");
        deleteButton.className = "quiet-button danger-text-button";
        deleteButton.type = "button";
        deleteButton.dataset.readingAction = "delete";
        deleteButton.dataset.readingId = reading.id;
        deleteButton.textContent = "Delete";

        actions.append(openButton, deleteButton);
        article.append(main, actions);
        return article;
    }

    function getReadingTitle(reading) {
        const result = isPlainObject(reading.result) ? reading.result : null;

        if (result?.reference) {
            return `Reading ${result.reference}`;
        }

        const question = Math.min(
            App.modules.quiz.questions.length,
            Number(reading.current_question_index || 0) + 1
        );
        return `Reading in progress — question ${question}`;
    }

    function getReadingDetails(reading) {
        const dateValue = reading.completed_at || reading.updated_at || reading.created_at;
        const date = formatDate(dateValue);
        const result = isPlainObject(reading.result) ? reading.result : null;

        if (reading.status === "completed" && result) {
            return `${result.generatedFor || "Your"} reading · ${result.compatibility || "—"}% compatibility · ${date}`;
        }

        return `Last saved ${date}`;
    }

    function renderAccountSummary() {
        if (!account.user) return;

        const name = cleanName(account.profile?.first_name || App.state.profile.name || "Reader") || "Reader";
        if (ui.accountName) ui.accountName.textContent = `Welcome, ${name}`;
        if (ui.accountEmail) ui.accountEmail.textContent = account.user.email || "";
    }

    function showLoadingState() {
        if (ui.authLoadingPanel) ui.authLoadingPanel.hidden = false;
        if (ui.signedOutPanel) ui.signedOutPanel.hidden = true;
        if (ui.dashboard) ui.dashboard.hidden = true;
    }

    function showSignedOutState() {
        if (ui.authLoadingPanel) ui.authLoadingPanel.hidden = true;
        if (ui.signedOutPanel) ui.signedOutPanel.hidden = false;
        if (ui.dashboard) ui.dashboard.hidden = true;
        showAuthView("sign-in", { keepMessage: true });
    }

    function showDashboardState() {
        if (ui.authLoadingPanel) ui.authLoadingPanel.hidden = true;
        if (ui.signedOutPanel) ui.signedOutPanel.hidden = true;
        if (ui.dashboard) ui.dashboard.hidden = false;
        renderAccountSummary();
        renderReadings();
    }

    function showAuthView(view, options = {}) {
        const isSignIn = view === "sign-in";
        const isSignUp = view === "sign-up";
        const isForgot = view === "forgot";

        if (ui.signInForm) ui.signInForm.hidden = !isSignIn;
        if (ui.signUpForm) ui.signUpForm.hidden = !isSignUp;
        if (ui.forgotPasswordForm) ui.forgotPasswordForm.hidden = !isForgot;

        ui.signInTab?.classList.toggle("active", isSignIn);
        ui.signUpTab?.classList.toggle("active", isSignUp);
        ui.signInTab?.setAttribute("aria-selected", String(isSignIn));
        ui.signUpTab?.setAttribute("aria-selected", String(isSignUp));

        const tabs = ui.signInTab?.parentElement;
        if (tabs) tabs.hidden = isForgot;

        if (!options.keepMessage) hideAuthMessage();

        const target = isSignUp
            ? ui.signUpName
            : isForgot
                ? ui.forgotPasswordEmail
                : ui.signInEmail;
        window.setTimeout(() => target?.focus({ preventScroll: true }), 50);
    }

    function showRecoveryDialog() {
        if (!ui.recoveryDialog) return;
        ui.recoveryDialog.hidden = false;
        hideRecoveryMessage();
        window.setTimeout(() => ui.recoveryPassword?.focus(), 50);
    }

    function hideRecoveryDialog() {
        if (ui.recoveryDialog) ui.recoveryDialog.hidden = true;
    }

    function updateHeaderAccountButton() {
        if (!ui.accountButton) return;
        ui.accountButton.textContent = account.user ? "My account" : "Sign in";
        ui.accountButton.setAttribute(
            "aria-label",
            account.user ? "Open your account" : "Sign in or create an account"
        );
    }

    function showAuthMessage(message, type = "info") {
        showMessage(ui.authMessage, message, type);
    }

    function hideAuthMessage() {
        hideMessage(ui.authMessage);
    }

    function showDashboardMessage(message, type = "info") {
        showMessage(ui.dashboardMessage, message, type);
    }

    function hideDashboardMessage() {
        hideMessage(ui.dashboardMessage);
    }

    function showRecoveryMessage(message, type = "info") {
        showMessage(ui.recoveryMessage, message, type);
    }

    function hideRecoveryMessage() {
        hideMessage(ui.recoveryMessage);
    }

    function showMessage(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.dataset.type = type;
        element.hidden = false;
    }

    function hideMessage(element) {
        if (!element) return;
        element.hidden = true;
        element.textContent = "";
        delete element.dataset.type;
    }

    function setAccountFormsDisabled(disabled) {
        [ui.signInForm, ui.signUpForm, ui.forgotPasswordForm].forEach((form) => {
            form?.querySelectorAll("input, button").forEach((control) => {
                control.disabled = disabled;
            });
        });
    }

    function setFormBusy(form, busy, busyText = "Working…") {
        if (!form) return;

        const submit = form.querySelector('button[type="submit"]');
        form.querySelectorAll("input, button").forEach((control) => {
            control.disabled = busy;
        });

        if (!submit) return;

        if (busy) {
            submit.dataset.originalText = submit.textContent;
            submit.textContent = busyText;
        } else {
            submit.textContent = submit.dataset.originalText || submit.textContent;
            delete submit.dataset.originalText;
        }
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

    function persistActiveReadingId() {
        if (account.activeReadingId) {
            App.storage.writeText(
                "localStorage",
                App.storageKeys.activeReadingId,
                account.activeReadingId
            );
        } else {
            App.storage.removeStoredValue("localStorage", App.storageKeys.activeReadingId);
        }
    }

    function clampQuestionIndex(value) {
        const max = Math.max(0, App.modules.quiz.questions.length - 1);
        const numeric = Number(value);
        if (!Number.isInteger(numeric)) return 0;
        return Math.min(max, Math.max(0, numeric));
    }

    function sanitiseJsonObject(value) {
        if (!isPlainObject(value)) return {};

        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            console.warn("Could not prepare account data for saving.", error);
            return {};
        }
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function getRedirectUrl() {
        const url = new URL(window.location.href);
        url.hash = "";
        url.search = "";
        return url.toString();
    }

    function formatDate(value) {
        if (!value) return "recently";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "recently";

        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function humaniseAuthError(error) {
        const message = String(error?.message || "").toLowerCase();

        if (message.includes("invalid login credentials")) {
            return "The email address or password was not recognised.";
        }
        if (message.includes("email not confirmed")) {
            return "Confirm your email address before signing in.";
        }
        if (message.includes("user already registered")) {
            return "An account already exists for that email address. Try signing in instead.";
        }
        if (message.includes("password")) {
            return "The password does not meet the account security requirements.";
        }
        if (message.includes("rate limit") || message.includes("too many")) {
            return "Too many attempts were made. Wait a little while and try again.";
        }
        if (message.includes("fetch") || message.includes("network")) {
            return "The account service could not be reached. Check your connection and try again.";
        }

        return humaniseError(error);
    }

    function humaniseError(error) {
        const message = String(error?.message || "").trim();
        return message || "Something went wrong. Please try again.";
    }

    function isValidEmail(value) {
        return value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function cleanEmail(value) {
        return String(value).trim().toLowerCase().slice(0, 120);
    }

    function cleanName(value) {
        return String(value)
            .normalize("NFC")
            .replace(/[^\p{L}\p{M}'’ -]/gu, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 30);
    }

    App.modules.auth = {
        init,
        openProfileScreen,
        beginOrResumeQuiz,
        startNewReading,
        queueProgressSync,
        flushProgressSync,
        saveCompletedReading,
        clearActiveReading,
        updateFirstName,
        isValidEmail,
        cleanEmail,
        cleanName,
        get client() {
            return account.client;
        },
        get user() {
            return account.user;
        }
    };
})();
