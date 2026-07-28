"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before auth.js");

    let initialised = false;

    function init() {
        if (initialised) return;
        initialised = true;

        App.elements.startButtons.forEach((button) => {
            button.addEventListener("click", openProfileScreen);
        });

        App.elements.guestButton?.addEventListener("click", continueAsGuest);
        App.elements.profileForm?.addEventListener("submit", saveLocalProfile);
    }

    function openProfileScreen() {
        hideProfileError();

        if (App.elements.profileNameInput) {
            App.elements.profileNameInput.value = App.state.profile.name || "";
        }

        if (App.elements.profileEmailInput) {
            App.elements.profileEmailInput.value = App.state.profile.email || "";
        }

        App.showScreen("profile");
    }

    function continueAsGuest() {
        App.state.profile = { mode: "guest", name: "", email: "" };
        App.saveProfile();
        beginOrResumeQuiz();
    }

    function saveLocalProfile(event) {
        event.preventDefault();

        const name = cleanName(App.elements.profileNameInput?.value ?? "");
        const email = cleanEmail(App.elements.profileEmailInput?.value ?? "");

        if (!name) {
            showProfileError("Please enter your first name, or continue as a guest.");
            App.elements.profileNameInput?.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showProfileError("Please enter a valid email address.");
            App.elements.profileEmailInput?.focus();
            return;
        }

        App.state.profile = {
            mode: "saved",
            name,
            email
        };
        App.saveProfile();

        if (!App.state.answers.firstName) {
            App.state.answers.firstName = name;
        }

        App.saveProgress();
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

    function showProfileError(message) {
        if (!App.elements.profileError) return;
        App.elements.profileError.textContent = message;
        App.elements.profileError.hidden = false;
    }

    function hideProfileError() {
        if (!App.elements.profileError) return;
        App.elements.profileError.hidden = true;
        App.elements.profileError.textContent = "";
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
        isValidEmail,
        cleanEmail,
        cleanName
    };
})();
