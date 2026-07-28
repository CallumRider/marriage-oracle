"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before quiz.js");

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

    let initialised = false;

    function init() {
        if (initialised) return;
        initialised = true;

        App.elements.questionForm?.addEventListener("submit", handleSubmit);
        App.elements.backButton?.addEventListener("click", handleBack);
    }

    function renderQuestion() {
        const question = questions[App.state.currentQuestionIndex];
        if (!question) {
            App.state.currentQuestionIndex = 0;
            return renderQuestion();
        }

        const elements = App.elements;
        const questionNumber = App.state.currentQuestionIndex + 1;
        const progress = Math.round((questionNumber / questions.length) * 100);

        hideQuestionError();
        elements.questionTitle.textContent = question.question;
        elements.questionHelp.textContent = question.help || "";
        elements.questionHelp.hidden = !question.help;
        elements.questionNumberLabel.textContent = `Question ${App.utils.toRoman(questionNumber)}`;
        elements.sectionName.textContent = question.section;
        elements.progressCount.textContent = `Question ${questionNumber} of ${questions.length}`;
        elements.progressPercentage.textContent = `${progress}% complete`;
        elements.progressBar.style.width = `${progress}%`;
        elements.progressTrack.setAttribute("aria-valuenow", String(progress));
        elements.guideSpeech.textContent = question.guide || "Consider your answer carefully.";
        if (question.private) {
            elements.savedStatus.textContent = App.state.profile.mode === "account"
                ? "Saved privately to your account"
                : "This answer is kept only for this session";
        } else if (App.state.profile.mode === "account") {
            elements.savedStatus.textContent = "Saved securely to your account";
        } else if (App.state.profile.mode === "saved") {
            elements.savedStatus.textContent = `Saved for ${App.state.profile.name}`;
        } else {
            elements.savedStatus.textContent = "Answers save on this device";
        }

        elements.answerArea.replaceChildren();

        if (question.type === "choice") {
            renderChoiceQuestion(question);
        } else if (question.type === "number") {
            renderNumberQuestion(question);
        } else {
            renderTextQuestion(question);
        }

        elements.backButton.hidden = App.state.currentQuestionIndex === 0;
        elements.nextButton.textContent = App.state.currentQuestionIndex === questions.length - 1
            ? "Prepare My Reading →"
            : "Continue →";

        App.saveProgress();
        window.scrollTo({
            top: 0,
            behavior: App.utils.prefersReducedMotion() ? "auto" : "smooth"
        });
    }

    function renderChoiceQuestion(question) {
        question.options.forEach((option, index) => {
            const label = document.createElement("label");
            label.className = "answer-label";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "quiz-answer";
            radio.value = option;
            radio.id = `answer-${App.state.currentQuestionIndex}-${index}`;
            radio.className = "answer-radio";
            radio.checked = App.state.answers[question.id] === option;
            radio.addEventListener("change", hideQuestionError);

            const visibleButton = document.createElement("span");
            visibleButton.className = "answer-button";
            visibleButton.textContent = option;

            label.append(radio, visibleButton);
            App.elements.answerArea.appendChild(label);
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
        input.value = App.state.answers[question.id]
            || (question.id === "firstName" ? App.state.profile.name : "");
        input.addEventListener("input", hideQuestionError);

        const note = document.createElement("p");
        note.className = "input-note";
        note.textContent = "Please do not enter private information beyond what the question asks.";

        wrapper.append(input, note);
        App.elements.answerArea.appendChild(wrapper);
        focusSoon(input);
    }

    function renderNumberQuestion(question) {
        const minimum = question.min ?? 0;
        const maximum = question.max ?? 9999;
        const wrapper = document.createElement("div");
        wrapper.className = "input-wrapper";

        const input = document.createElement("input");
        input.id = "current-number-answer";
        input.className = "number-input";
        input.type = "number";
        input.inputMode = "numeric";
        input.min = String(minimum);
        input.max = String(maximum);
        input.step = "1";
        input.placeholder = question.placeholder || "Enter a number";
        input.value = App.state.answers[question.id] ?? "";
        input.addEventListener("input", hideQuestionError);

        const note = document.createElement("p");
        note.className = "input-note";
        note.textContent = `Choose any whole number from ${minimum} to ${maximum}.`;

        wrapper.append(input, note);
        App.elements.answerArea.appendChild(wrapper);
        focusSoon(input);
    }

    function focusSoon(input) {
        window.setTimeout(() => input.focus({ preventScroll: true }), 80);
    }

    function handleSubmit(event) {
        event.preventDefault();

        const question = questions[App.state.currentQuestionIndex];
        const rawValue = readCurrentAnswer(question);
        const validationError = validateAnswer(question, rawValue);

        if (validationError) {
            showQuestionError(validationError);
            return;
        }

        const value = normaliseAnswer(question, rawValue);
        App.state.answers[question.id] = value;

        if (question.id === "firstName") {
            if (App.state.profile.mode === "saved" || App.state.profile.mode === "account") {
                App.state.profile.name = value;
                App.saveProfile();
            }

            if (App.state.profile.mode === "account") {
                App.modules.auth.updateFirstName(value).catch((error) => {
                    console.warn("The account name could not be updated.", error);
                });
            }
        }

        App.saveProgress();

        if (App.state.currentQuestionIndex < questions.length - 1) {
            App.state.currentQuestionIndex += 1;
            renderQuestion();
            return;
        }

        App.modules.results.startReadingAnalysis();
    }

    function handleBack() {
        if (App.state.currentQuestionIndex <= 0) return;

        const question = questions[App.state.currentQuestionIndex];
        const rawValue = readCurrentAnswer(question);

        if (rawValue !== null && rawValue !== "") {
            const error = validateAnswer(question, rawValue);
            if (!error) {
                App.state.answers[question.id] = normaliseAnswer(question, rawValue);
            }
        }

        App.state.currentQuestionIndex -= 1;
        App.saveProgress();
        renderQuestion();
    }

    function readCurrentAnswer(question) {
        if (question.type === "choice") {
            return document.querySelector('input[name="quiz-answer"]:checked')?.value ?? null;
        }

        const inputId = question.type === "number"
            ? "current-number-answer"
            : "current-text-answer";
        return document.getElementById(inputId)?.value.trim() ?? null;
    }

    function validateAnswer(question, value) {
        if (value === null || value === "") {
            return question.type === "choice"
                ? "Please choose one of the answers before continuing."
                : "Please enter an answer before continuing.";
        }

        if (question.type === "choice" && !question.options.includes(value)) {
            return "Please choose one of the available answers.";
        }

        if (question.type === "number") {
            const numericValue = Number(value);
            const minimum = question.min ?? 0;
            const maximum = question.max ?? 9999;

            if (!Number.isInteger(numericValue) || numericValue < minimum || numericValue > maximum) {
                return `Please enter a whole number from ${minimum} to ${maximum}.`;
            }
        }

        if (question.id === "firstName" && !App.modules.auth.cleanName(String(value))) {
            return "Please enter a valid first name.";
        }

        return "";
    }

    function normaliseAnswer(question, value) {
        if (question.id === "firstName") {
            return App.modules.auth.cleanName(String(value));
        }

        if (question.type === "number") {
            return Number(value);
        }

        return String(value).trim();
    }

    function showQuestionError(message) {
        App.elements.questionError.textContent = message;
        App.elements.questionError.hidden = false;
        App.elements.questionError.scrollIntoView({
            behavior: App.utils.prefersReducedMotion() ? "auto" : "smooth",
            block: "center"
        });
    }

    function hideQuestionError() {
        if (App.elements.questionError) {
            App.elements.questionError.hidden = true;
            App.elements.questionError.textContent = "";
        }
    }

    App.modules.quiz = {
        questions,
        init,
        renderQuestion,
        readCurrentAnswer
    };
})();
