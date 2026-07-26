"use strict";

// =====================================================
// QUIZ QUESTIONS
// =====================================================

const questions = [
    {
        id: "firstName",
        section: "About you",
        type: "text",
        question: "What is your first name?",
        help: "This is used only to personalise the wording of your result.",
        placeholder: "Enter your first name",
        guide: "Every reading begins with a name."
    },
    {
        id: "ageRange",
        section: "About you",
        type: "choice",
        question: "Which age group are you in?",
        help: "Choose the answer closest to your age.",
        options: [
            "18 to 24",
            "25 to 34",
            "35 to 44",
            "45 to 54",
            "55 to 64",
            "65 to 74",
            "75 or older",
            "Prefer not to say"
        ],
        guide: "A stage of life can shape what companionship means."
    },
    {
        id: "identity",
        section: "About you",
        type: "choice",
        question: "How would you describe yourself?",
        help: "Choose the option you are most comfortable with.",
        options: [
            "Woman",
            "Man",
            "Non-binary",
            "Another identity",
            "Prefer not to say"
        ],
        guide: "There is no wrong answer here."
    },
    {
        id: "interest",
        section: "About you",
        type: "choice",
        question: "Who would you like your prediction to describe?",
        help: "This controls the wording, name pool and silhouette used in your result.",
        options: [
            "A man",
            "A woman",
            "Someone of any gender",
            "Prefer not to say"
        ],
        guide: "The companion in your reading should reflect your preference."
    },
    {
        id: "partnerAge",
        section: "About you",
        type: "choice",
        question: "Which age range would best suit your future companion?",
        help: "This helps choose a name and life-stage clue that fits your preference.",
        options: [
            "18 to 24",
            "25 to 34",
            "35 to 44",
            "45 to 54",
            "55 to 64",
            "65 to 74",
            "75 or older",
            "Similar to my age",
            "No particular preference"
        ],
        guide: "A suitable life stage can matter as much as personality."
    },
    {
    id: "portraitBackground",
    section: "About you",
    type: "choice",
    private: true,
    question: "Which background should your companion portrait reflect?",
    help: "Choose the portrait background you would prefer. This answer is used only to select the illustration and is kept for this browser session.",
    options: [
        "White",
        "Black",
        "Asian",
        "Hispanic",
        "Middle Eastern",
        "Mixed",
        "No preference",
        "Prefer not to say"
    ],
    guide: "The portrait should reflect the preference you choose."
},
    {
        id: "relationshipStatus",
        section: "About you",
        type: "choice",
        question: "What is your current relationship situation?",
        help: "This does not change whether you can take the quiz.",
        options: [
            "Single",
            "Dating or getting to know someone",
            "In a relationship",
            "Separated or divorced",
            "Widowed",
            "Prefer not to say"
        ],
        guide: "Past and present experiences often shape future hopes."
    },
    {
        id: "birthMonth",
        section: "About you",
        type: "choice",
        question: "In which part of the year were you born?",
        help: "Choose the group containing your birth month.",
        options: [
            "January to March",
            "April to June",
            "July to September",
            "October to December",
            "Prefer not to say"
        ],
        guide: "Even the season of your birth can add a small clue."
    },
    {
        id: "selfDescription",
        section: "Your nature",
        type: "choice",
        question: "Which description feels most like you?",
        help: "Choose the one that fits most often, not perfectly.",
        options: [
            "Warm and sociable",
            "Quiet and thoughtful",
            "Practical and dependable",
            "Adventurous and curious",
            "Independent and strong-minded"
        ],
        guide: "Your own nature often points towards the balance you seek."
    },
    {
        id: "socialEnergy",
        section: "Your nature",
        type: "choice",
        question: "How do you usually feel after a busy social day?",
        help: "Choose the answer that is most familiar.",
        options: [
            "Energised and ready for more",
            "Happy but ready for peace and quiet",
            "Tired and in need of time alone",
            "It depends entirely on the people"
        ],
        guide: "Energy and companionship must fit together comfortably."
    },
    {
        id: "trustStyle",
        section: "Your nature",
        type: "choice",
        question: "How quickly do you usually trust someone?",
        help: "Think about close friendships as well as romance.",
        options: [
            "Very slowly",
            "After seeing consistent actions",
            "Fairly easily",
            "I trust my instincts immediately"
        ],
        guide: "Trust is one of the strongest threads in any lasting bond."
    },
    {
        id: "communication",
        section: "Your nature",
        type: "choice",
        question: "What makes you feel most understood?",
        help: "Choose the type of communication you value most.",
        options: [
            "A calm conversation",
            "Shared humour",
            "Practical help",
            "Affection and reassurance",
            "Time spent together without pressure"
        ],
        guide: "The right person will understand how you receive care."
    },
    {
        id: "decisionStyle",
        section: "Your nature",
        type: "choice",
        question: "When facing an important decision, what guides you most?",
        help: "Choose what usually has the greatest influence.",
        options: [
            "Careful facts and practical thinking",
            "My feelings and instincts",
            "Advice from people I trust",
            "Time to reflect before deciding",
            "A mixture of all of these"
        ],
        guide: "The way you decide can reveal the kind of balance you appreciate."
    },
    {
        id: "changeResponse",
        section: "Your nature",
        type: "choice",
        question: "How do you usually react when plans suddenly change?",
        help: "Choose the response that sounds most like you.",
        options: [
            "I adapt quickly",
            "I need a moment, then I adjust",
            "I prefer to make a new clear plan",
            "Unexpected change makes me uncomfortable",
            "It depends on how important the plan was"
        ],
        guide: "A good companion often complements the way you handle uncertainty."
    },
    {
        id: "importantQuality",
        section: "Relationship values",
        type: "choice",
        question: "Which quality matters most in a long-term partner?",
        help: "Choose the one you would struggle most to live without.",
        options: [
            "Loyalty",
            "Kindness",
            "Humour",
            "Confidence",
            "Patience",
            "Ambition"
        ],
        guide: "One value often stands above the rest."
    },
    {
        id: "relationshipFoundation",
        section: "Relationship values",
        type: "choice",
        question: "What should a strong relationship be built upon?",
        help: "Choose the foundation that feels most important.",
        options: [
            "Friendship",
            "Shared goals",
            "Passion",
            "Family values",
            "Independence and mutual respect"
        ],
        guide: "The foundation matters more than the decoration."
    },
    {
        id: "conflictStyle",
        section: "Relationship values",
        type: "choice",
        question: "When there is disagreement, what helps most?",
        help: "Choose what you would most appreciate from a partner.",
        options: [
            "Talking calmly until it is resolved",
            "Taking time apart before talking",
            "A little humour to lower the tension",
            "A practical compromise",
            "Reassurance that the relationship is secure"
        ],
        guide: "Lasting companionship depends on how difficult moments are handled."
    },
    {
        id: "stabilityExcitement",
        section: "Relationship values",
        type: "choice",
        question: "Which sounds more appealing in a relationship?",
        help: "Choose the closest answer.",
        options: [
            "Mostly stability",
            "A balance of stability and excitement",
            "Mostly excitement and spontaneity",
            "I am not sure yet"
        ],
        guide: "Some hearts seek a harbour; others seek a horizon."
    },
    {
        id: "beliefRole",
        section: "Beliefs and traditions",
        type: "choice",
        private: true,
        question: "What role do faith, spirituality or tradition play in your life?",
        help: "You do not need to name a religion. This optional answer is kept only for this browser session.",
        options: [
            "They are central to my life",
            "They are meaningful but mostly private",
            "I value cultural or family traditions",
            "They are not very important to me",
            "I am still deciding what I believe",
            "Prefer not to say"
        ],
        guide: "Shared meaning can come from faith, tradition, values or mutual respect."
    },
    {
        id: "sharedBeliefs",
        section: "Beliefs and traditions",
        type: "choice",
        private: true,
        question: "How important is a partner's outlook on beliefs and traditions?",
        help: "Choose the answer that would make a relationship feel most comfortable. This answer is not kept after the session ends.",
        options: [
            "Very important — I want a closely shared outlook",
            "Some shared values are enough",
            "Respect matters more than agreement",
            "It is not important to me",
            "I am not sure",
            "Prefer not to say"
        ],
        guide: "Compatibility can mean agreement, or simply respectful understanding."
    },
    {
        id: "familyCloseness",
        section: "Relationship values",
        type: "choice",
        question: "How involved would you like family to be in your relationship?",
        help: "Choose what feels healthiest and most comfortable to you.",
        options: [
            "Very involved and regularly present",
            "Close, but with clear boundaries",
            "Occasional visits and celebrations",
            "Mostly independent as a couple",
            "It depends on the family"
        ],
        guide: "Family can be a foundation, a support, or a respectful distance."
    },
    {
        id: "idealWeekend",
        section: "Lifestyle",
        type: "choice",
        question: "What would your ideal weekend include?",
        help: "Choose the one you would enjoy most often.",
        options: [
            "A peaceful evening at home",
            "A meal with family or friends",
            "A day trip somewhere new",
            "Music, dancing or a celebration",
            "Gardening, crafts or a favourite hobby",
            "A walk in the countryside or by the sea"
        ],
        guide: "Everyday happiness is often a stronger clue than grand romance."
    },
    {
        id: "homeSetting",
        section: "Lifestyle",
        type: "choice",
        question: "Where would your happiest home be?",
        help: "Choose the setting that feels most comfortable.",
        options: [
            "A lively city",
            "A friendly town",
            "A quiet village",
            "The countryside",
            "Near the coast",
            "Close to family, wherever that may be"
        ],
        guide: "A shared home reveals the pace of life you hope to build."
    },
    {
        id: "socialLife",
        section: "Lifestyle",
        type: "choice",
        question: "What kind of social life suits you best?",
        help: "Choose what you would prefer most weeks.",
        options: [
            "A large circle and frequent plans",
            "A small circle of close friends",
            "Mostly family gatherings",
            "A mixture of company and quiet time",
            "I am happiest with one close companion"
        ],
        guide: "The number of people around you can shape a relationship's rhythm."
    },
    {
        id: "travelStyle",
        section: "Lifestyle",
        type: "choice",
        question: "How do you feel about travel and new places?",
        help: "Choose the closest description.",
        options: [
            "I love travelling whenever possible",
            "I enjoy occasional trips",
            "I prefer familiar places",
            "I would travel more with the right person",
            "Travel is not important to me"
        ],
        guide: "A companion may widen your world or make home feel richer."
    },
    {
        id: "moneyStyle",
        section: "Lifestyle",
        type: "choice",
        question: "How should a couple approach everyday money decisions?",
        help: "This asks about values only — never enter financial details.",
        options: [
            "Plan carefully and budget together",
            "Share major goals but keep some independence",
            "Be flexible and enjoy life within reason",
            "One person can lead if both agree",
            "Discuss each situation as it arises"
        ],
        guide: "Practical compatibility often appears in ordinary decisions."
    },
    {
        id: "meetingPreference",
        section: "Romantic clues",
        type: "choice",
        question: "Where would you most like to meet someone?",
        help: "Choose the setting that feels most natural.",
        options: [
            "Through friends or family",
            "At a hobby, club or community group",
            "While travelling or on a day trip",
            "In a café, shop or familiar local place",
            "At work or through a professional connection",
            "Online before meeting in person"
        ],
        guide: "The meeting place often matches the life already being lived."
    },
    {
        id: "firstDate",
        section: "Romantic clues",
        type: "choice",
        question: "Which first date sounds most comfortable?",
        help: "Choose what would put you most at ease.",
        options: [
            "Coffee and a long conversation",
            "A relaxed meal",
            "A walk somewhere scenic",
            "A theatre, concert or event",
            "Doing an activity together",
            "A simple meeting with no pressure"
        ],
        guide: "Comfort is often where genuine attraction begins."
    },
    {
        id: "noticeFirst",
        section: "Romantic clues",
        type: "choice",
        question: "What do you tend to notice first about someone?",
        help: "Choose your most natural first impression.",
        options: [
            "Their smile",
            "Their eyes",
            "Their confidence",
            "Their kindness towards others",
            "Their sense of humour",
            "Their style and appearance"
        ],
        guide: "The first detail you notice may become the first clue revealed."
    },
    {
        id: "lovePace",
        section: "Romantic clues",
        type: "choice",
        question: "How do you believe love usually develops?",
        help: "Choose the idea that feels most true to you.",
        options: [
            "It grows slowly from friendship",
            "There can be an immediate spark",
            "It begins with trust and shared experience",
            "It arrives unexpectedly",
            "Every relationship is different"
        ],
        guide: "Some connections whisper before they speak clearly."
    },
    {
        id: "affectionStyle",
        section: "Romantic clues",
        type: "choice",
        question: "Which small sign of affection would mean the most to you?",
        help: "Choose the gesture that would make you feel most cared for.",
        options: [
            "A thoughtful message or letter",
            "A warm hug or gentle touch",
            "Practical help without being asked",
            "Remembering an important detail",
            "Planning time together",
            "Making me laugh when I need it"
        ],
        guide: "Small gestures often reveal the clearest language of affection."
    },
    {
        id: "luckyNumber",
        section: "Final symbols",
        type: "number",
        question: "What is your lucky or meaningful number?",
        help: "Enter any whole number from 0 to 9999.",
        placeholder: "For example, 7",
        min: 0,
        max: 9999,
        guide: "This time, the number is entirely your own."
    },
    {
        id: "symbol",
        section: "Final symbols",
        type: "choice",
        question: "Choose the symbol you feel most drawn towards",
        help: "Trust your first instinct.",
        options: [
            "A rose",
            "A handwritten letter",
            "A ring",
            "The moon",
            "A key",
            "A pair of birds"
        ],
        guide: "One final symbol will seal the reading."
    }
];

// QUIZ RENDERING
// =====================================================

function renderQuestion() {
    const question = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    const progress = Math.round((questionNumber / questions.length) * 100);

    questionError.hidden = true;
    questionTitle.textContent = question.question;
    questionHelp.textContent = question.help || "";
    questionNumberLabel.textContent = `Question ${toRoman(questionNumber)}`;
    sectionName.textContent = question.section;
    progressCount.textContent = `Question ${questionNumber} of ${questions.length}`;
    progressPercentage.textContent = `${progress}% complete`;
    progressBar.style.width = `${progress}%`;
    progressTrack.setAttribute("aria-valuenow", String(progress));
    guideSpeech.textContent = question.guide || "Consider your answer carefully.";
    savedStatus.textContent = question.private
        ? "This answer is kept only for this session"
        : profile.mode === "saved"
            ? `Saved for ${profile.name}`
            : "Answers save on this device";

    answerArea.innerHTML = "";

    if (question.type === "choice") {
        renderChoiceQuestion(question);
    } else if (question.type === "number") {
        renderNumberQuestion(question);
    } else {
        renderTextQuestion(question);
    }

    backButton.hidden = currentQuestionIndex === 0;
    nextButton.textContent = currentQuestionIndex === questions.length - 1
        ? "Prepare My Reading →"
        : "Continue →";

    saveProgress();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderChoiceQuestion(question) {
    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "answer-label";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quiz-answer";
        radio.value = option;
        radio.id = `answer-${index}`;
        radio.className = "answer-radio";
        radio.checked = answers[question.id] === option;

        const visibleButton = document.createElement("span");
        visibleButton.className = "answer-button";
        visibleButton.textContent = option;

        label.appendChild(radio);
        label.appendChild(visibleButton);
        answerArea.appendChild(label);
    });
}

function renderTextQuestion(question) {
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";

    const input = document.createElement("input");
    input.id = "current-text-answer";
    input.className = "text-input";
    input.type = "text";
    input.maxLength = 30;
    input.autocomplete = question.id === "firstName" ? "given-name" : "off";
    input.placeholder = question.placeholder || "Type your answer";
    input.value = answers[question.id] || (question.id === "firstName" ? profile.name : "");

    const note = document.createElement("p");
    note.className = "input-note";
    note.textContent = "Please do not enter private information beyond what the question asks.";

    wrapper.appendChild(input);
    wrapper.appendChild(note);
    answerArea.appendChild(wrapper);

    setTimeout(() => input.focus(), 100);
}

function renderNumberQuestion(question) {
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";

    const input = document.createElement("input");
    input.id = "current-number-answer";
    input.className = "number-input";
    input.type = "number";
    input.inputMode = "numeric";
    input.min = String(question.min ?? 0);
    input.max = String(question.max ?? 9999);
    input.step = "1";
    input.placeholder = question.placeholder || "Enter a number";
    input.value = answers[question.id] ?? "";

    const note = document.createElement("p");
    note.className = "input-note";
    note.textContent = `Choose any whole number from ${question.min ?? 0} to ${question.max ?? 9999}.`;

    wrapper.appendChild(input);
    wrapper.appendChild(note);
    answerArea.appendChild(wrapper);

    setTimeout(() => input.focus(), 100);
}

questionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = questions[currentQuestionIndex];
    const value = readCurrentAnswer(question);

    if (value === null || value === "") {
        showQuestionError(
            question.type === "choice"
                ? "Please choose one of the answers before continuing."
                : "Please enter an answer before continuing."
        );
        return;
    }

    if (question.type === "number") {
        const numericValue = Number(value);
        const min = question.min ?? 0;
        const max = question.max ?? 9999;

        if (!Number.isInteger(numericValue) || numericValue < min || numericValue > max) {
            showQuestionError(`Please enter a whole number from ${min} to ${max}.`);
            return;
        }
    }

    answers[question.id] = question.id === "firstName"
        ? cleanName(String(value))
        : value;

    if (question.id === "firstName" && profile.mode === "saved") {
        profile.name = answers.firstName;
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    }

    saveProgress();

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex += 1;
        renderQuestion();
    } else {
        startReadingAnalysis();
    }
});

backButton.addEventListener("click", () => {
    if (currentQuestionIndex <= 0) {
        return;
    }

    const question = questions[currentQuestionIndex];
    const currentValue = readCurrentAnswer(question);

    if (currentValue !== null && currentValue !== "") {
        answers[question.id] = currentValue;
    }

    currentQuestionIndex -= 1;
    renderQuestion();
});

function readCurrentAnswer(question) {
    if (question.type === "choice") {
        const selected = document.querySelector('input[name="quiz-answer"]:checked');
        return selected ? selected.value : null;
    }

    if (question.type === "number") {
        const input = document.getElementById("current-number-answer");
        return input ? input.value.trim() : null;
    }

    const input = document.getElementById("current-text-answer");
    return input ? input.value.trim() : null;
}

function showQuestionError(message) {
    questionError.textContent = message;
    questionError.hidden = false;
    questionError.scrollIntoView({ behavior: "smooth", block: "center" });
}

// =====================================================
