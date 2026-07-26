"use strict";


// =====================================================
// TEMPORARY LOCAL PROFILE
// This keeps the current site working while payments stay disabled.
// It will be replaced with genuine Supabase account code later.
// =====================================================

// HOME AND PROFILE
// =====================================================

function openProfileScreen() {
    profileError.hidden = true;

    if (profile.name) {
        profileNameInput.value = profile.name;
    }

    if (profile.email) {
        profileEmailInput.value = profile.email;
    }

    showScreen("profile");
}

guestButton.addEventListener("click", () => {
    profile = { mode: "guest", name: "", email: "" };
    localStorage.removeItem(STORAGE_KEYS.profile);
    beginOrResumeQuiz();
});

profileForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = profileNameInput.value.trim();
    const email = profileEmailInput.value.trim();

    if (!name) {
        showProfileError("Please enter your first name, or continue as a guest.");
        profileNameInput.focus();
        return;
    }

    if (!isValidEmail(email)) {
        showProfileError("Please enter a valid email address.");
        profileEmailInput.focus();
        return;
    }

    profile = {
        mode: "saved",
        name: cleanName(name),
        email
    };

    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));

    if (!answers.firstName) {
        answers.firstName = profile.name;
    }

    beginOrResumeQuiz();
});

function beginOrResumeQuiz() {
    showScreen("quiz");

    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0;
    }

    renderQuestion();
}

function showProfileError(message) {
    profileError.textContent = message;
    profileError.hidden = false;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanName(value) {
    return value
        .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ' -]/g, "")
        .trim()
        .slice(0, 30);
}

// =====================================================
