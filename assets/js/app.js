"use strict";

// =====================================================
// SIMPLE SETTINGS YOU CAN CHANGE LATER
// =====================================================

const SITE_NAME = "The Marriage Oracle";
const PRICE_TEXT = "£0.99";

// Leave blank while testing. Later, paste your Stripe Payment Link here.
const PAYMENT_LINK = "";

// Keep true while testing. No payment is taken in demo mode.
const DEMO_MODE = true;

// Questions about beliefs are kept only for the current browser session.
const PRIVATE_ANSWER_IDS = new Set(["beliefRole", "sharedBeliefs", "portraitBackground"]);


// AUTOMATIC PAGE UPGRADE
// This lets you replace only script.js. Your existing HTML and CSS can stay.
// =====================================================

upgradePageMarkup();

function upgradePageMarkup() {
    // Replace the old CSS-built guide with the finished artwork when needed.
    const largeFrame = document.querySelector(".oracle-display .ornamental-frame");
    if (largeFrame && !largeFrame.querySelector(".matchmaker-image")) {
        largeFrame.classList.add("matchmaker-frame");
        largeFrame.innerHTML = `
            <img class="matchmaker-image"
                 src="assets/images/matchmaker/matchmaker.png"
                 alt="The Marriage Oracle's friendly Victorian matchmaker">
            <div class="frame-stars" aria-hidden="true">✦</div>
        `;
    }

    const miniFrame = document.querySelector(".quiz-guide-panel .mini-frame");
    if (miniFrame && !miniFrame.querySelector(".mini-matchmaker-image")) {
        miniFrame.innerHTML = `
            <img class="mini-matchmaker-image"
                 src="assets/images/matchmaker/matchmaker.png"
                 alt=""
                 aria-hidden="true">
        `;
    }

    // Replace the old result silhouette with a portrait image when needed.
    const oldSilhouette = document.getElementById("companion-silhouette");
    if (oldSilhouette && !document.getElementById("companion-portrait")) {
        const portraitWrap = document.createElement("div");
        portraitWrap.className = "companion-portrait-wrap";
        portraitWrap.innerHTML = `
            <img id="companion-portrait"
                 class="companion-portrait portrait-obscured"
                 src=""
                 alt="Vintage portrait selected for this companion reading">
        `;
        oldSilhouette.replaceWith(portraitWrap);
    }
    const trustItems = document.querySelectorAll(".trust-row span");
    if (trustItems[0]) trustItems[0].textContent = "33 thoughtful questions";

    const statCards = document.querySelectorAll(".stat-strip article");
    if (statCards[0]) {
        statCards[0].querySelector("strong").textContent = "33";
        statCards[0].querySelector("span").textContent = "Personal questions";
    }
    if (statCards[1]) {
        statCards[1].querySelector("strong").textContent = "11";
        statCards[1].querySelector("span").textContent = "Detailed result areas";
    }
    if (statCards[2]) {
        statCards[2].querySelector("strong").textContent = "1,000s";
        statCards[2].querySelector("span").textContent = "Possible reading combinations";
    }

    const bottomStart = document.getElementById("bottom-start-button");
    if (bottomStart) bottomStart.textContent = "Start the 33-Question Reading";

    const initialProgress = document.getElementById("progress-count");
    if (initialProgress) initialProgress.textContent = "Question 1 of 33";

    const profileNote = document.querySelector("#profile-screen .small-note");
    if (profileNote) {
        profileNote.textContent = "Questions about beliefs and portrait appearance are optional. You may choose ‘Prefer not to say’ wherever it is offered.";
    }

    const resultSummary = document.getElementById("result-summary");
    if (resultSummary && !document.getElementById("reading-reference")) {
        const reference = document.createElement("p");
        reference.id = "reading-reference";
        reference.className = "small-note";
        reference.textContent = "Reading reference: MO-000000";
        resultSummary.insertAdjacentElement("afterend", reference);
    }

    const lockedHeading = document.querySelector(".locked-heading h3");
    if (lockedHeading) lockedHeading.textContent = "Eleven detailed clues are ready";

    const price = document.getElementById("price-badge");
    if (price) price.textContent = PRICE_TEXT;

    const premium = document.getElementById("premium-reading");
    if (premium) {
        premium.innerHTML = `
            <article class="reading-card">
                <span class="reading-icon">✒</span>
                <div><small>Possible name</small><strong id="partner-name">Alexander</strong><p id="name-explanation">A generation-aware name clue selected from your answers.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">◷</span>
                <div><small>Likely life stage</small><strong id="partner-age">Experienced but open to a new chapter</strong><p id="age-explanation">Shared pace and values may matter more than an exact number.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">❦</span>
                <div><small>Personality</small><strong id="partner-personality">Kind, patient and quietly humorous</strong><p id="personality-explanation">They are likely to value consistency and genuine companionship.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">♙</span>
                <div><small>Appearance clue</small><strong id="partner-appearance">Kind eyes and an understated style</strong><p id="appearance-explanation">Their warmth is likely to be more memorable than any single feature.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">☼</span>
                <div><small>Values and outlook</small><strong id="partner-values">Respectful and guided by shared values</strong><p id="values-explanation">Mutual respect is likely to matter more than complete agreement.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">⌖</span>
                <div><small>Where you may meet</small><strong id="meeting-place">Through friends or a familiar community</strong><p id="meeting-explanation">The connection may begin naturally rather than through a dramatic introduction.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">⚭</span>
                <div><small>Relationship dynamic</small><strong id="relationship-dynamic">A steady friendship that deepens into affection</strong><p id="relationship-explanation">The relationship is likely to find a comfortable balance of closeness and independence.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">♡</span>
                <div><small>Affection style</small><strong id="affection-style">Thoughtful words and remembered details</strong><p id="affection-explanation">Small, personal gestures may become one of the clearest signs of care.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">◷</span>
                <div><small>Relationship timing</small><strong id="relationship-year">2029</strong><p id="timing-explanation">This indicates a period when your routine may open to a new connection.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">⌂</span>
                <div><small>Future life</small><strong id="future-home">A comfortable home near family</strong><p id="home-explanation">Your result favours familiarity, warmth and shared traditions.</p></div>
            </article>
            <article class="reading-card">
                <span class="reading-icon">✦</span>
                <div><small>Oracle message</small><strong id="oracle-message">The strongest bond begins with trust.</strong><p id="message-explanation">Do not overlook the person who makes ordinary moments feel peaceful.</p></div>
            </article>

            <div id="locked-overlay" class="locked-overlay">
                <span class="lock-symbol" aria-hidden="true">♜</span>
                <h3>Your detailed reading is prepared</h3>
                <p>Unlock the age-matched name, life-stage clue, personality, values, appearance, meeting story, relationship style, affection pattern, timing and future-life reading.</p>
                <button id="unlock-button" class="primary-button" type="button">Preview Full Reading — ${PRICE_TEXT}</button>
                <small id="payment-note">Demo mode is active. No payment will be taken.</small>
            </div>
        `;
    }

    const actions = document.getElementById("result-actions");
    if (actions) {
        actions.innerHTML = `
            <button id="share-button" class="primary-button" type="button">Share My Reading</button>
            <button id="email-button" class="secondary-button" type="button">Prepare an Email Copy</button>
            <button id="print-button" class="secondary-button" type="button">Print or Save as PDF</button>
            <button id="restart-button" class="quiet-button large-quiet-button" type="button">Take the Reading Again</button>
        `;
    }
}


// ELEMENTS
// =====================================================

const screens = {
    home: document.getElementById("home-screen"),
    profile: document.getElementById("profile-screen"),
    quiz: document.getElementById("quiz-screen"),
    loading: document.getElementById("loading-screen"),
    result: document.getElementById("result-screen")
};

const startButtons = [
    document.getElementById("hero-start-button"),
    document.getElementById("header-start-button"),
    document.getElementById("bottom-start-button"),
    document.getElementById("footer-start-button")
].filter(Boolean);

const profileForm = document.getElementById("profile-form");
const guestButton = document.getElementById("guest-button");
const profileNameInput = document.getElementById("profile-name");
const profileEmailInput = document.getElementById("profile-email");
const profileError = document.getElementById("profile-error");

const questionForm = document.getElementById("question-form");
const questionTitle = document.getElementById("question-title");
const questionHelp = document.getElementById("question-help");
const questionNumberLabel = document.getElementById("question-number-label");
const answerArea = document.getElementById("answer-area");
const questionError = document.getElementById("question-error");
const nextButton = document.getElementById("next-button");
const backButton = document.getElementById("back-button");
const sectionName = document.getElementById("section-name");
const progressCount = document.getElementById("progress-count");
const progressPercentage = document.getElementById("progress-percentage");
const progressTrack = document.getElementById("progress-track");
const progressBar = document.getElementById("progress-bar");
const guideSpeech = document.getElementById("guide-speech");
const savedStatus = document.getElementById("saved-status");

const quitQuizButton = document.getElementById("quit-quiz-button");
const saveExitDialog = document.getElementById("save-exit-dialog");
const continueQuizButton = document.getElementById("continue-quiz-button");
const confirmExitButton = document.getElementById("confirm-exit-button");

const loadingProgressBar = document.getElementById("loading-progress-bar");
const loadingPercentage = document.getElementById("loading-percentage");
const loadingMessage = document.getElementById("loading-message");
const analysisItems = [
    document.getElementById("analysis-one"),
    document.getElementById("analysis-two"),
    document.getElementById("analysis-three"),
    document.getElementById("analysis-four")
];

const unlockButton = document.getElementById("unlock-button");
const premiumReading = document.getElementById("premium-reading");
const lockedOverlay = document.getElementById("locked-overlay");
const resultActions = document.getElementById("result-actions");
const shareButton = document.getElementById("share-button");
const emailButton = document.getElementById("email-button");
const printButton = document.getElementById("print-button");
const restartButton = document.getElementById("restart-button");
const paymentNote = document.getElementById("payment-note");
const priceBadge = document.getElementById("price-badge");

// =====================================================
// APP STATE
// =====================================================

let currentQuestionIndex = 0;
let answers = {};
let profile = { mode: "guest", name: "", email: "" };
let finalResult = null;
let loadingTimer = null;

const STORAGE_KEYS = {
    profile: "marriageOracleProfileV2",
    answers: "marriageOracleAnswersV2",
    privateAnswers: "marriageOraclePrivateAnswersV2",
    questionIndex: "marriageOracleQuestionIndexV2",
    result: "marriageOracleResultV2"
};

// =====================================================

// SAVE AND EXIT
// =====================================================

quitQuizButton.addEventListener("click", () => {
    saveProgress();
    saveExitDialog.hidden = false;
});

continueQuizButton.addEventListener("click", () => {
    saveExitDialog.hidden = true;
});

confirmExitButton.addEventListener("click", () => {
    saveExitDialog.hidden = true;
    showScreen("home");
});

saveExitDialog.addEventListener("click", (event) => {
    if (event.target === saveExitDialog) {
        saveExitDialog.hidden = true;
    }
});

// =====================================================

// STORAGE
// =====================================================

function saveProgress() {
    const normalAnswers = {};
    const privateAnswers = {};

    Object.entries(answers).forEach(([key, value]) => {
        if (PRIVATE_ANSWER_IDS.has(key)) {
            privateAnswers[key] = value;
        } else {
            normalAnswers[key] = value;
        }
    });

    localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(normalAnswers));
    sessionStorage.setItem(STORAGE_KEYS.privateAnswers, JSON.stringify(privateAnswers));
    localStorage.setItem(STORAGE_KEYS.questionIndex, String(currentQuestionIndex));
}

function restoreSavedProfile() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile));

        if (saved && typeof saved === "object") {
            profile = {
                mode: saved.mode === "saved" ? "saved" : "guest",
                name: typeof saved.name === "string" ? saved.name : "",
                email: typeof saved.email === "string" ? saved.email : ""
            };
        }
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.profile);
    }
}

function restoreSavedProgress() {
    try {
        const savedAnswers = JSON.parse(localStorage.getItem(STORAGE_KEYS.answers)) || {};
        const privateAnswers = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.privateAnswers)) || {};
        const savedIndex = Number(localStorage.getItem(STORAGE_KEYS.questionIndex));

        if (typeof savedAnswers === "object" && typeof privateAnswers === "object") {
            answers = { ...savedAnswers, ...privateAnswers };
        }

        if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < questions.length) {
            currentQuestionIndex = savedIndex;
        }
    } catch (error) {
        clearQuizProgress();
    }
}

function clearQuizProgress() {
    localStorage.removeItem(STORAGE_KEYS.answers);
    sessionStorage.removeItem(STORAGE_KEYS.privateAnswers);
    localStorage.removeItem(STORAGE_KEYS.questionIndex);
    localStorage.removeItem(STORAGE_KEYS.result);
}

// =====================================================
// HELPERS
// =====================================================

function showScreen(screenName) {
    Object.entries(screens).forEach(([name, element]) => {
        element.hidden = name !== screenName;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function createSeed(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return Math.abs(hash >>> 0);
}

function choose(list, seed, offset = 0) {
    return list[(seed + offset) % list.length];
}

function capitalise(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function toRoman(number) {
    const numerals = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let remaining = number;
    let result = "";

    numerals.forEach(([value, symbol]) => {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    });

    return result;
}

function rotateHomeGuideMessage() {
    const messages = [
        "The smallest choices often reveal the greatest clues.",
        "A lasting bond is often hidden inside ordinary preferences.",
        "Your answers tell a story long before the final card is turned.",
        "Choose honestly. The most convincing reading begins there.",
        "Thirty-three small decisions can create thousands of possible readings."
    ];

    const messageElement = document.getElementById("home-guide-message");
    let index = 0;

    setInterval(() => {
        index = (index + 1) % messages.length;
        messageElement.textContent = messages[index];
    }, 6000);
}



// Handy testing command: type resetMarriageOracle() in the browser console.
window.resetMarriageOracle = function resetMarriageOracle() {
    Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem("marriageOracleAwaitingPayment");
    location.reload();
};

// =====================================================
// STARTUP
// Called only after every split script has loaded.
// =====================================================

function initialiseApp() {
    document.getElementById("current-year").textContent = new Date().getFullYear();
    priceBadge.textContent = PRICE_TEXT;

    unlockButton.textContent = DEMO_MODE
        ? `Preview Full Reading — ${PRICE_TEXT}`
        : `Unlock Full Reading — ${PRICE_TEXT}`;

    paymentNote.textContent = DEMO_MODE
        ? "Testing mode is active. No payment will be taken."
        : "You will be sent to our secure payment page.";

    restoreSavedProfile();
    restoreSavedProgress();
    rotateHomeGuideMessage();

    startButtons.forEach((button) => {
        button.addEventListener("click", openProfileScreen);
    });

    document.querySelectorAll("[data-go-home]").forEach((button) => {
        button.addEventListener("click", () => showScreen("home"));
    });
}
