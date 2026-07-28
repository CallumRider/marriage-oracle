"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before results.js");

    const Portraits = App.modules.portraits;
    let initialised = false;

    function init() {
        if (initialised) return;
        initialised = true;
    }

    function startReadingAnalysis() {
        App.showScreen("loading");
        resetAnalysisDisplay();

        if (App.state.loadingFrame !== null) {
            window.cancelAnimationFrame(App.state.loadingFrame);
        }

        const duration = App.utils.prefersReducedMotion() ? 100 : 2400;
        const startedAt = performance.now();

        function update(now) {
            const progress = Math.min(100, Math.round(((now - startedAt) / duration) * 100));
            setAnalysisProgress(progress);

            if (progress < 100) {
                App.state.loadingFrame = window.requestAnimationFrame(update);
                return;
            }

            App.state.loadingFrame = null;
            const result = generateResult();
            App.saveResult(result);
            displayResult(result);

            window.setTimeout(
                () => App.showScreen("result"),
                App.utils.prefersReducedMotion() ? 0 : 450
            );
        }

        App.state.loadingFrame = window.requestAnimationFrame(update);
    }

    function resetAnalysisDisplay() {
        App.elements.loadingProgressBar.style.width = "0%";
        App.elements.loadingPercentage.textContent = "0%";
        App.elements.loadingMessage.textContent = "Arranging the first clues...";

        App.elements.analysisItems.forEach((item, index) => {
            item.classList.toggle("active", index === 0);
            item.classList.remove("complete");
        });
    }

    function setAnalysisProgress(progress) {
        App.elements.loadingProgressBar.style.width = `${progress}%`;
        App.elements.loadingPercentage.textContent = `${progress}%`;
        updateAnalysisStage(progress);
    }

    function updateAnalysisStage(progress) {
        const stage = Math.min(3, Math.floor(progress / 25));
        const messages = [
            "Comparing your personality pattern...",
            "Studying your values and relationship outlook...",
            "Examining lifestyle and communication clues...",
            "Preparing the age-matched companion profile..."
        ];

        App.elements.loadingMessage.textContent = messages[stage];
        App.elements.analysisItems.forEach((item, index) => {
            item.classList.toggle("active", index === stage);
            item.classList.toggle("complete", index < stage || progress === 100);
        });
    }

function generateResult() {
    const seed = App.utils.createSeed(App.state.answers);
    const genderKey = getGenderKey(App.state.answers.interest);
    const partnerAgeKey = getPartnerAgeKey();
    const namePool = Portraits.data.namePools[partnerAgeKey]?.[genderKey] || Portraits.data.namePools["35 to 44"].neutral;
    const name = App.utils.choose(namePool, seed, 3);
    const temperament = App.utils.choose(Portraits.data.temperamentResults, seed, 7);
    const personality = buildPersonalityResult(seed);
    const appearance = buildAppearanceResult(seed, partnerAgeKey);
    const values = buildValuesResult(seed);
    const meeting = buildMeetingResult(App.state.answers.meetingPreference, seed);
    const relationshipStyle = buildRelationshipStyle(seed);
    const affection = buildAffectionResult(seed);
    const futureHome = buildHomeResult(seed);
    const oracleMessage = buildOracleMessage(seed);
    const ageClue = buildAgeClue(partnerAgeKey, seed);
    const compatibility = calculateCompatibility(seed);
    const currentYear = new Date().getFullYear();
    const relationshipYear = currentYear + 1 + (seed % 7);
    const generatedFor = App.state.answers.firstName || App.state.profile.name || "You";

    return {
        seed,
        reference: `MO-${String(seed).slice(-6).padStart(6, "0")}`,
        portraitPath: Portraits.getCompanionPortraitPath(
            { genderKey, partnerAgeKey, seed },
            App.state.answers.portraitBackground
        ),
        name,
        initial: name.charAt(0),
        genderKey,
        partnerAgeKey,
        compatibility,
        temperament,
        personality,
        appearance,
        values,
        meeting,
        relationshipStyle,
        affection,
        relationshipYear,
        timingExplanation: buildTimingExplanation(relationshipYear, seed),
        futureHome,
        oracleMessage,
        ageClue,
        summary: buildSummary(temperament, relationshipStyle),
        silhouetteCaption: buildSilhouetteCaption(genderKey),
        nameExplanation: buildNameExplanation(name, partnerAgeKey, seed),
        generatedFor
    };
}

function getPartnerAgeKey() {
    const selected = App.state.answers.partnerAge;

    if (Portraits.data.namePools[selected]) {
        return selected;
    }

    if (selected === "Similar to my age" && Portraits.data.namePools[App.state.answers.ageRange]) {
        return App.state.answers.ageRange;
    }

    if (selected === "No particular preference") {
        const ranges = Object.keys(Portraits.data.namePools);
        return App.utils.choose(ranges, App.utils.createSeed(App.state.answers), 41);
    }

    if (Portraits.data.namePools[App.state.answers.ageRange]) {
        return App.state.answers.ageRange;
    }

    return "35 to 44";
}

function buildPersonalityResult(seed) {
    const coreMap = {
        Loyalty: ["deeply loyal", "steadfast and trustworthy", "committed once trust is earned"],
        Kindness: ["naturally considerate", "gentle with other people's feelings", "warm-hearted and thoughtful"],
        Humour: ["quick-witted and playful", "able to find humour in ordinary life", "cheerful with a dry sense of humour"],
        Confidence: ["self-assured without being overpowering", "comfortable taking initiative", "calmly confident in company"],
        Patience: ["patient and emotionally steady", "slow to judge and good at listening", "calm when life becomes complicated"],
        Ambition: ["motivated and purposeful", "practical about long-term goals", "energetic and quietly determined"]
    };

    const balanceMap = {
        "Warm and sociable": ["sociable enough to share your world", "friendly and comfortable around others", "open and easy to talk to"],
        "Quiet and thoughtful": ["gentle and good at drawing you out", "comfortable with meaningful silence", "thoughtful rather than attention-seeking"],
        "Practical and dependable": ["organised and reliable in everyday life", "someone who keeps promises", "steady when plans need sorting out"],
        "Adventurous and curious": ["curious and open to new experiences", "ready to introduce fresh ideas", "enthusiastic without being reckless"],
        "Independent and strong-minded": ["secure enough to respect independence", "confident in their own identity", "close without becoming possessive"]
    };

    const careMap = {
        "A calm conversation": ["communicates openly and listens before reacting", "makes difficult conversations feel manageable"],
        "Shared humour": ["uses humour to create closeness without dismissing serious feelings", "knows when a laugh can make the day lighter"],
        "Practical help": ["shows love through useful actions and reliability", "notices what needs doing and quietly helps"],
        "Affection and reassurance": ["is comfortable expressing warmth and reassurance", "makes affection feel natural rather than forced"],
        "Time spent together without pressure": ["values calm, unhurried time together", "does not need constant activity to feel close"]
    };

    const coreChoices = coreMap[App.state.answers.importantQuality] || coreMap.Kindness;
    const balanceChoices = balanceMap[App.state.answers.selfDescription] || balanceMap["Quiet and thoughtful"];
    const careChoices = careMap[App.state.answers.communication] || careMap["A calm conversation"];

    const core = App.utils.choose(coreChoices, seed, 5);
    const balance = App.utils.choose(balanceChoices, seed, 13);
    const care = App.utils.choose(careChoices, seed, 23);

    return {
        title: `${App.utils.capitalise(core)}, ${balance}`,
        text: `They are likely to ${care}. Your answers suggest that character will become more attractive to you as consistency becomes clear.`
    };
}

function buildAppearanceResult(seed, partnerAgeKey) {
    const featureMap = {
        "Their smile": ["A warm, easy smile", "A smile that appears quickly in conversation", "A gentle smile that becomes memorable"],
        "Their eyes": ["Expressive, attentive eyes", "Calm eyes that make people feel heard", "Bright eyes with an observant expression"],
        "Their confidence": ["A composed posture and assured manner", "A calm, confident presence", "An easy way of carrying themselves"],
        "Their kindness towards others": ["An approachable face and gentle expression", "A naturally reassuring expression", "A face that seems open and considerate"],
        "Their sense of humour": ["A lively expression and distinctive laugh", "An amused look that appears often", "A playful smile and animated expression"],
        "Their style and appearance": ["A well-chosen, individual style", "A neat and quietly distinctive appearance", "A classic look with one memorable detail"]
    };

    const ageStyleMap = {
        "18 to 24": ["with a relaxed contemporary style", "with youthful energy and a casual style", "with an expressive, modern appearance"],
        "25 to 34": ["with a polished but relaxed style", "with an easy modern appearance", "with a neat style that never feels overdone"],
        "35 to 44": ["with a confident and settled style", "with a practical, understated appearance", "with a neat and self-assured presentation"],
        "45 to 54": ["with a classic, well-kept style", "with a composed and confident appearance", "with an understated sense of elegance"],
        "55 to 64": ["with a warm, classic style", "with a distinguished but approachable appearance", "with a calm and well-presented manner"],
        "65 to 74": ["with a traditional and reassuring style", "with a distinguished, friendly appearance", "with a calm presence and classic taste"],
        "75 or older": ["with a dignified and traditional appearance", "with a kind, familiar presence", "with classic style and a memorable expression"]
    };

    const feature = App.utils.choose(featureMap[App.state.answers.noticeFirst] || featureMap["Their smile"], seed, 17);
    const ageStyle = App.utils.choose(ageStyleMap[partnerAgeKey] || ageStyleMap["35 to 44"], seed, 31);

    return {
        title: `${feature} ${ageStyle}`,
        text: "Their expression, manner and warmth are likely to stand out more than any single physical feature."
    };
}

function buildValuesResult(seed) {
    const belief = App.state.answers.beliefRole;
    const shared = App.state.answers.sharedBeliefs;
    const family = App.state.answers.familyCloseness;

    let title = "Respectful, open-minded and guided by shared values";
    let text = "The strongest match is likely to respect your outlook without turning every difference into an argument.";

    if (belief === "They are central to my life" && shared === "Very important — I want a closely shared outlook") {
        title = "Closely aligned in faith, values or spiritual outlook";
        text = "Your reading favours someone who understands the traditions and beliefs that shape your daily decisions.";
    } else if (belief === "I value cultural or family traditions") {
        title = "Respectful of tradition, family and meaningful occasions";
        text = "They may value celebrations, familiar customs and the sense of continuity created by shared traditions.";
    } else if (shared === "Respect matters more than agreement") {
        title = "Open-minded, respectful and comfortable with differences";
        text = "The relationship is more likely to thrive through curiosity and mutual respect than through complete agreement.";
    } else if (belief === "They are not very important to me" || shared === "It is not important to me") {
        title = "Guided more by character and behaviour than ceremony";
        text = "You are likely to care most about how a person treats others and handles everyday life.";
    } else if (belief === "I am still deciding what I believe") {
        title = "Patient, thoughtful and willing to explore ideas without pressure";
        text = "A suitable partner is likely to allow your outlook to develop naturally while sharing their own views respectfully.";
    }

    const familyExtra = {
        "Very involved and regularly present": " Family connections are likely to be an important part of the partnership.",
        "Close, but with clear boundaries": " They should be comfortable with closeness while protecting the couple's private space.",
        "Occasional visits and celebrations": " Shared occasions may matter without controlling everyday life.",
        "Mostly independent as a couple": " The relationship is likely to feel strongest when the couple can make their own decisions.",
        "It depends on the family": " Flexibility and sensible boundaries will matter more than a fixed rule."
    };

    return {
        title,
        text: `${text}${familyExtra[family] || ""}`
    };
}

function buildMeetingResult(preference, seed) {
    const meetingMap = {
        "Through friends or family": [
            ["Through a trusted friend or relative", "A relaxed gathering, introduction or family occasion may lead to a conversation that continues after everyone else has gone home."],
            ["At a familiar celebration or friendly gathering", "Someone already within the wider circle may notice that your personalities would suit each other."],
            ["Through a recommendation from someone who knows you well", "The introduction may feel surprisingly natural because there is already a small sense of trust."]
        ],
        "At a hobby, club or community group": [
            ["Through a shared interest or local group", "The connection may begin while both of you are focused on an activity rather than actively searching for romance."],
            ["At a class, club or community event", "Repeated meetings may allow trust and humour to grow before either person calls it romance."],
            ["While helping with a shared activity", "A practical conversation could reveal an unexpectedly comfortable connection."]
        ],
        "While travelling or on a day trip": [
            ["During a journey or visit somewhere new", "A change of scenery may make it easier for an unexpected conversation to begin."],
            ["On a day trip, holiday or organised outing", "The first clue may be a shared observation or a small moment of helpfulness."],
            ["While exploring a place neither of you knows well", "A temporary setting may create a conversation that lasts much longer than the trip."]
        ],
        "In a café, shop or familiar local place": [
            ["In an ordinary place that becomes memorable", "The meeting may begin with a small act of helpfulness, recognition or humour."],
            ["Somewhere local that you visit more than once", "Familiarity may slowly turn a brief exchange into a proper conversation."],
            ["During an everyday errand", "The importance of the meeting may only become clear after a second encounter."]
        ],
        "At work or through a professional connection": [
            ["Through work or a practical shared responsibility", "Respect and reliability may appear before either person recognises the romantic possibility."],
            ["Through a colleague, project or professional event", "A capable and dependable first impression may become personal over time."],
            ["While solving an ordinary problem together", "The first attraction may come from calm teamwork rather than obvious flirting."]
        ],
        "Online before meeting in person": [
            ["Through an online conversation that feels unusually natural", "The connection may grow through steady messages before becoming more meaningful in person."],
            ["Online through a shared interest or introduction", "The most important clue may be how easily the conversation continues without pressure."],
            ["Through repeated messages rather than one dramatic opening", "Consistency and humour may build confidence before the first meeting."]
        ]
    };

    const choices = meetingMap[preference] || Object.values(meetingMap).flat();
    return App.utils.choose(choices, seed, 43);
}

function buildRelationshipStyle(seed) {
    const foundation = App.state.answers.relationshipFoundation;
    const stability = App.state.answers.stabilityExcitement;
    const conflict = App.state.answers.conflictStyle;

    const foundationMap = {
        Friendship: "A friendship-led bond that deepens into affection",
        "Shared goals": "A practical partnership built around shared plans",
        Passion: "An expressive relationship with warmth and strong attraction",
        "Family values": "A loyal relationship centred on family and tradition",
        "Independence and mutual respect": "A close partnership that still protects individuality"
    };

    const stabilityText = {
        "Mostly stability": "The relationship is likely to feel reassuring, consistent and easy to rely upon.",
        "A balance of stability and excitement": "There should be enough routine to feel safe and enough variety to keep life interesting.",
        "Mostly excitement and spontaneity": "Shared experiences and unexpected plans may keep the relationship lively.",
        "I am not sure yet": "The best match may help you discover the balance that feels natural rather than forcing a fixed style."
    };

    const conflictText = {
        "Talking calmly until it is resolved": "Honest conversation will be one of the partnership's clearest strengths.",
        "Taking time apart before talking": "Both people are likely to benefit from reflection before important discussions.",
        "A little humour to lower the tension": "Shared humour may help difficult moments feel less threatening.",
        "A practical compromise": "The relationship may work best when problems are treated as something to solve together.",
        "Reassurance that the relationship is secure": "Affection and reassurance will help disagreements remain manageable."
    };

    return {
        title: foundationMap[foundation] || App.utils.choose(Object.values(foundationMap), seed, 47),
        text: `${stabilityText[stability] || "The relationship is likely to find its own comfortable rhythm."} ${conflictText[conflict] || "Respectful communication will remain important."}`
    };
}

function buildAffectionResult(seed) {
    const affectionMap = {
        "A thoughtful message or letter": ["Thoughtful words and remembered details", "They are likely to express affection through personal messages, sincere compliments and careful listening."],
        "A warm hug or gentle touch": ["Warmth, closeness and natural physical affection", "Reassuring gestures may make the relationship feel safe without needing constant explanation."],
        "Practical help without being asked": ["Helpful actions and quiet reliability", "They may show love by making life easier, remembering responsibilities and stepping in when support is needed."],
        "Remembering an important detail": ["Attention, memory and small personal gestures", "They are likely to remember preferences, anniversaries and comments that other people might overlook."],
        "Planning time together": ["Shared plans and protected time together", "They may create closeness by arranging outings, meals or simple routines that belong to the two of you."],
        "Making me laugh when I need it": ["Humour, playfulness and emotional lightness", "They may recognise when laughter will help and when a serious feeling needs to be heard first."]
    };

    const selected = affectionMap[App.state.answers.affectionStyle];

    if (selected) {
        return { title: selected[0], text: selected[1] };
    }

    const fallback = App.utils.choose(Object.values(affectionMap), seed, 53);
    return { title: fallback[0], text: fallback[1] };
}

function buildHomeResult(seed) {
    const settingMap = {
        "A lively city": "A comfortable home with activity, convenience and plenty to do nearby",
        "A friendly town": "A welcoming home in a friendly town with familiar local places",
        "A quiet village": "A peaceful village home where neighbours know one another",
        "The countryside": "A calm home near open countryside and natural surroundings",
        "Near the coast": "A bright home near the coast, with regular walks and changing views",
        "Close to family, wherever that may be": "A warm home close enough for family visits and shared occasions"
    };

    const socialMap = {
        "A large circle and frequent plans": "Friends are likely to visit often, making the home feel lively and connected.",
        "A small circle of close friends": "The home may become a comfortable place for a few trusted people.",
        "Mostly family gatherings": "Family meals and celebrations may become some of the happiest shared memories.",
        "A mixture of company and quiet time": "The home is likely to balance sociable occasions with protected peaceful time.",
        "I am happiest with one close companion": "The strongest pleasure may come from calm routines shared by the two of you."
    };

    const weekendMap = {
        "A peaceful evening at home": "Evenings together may feel restful rather than uneventful.",
        "A meal with family or friends": "Food and conversation may become an important part of the household rhythm.",
        "A day trip somewhere new": "The home may act as a comfortable base for regular small adventures.",
        "Music, dancing or a celebration": "There may be a cheerful atmosphere and plenty of reasons to celebrate.",
        "Gardening, crafts or a favourite hobby": "Shared projects and hobbies may make ordinary days especially satisfying.",
        "A walk in the countryside or by the sea": "The happiest routines may include fresh air, gentle exercise and unhurried conversation."
    };

    return {
        title: settingMap[App.state.answers.homeSetting] || App.utils.choose(Object.values(settingMap), seed, 59),
        text: `${socialMap[App.state.answers.socialLife] || "The home is likely to feel warm and welcoming."} ${weekendMap[App.state.answers.idealWeekend] || "Shared routines may become more meaningful than grand gestures."}`
    };
}

function buildOracleMessage(seed) {
    const choices = Portraits.data.oracleMessages[App.state.answers.symbol] || Object.values(Portraits.data.oracleMessages).flat();
    return App.utils.choose(choices, seed, 67);
}

function buildAgeClue(partnerAgeKey, seed) {
    const descriptions = {
        "18 to 24": ["Close to the beginning of adult independence", "Their life may include education, first career steps or building confidence in a new routine."],
        "25 to 34": ["Building a settled adult life", "They may be establishing a career, home or clearer long-term direction."],
        "35 to 44": ["Experienced but still open to a fresh chapter", "They may understand themselves well and value a relationship that fits real everyday life."],
        "45 to 54": ["Confident in their identity and priorities", "They are likely to appreciate honesty, sensible boundaries and time that is genuinely enjoyed."],
        "55 to 64": ["Settled, capable and ready to value companionship", "They may bring life experience, humour and a clear understanding of what matters."],
        "65 to 74": ["Mature, independent and companionship-minded", "They may value shared routines, family connections and making good use of time together."],
        "75 or older": ["Experienced, traditional in some ways and young at heart in others", "The reading favours kindness, conversation and a strong appreciation of ordinary companionship."]
    };

    const base = descriptions[partnerAgeKey] || descriptions["35 to 44"];
    const variants = [
        base,
        [base[0], `${base[1]} Their outlook may feel younger or older than the number itself.`],
        [base[0], `${base[1]} Shared pace and values are likely to matter more than an exact age.`]
    ];

    const result = App.utils.choose(variants, seed, 71);
    return { title: result[0], text: result[1] };
}

function calculateCompatibility(seed) {
    let score = 84 + (seed % 12);

    if (App.state.answers.trustStyle === "After seeing consistent actions") score += 1;
    if (App.state.answers.stabilityExcitement === "A balance of stability and excitement") score += 1;
    if (App.state.answers.conflictStyle === "Talking calmly until it is resolved") score += 1;
    if (App.state.answers.sharedBeliefs === "Respect matters more than agreement") score += 1;

    return Math.min(score, 98);
}

function buildSummary(temperament, relationshipStyle) {
    const firstName = App.state.answers.firstName || App.state.profile.name || "Your";
    return `${firstName}'s answers point towards ${temperament.toLowerCase()} companionship and ${relationshipStyle.title.toLowerCase()}.`;
}

function buildSilhouetteCaption(genderKey) {
    if (genderKey === "man") return "A mysterious gentleman";
    if (genderKey === "woman") return "A mysterious lady";
    return "A mysterious future companion";
}

function buildNameExplanation(name, ageRange, seed) {
    const descriptions = [
        "a name associated with the generation and life stage you selected",
        "a familiar name drawn from the age range chosen for your companion",
        "a name whose period and style fit the life-stage clues in your answers",
        "a name selected from a generation-aware British name collection"
    ];

    return `${name} was selected as ${App.utils.choose(descriptions, seed, 73)}.`;
}

function buildTimingExplanation(year, seed) {
    const descriptions = [
        "a period when a change in routine may introduce new people",
        "a time when friendship and companionship may become more important",
        "a year when travel, family or community connections could create an opportunity",
        "a period when you may feel especially ready to recognise a compatible person",
        "a time when an ordinary introduction could develop more steadily than expected"
    ];

    return `${year} symbolises ${App.utils.choose(descriptions, seed, 79)}.`;
}

function getGenderKey(interestAnswer) {
    if (interestAnswer === "A man") return "man";
    if (interestAnswer === "A woman") return "woman";
    return "neutral";
}

    function displayResult(result) {
        setText("result-main-title", `${result.generatedFor}, a meaningful connection is indicated`);
        setText("result-summary", result.summary);
        setText("reading-reference", `Reading reference: ${result.reference}`);
        setText("result-initial", result.initial);
        setText("compatibility-score", `${result.compatibility}%`);
        setText("free-temperament", result.temperament);
        setText("free-meeting-clue", result.meeting[0]);
        setText("free-relationship-style", result.relationshipStyle.title);
        setText("silhouette-caption", result.silhouetteCaption);

        setText("partner-name", result.name);
        setText("name-explanation", result.nameExplanation);
        setText("partner-age", result.ageClue.title);
        setText("age-explanation", result.ageClue.text);
        setText("partner-personality", result.personality.title);
        setText("personality-explanation", result.personality.text);
        setText("partner-appearance", result.appearance.title);
        setText("appearance-explanation", result.appearance.text);
        setText("partner-values", result.values.title);
        setText("values-explanation", result.values.text);
        setText("meeting-place", result.meeting[0]);
        setText("meeting-explanation", result.meeting[1]);
        setText("relationship-dynamic", result.relationshipStyle.title);
        setText("relationship-explanation", result.relationshipStyle.text);
        setText("affection-style", result.affection.title);
        setText("affection-explanation", result.affection.text);
        setText("relationship-year", String(result.relationshipYear));
        setText("timing-explanation", result.timingExplanation);
        setText("future-home", result.futureHome.title);
        setText("home-explanation", result.futureHome.text);
        setText("oracle-message", result.oracleMessage.title);
        setText("message-explanation", result.oracleMessage.text);

        loadPortrait(result);
        App.modules.payments.lockPremiumReading();
    }

    function loadPortrait(result) {
        const portrait = document.getElementById("companion-portrait");
        const portraitWrap = document.getElementById("companion-portrait-wrap");
        const message = document.getElementById("portrait-loading-message");

        if (!portrait || !portraitWrap) return;

        window.clearInterval(App.state.portraitMessageTimer);
        portraitWrap.classList.remove(
            "portrait-is-loaded",
            "portrait-is-revealing",
            "portrait-is-revealed",
            "portrait-load-failed"
        );
        portraitWrap.classList.add("portrait-is-loading");
        portraitWrap.setAttribute("aria-busy", "true");
        portrait.classList.add("portrait-obscured");
        portrait.alt = `Vintage companion portrait selected for ${result.generatedFor}`;

        const messages = [
            "Sketching the first lines…",
            "Shading the portrait…",
            "Developing the old photograph…",
            "Preparing the final image…"
        ];
        let messageIndex = 0;
        if (message) message.textContent = messages[0];

        App.state.portraitMessageTimer = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            if (message) message.textContent = messages[messageIndex];
        }, 1150);

        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            window.clearInterval(App.state.portraitMessageTimer);
            portraitWrap.classList.remove("portrait-is-loading");
            portraitWrap.classList.add("portrait-is-loaded");
            portraitWrap.setAttribute("aria-busy", "false");
        };

        const fail = () => {
            if (settled) return;
            settled = true;
            window.clearInterval(App.state.portraitMessageTimer);
            portraitWrap.classList.remove("portrait-is-loading");
            portraitWrap.classList.add("portrait-load-failed");
            portraitWrap.setAttribute("aria-busy", "false");
            if (message) message.textContent = "The portrait could not be developed.";
            setText("silhouette-caption", "Portrait unavailable — please check the assets folder");
            console.error("The companion portrait could not be loaded:", result.portraitPath);
        };

        portrait.onload = () => window.setTimeout(finish, 650);
        portrait.onerror = fail;
        portrait.src = result.portraitPath || "";

        if (portrait.complete) {
            window.setTimeout(() => {
                if (portrait.naturalWidth > 0) finish();
                else if (portrait.currentSrc || portrait.src) fail();
            }, 0);
        }
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value ?? "");
    }

    App.modules.results = {
        init,
        startReadingAnalysis,
        generateResult,
        displayResult
    };
})();
