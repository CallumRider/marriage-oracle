"use strict";

// =====================================================
// UNLOCK, SHARE, EMAIL, PRINT AND RESTART
// =====================================================

unlockButton.addEventListener("click", () => {
    if (DEMO_MODE) {
        unlockPremiumReading();
        return;
    }

    if (!PAYMENT_LINK) {
        alert("A payment link has not been added yet. Keep DEMO_MODE set to true while testing.");
        return;
    }

    sessionStorage.setItem("marriageOracleAwaitingPayment", "true");
    window.location.href = PAYMENT_LINK;
});

function lockPremiumReading() {
    premiumReading.classList.add("locked");
    premiumReading.classList.remove("unlocked");
    lockedOverlay.hidden = false;
    resultActions.hidden = true;

    const portrait = document.getElementById("companion-portrait");
    if (portrait) {
        portrait.classList.add("portrait-obscured");
    }
}

function unlockPremiumReading() {
    premiumReading.classList.remove("locked");
    premiumReading.classList.add("unlocked");
    lockedOverlay.hidden = true;
    resultActions.hidden = false;

    const portrait = document.getElementById("companion-portrait");
    if (portrait) {
        portrait.classList.remove("portrait-obscured");
    }

    setTimeout(() => {
        resultActions.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
}

shareButton.addEventListener("click", async () => {
    if (!finalResult) return;

    const text = `${SITE_NAME} gave me a ${finalResult.compatibility}% compatibility indication, the initial ${finalResult.initial}, and the name clue ${finalResult.name}.`;

    try {
        if (navigator.share) {
            await navigator.share({ title: SITE_NAME, text, url: window.location.href });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${text} ${window.location.href}`);
            temporarilyChangeButton(shareButton, "Reading Copied");
        } else {
            alert(text);
        }
    } catch (error) {
        console.log("Sharing was cancelled.");
    }
});

emailButton.addEventListener("click", () => {
    if (!finalResult) return;

    const subject = encodeURIComponent("My Marriage Oracle entertainment reading");
    const body = encodeURIComponent(buildEmailBody(finalResult));
    window.location.href = `mailto:${profile.email || ""}?subject=${subject}&body=${body}`;
});

printButton.addEventListener("click", () => {
    window.print();
});

restartButton.addEventListener("click", () => {
    const shouldRestart = window.confirm("Start again and clear the answers saved in this browser?");

    if (!shouldRestart) return;

    clearQuizProgress();
    currentQuestionIndex = 0;
    answers = profile.mode === "saved" && profile.name ? { firstName: profile.name } : {};
    finalResult = null;
    showScreen("profile");
});

function buildEmailBody(result) {
    return [
        `${SITE_NAME} — entertainment reading`,
        `Reference: ${result.reference}`,
        "",
        `Possible initial: ${result.initial}`,
        `Possible name: ${result.name}`,
        `Companion life stage: ${result.ageClue.title}`,
        `Compatibility indication: ${result.compatibility}%`,
        `Temperament: ${result.temperament}`,
        `Personality: ${result.personality.title}`,
        `Values: ${result.values.title}`,
        `Relationship style: ${result.relationshipStyle.title}`,
        `Affection style: ${result.affection.title}`,
        `Meeting clue: ${result.meeting[0]}`,
        `Timing clue: ${result.relationshipYear}`,
        `Future life: ${result.futureHome.title}`,
        "",
        `Oracle message: ${result.oracleMessage.title}`,
        "",
    ].join("\n");
}

function temporarilyChangeButton(button, temporaryText) {
    const original = button.textContent;
    button.textContent = temporaryText;
    setTimeout(() => {
        button.textContent = original;
    }, 1800);
}


// Start the application only after all six files have loaded.
initialiseApp();
