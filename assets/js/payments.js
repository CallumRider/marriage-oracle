"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before payments.js");

    let initialised = false;
    let revealTimerOne = null;
    let revealTimerTwo = null;

    function init() {
        if (initialised) return;
        initialised = true;

        App.elements.unlockButton?.addEventListener("click", handleUnlock);
        App.elements.shareButton?.addEventListener("click", shareReading);
        App.elements.emailButton?.addEventListener("click", emailReading);
        App.elements.printButton?.addEventListener("click", () => window.print());
        App.elements.restartButton?.addEventListener("click", restartReading);
    }

    function handleUnlock() {
        if (App.config.demoMode) {
            unlockPremiumReading();
            return;
        }

        if (!App.config.paymentLink) {
            window.alert(
                "A payment link has not been added yet. Keep demo mode active while testing."
            );
            return;
        }

        App.storage.writeText(
            "sessionStorage",
            App.storageKeys.awaitingPayment,
            "true"
        );
        window.location.assign(App.config.paymentLink);
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
            "Start again and clear the answers saved in this browser?"
        );
        if (!shouldRestart) return;

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
        lockPremiumReading,
        unlockPremiumReading,
        buildEmailBody
    };
})();
