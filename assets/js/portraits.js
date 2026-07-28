"use strict";

(() => {
    const App = window.MarriageOracle;
    if (!App) throw new Error("app.js must load before portraits.js");

const namePools = {
    "18 to 24": {
        man: [
            "Callum", "James", "Jack", "Harry", "Oliver", "Charlie",
            "George", "Thomas", "Joshua", "Daniel", "Ryan", "Liam",
            "Connor", "Adam", "Ben", "Luke", "Lewis", "Ethan"
        ],
        woman: [
            "Olivia", "Amelia", "Sophie", "Chloe", "Emily", "Grace",
            "Lily", "Jessica", "Lucy", "Ella", "Charlotte", "Hannah",
            "Ellie", "Mia", "Ruby", "Molly", "Isla", "Evie"
        ],
        neutral: [
            "Alex", "Charlie", "Jamie", "Jordan", "Sam", "Taylor",
            "Morgan", "Casey", "Riley", "Robin", "Bailey", "Ellis",
            "Harper", "Rowan", "Cameron", "Drew"
        ]
    },

    "25 to 34": {
        man: [
            "Daniel", "James", "Matthew", "Thomas", "Christopher",
            "Joshua", "Ryan", "Luke", "Jack", "Adam", "Michael",
            "David", "Andrew", "Benjamin", "Samuel", "Joseph",
            "Liam", "Nathan"
        ],
        woman: [
            "Jessica", "Sophie", "Chloe", "Emily", "Rebecca",
            "Lauren", "Hannah", "Charlotte", "Lucy", "Laura",
            "Amy", "Sarah", "Rachel", "Emma", "Bethany",
            "Victoria", "Natalie", "Gemma"
        ],
        neutral: [
            "Alex", "Jamie", "Jordan", "Sam", "Taylor", "Morgan",
            "Casey", "Riley", "Robin", "Cameron", "Avery", "Ellis",
            "Charlie", "Frankie", "Ashley", "Jesse"
        ]
    },

    "35 to 44": {
        man: [
            "David", "Michael", "Christopher", "James", "Andrew",
            "Matthew", "Daniel", "Mark", "Robert", "Paul",
            "Richard", "Steven", "Jonathan", "Simon", "Craig",
            "Darren", "Lee", "Martin"
        ],
        woman: [
            "Sarah", "Claire", "Laura", "Emma", "Rebecca",
            "Nicola", "Rachel", "Louise", "Victoria", "Helen",
            "Caroline", "Samantha", "Joanne", "Natalie", "Kelly",
            "Gemma", "Katherine", "Amanda"
        ],
        neutral: [
            "Alex", "Sam", "Jamie", "Jordan", "Taylor", "Morgan",
            "Casey", "Robin", "Ashley", "Lee", "Charlie", "Cameron",
            "Jody", "Chris", "Jo", "Nicky"
        ]
    },

    "45 to 54": {
        man: [
            "David", "Paul", "Mark", "Andrew", "Richard",
            "Michael", "John", "Robert", "Stephen", "Ian",
            "Simon", "Peter", "Gary", "Kevin", "Martin",
            "Neil", "Anthony", "Philip"
        ],
        woman: [
            "Sarah", "Claire", "Karen", "Sharon", "Susan",
            "Julie", "Michelle", "Lisa", "Helen", "Angela",
            "Amanda", "Nicola", "Deborah", "Catherine",
            "Jacqueline", "Alison", "Caroline", "Tracey"
        ],
        neutral: [
            "Alex", "Sam", "Chris", "Jamie", "Lee", "Jo",
            "Nicky", "Robin", "Ashley", "Kim", "Jackie", "Pat",
            "Tracy", "Lesley", "Terry", "Jan"
        ]
    },

    "55 to 64": {
        man: [
            "David", "John", "Michael", "Paul", "Peter",
            "Robert", "Stephen", "Ian", "Alan", "Brian",
            "Richard", "Graham", "Keith", "Trevor", "Martin",
            "Philip", "Anthony", "Colin"
        ],
        woman: [
            "Susan", "Karen", "Linda", "Patricia", "Carol",
            "Christine", "Janet", "Julie", "Angela", "Sandra",
            "Deborah", "Margaret", "Anne", "Elizabeth", "Diane",
            "Jacqueline", "Barbara", "Maureen"
        ],
        neutral: [
            "Pat", "Chris", "Alex", "Sam", "Lesley", "Terry",
            "Jackie", "Robin", "Kim", "Jan", "Lee", "Ashley",
            "Tracy", "Nicky", "Jo", "Tony"
        ]
    },

    "65 to 74": {
        man: [
            "John", "David", "Peter", "Michael", "Robert",
            "Brian", "Alan", "Richard", "Graham", "Philip",
            "Anthony", "Kenneth", "Raymond", "Trevor", "Roger",
            "Derek", "Geoffrey", "Dennis"
        ],
        woman: [
            "Margaret", "Susan", "Patricia", "Christine", "Linda",
            "Barbara", "Janet", "Carol", "Elizabeth", "Anne",
            "Jean", "Jennifer", "Pamela", "Kathleen", "Maureen",
            "Sheila", "Janice", "Marilyn"
        ],
        neutral: [
            "Pat", "Chris", "Lesley", "Terry", "Jackie", "Robin",
            "Kim", "Jan", "Lee", "Tony", "Alex", "Sam",
            "Jo", "Nicky", "Ashley", "Tracy"
        ]
    },

    "75 or older": {
        man: [
            "John", "William", "George", "James", "Arthur",
            "Frederick", "Albert", "Charles", "Edward", "Robert",
            "Thomas", "Richard", "Harold", "Frank", "Ernest",
            "Donald", "Ronald", "Stanley"
        ],
        woman: [
            "Margaret", "Mary", "Patricia", "Joan", "Jean",
            "Elizabeth", "Barbara", "Dorothy", "Joyce", "Kathleen",
            "Brenda", "Irene", "Shirley", "Audrey", "June",
            "Sylvia", "Betty", "Doreen"
        ],
        neutral: [
            "Pat", "Chris", "Lesley", "Terry", "Jackie", "Robin",
            "Jean", "Jan", "Jo", "Tony", "Billie", "Bobby",
            "Frankie", "Charlie", "Sam", "Alex"
        ]
    }
};

// =====================================================
// TEMPERAMENT RESULTS
// =====================================================

const temperamentResults = [
    "Warm and dependable",
    "Quietly confident",
    "Kind and emotionally steady",
    "Cheerful and sociable",
    "Thoughtful and reassuring",
    "Practical with a playful side",
    "Independent but deeply loyal",
    "Gentle, observant and patient",
    "Open-minded and considerate",
    "Protective without being controlling",
    "Calm in difficult moments",
    "Affectionate and family-minded",
    "Curious and young at heart",
    "Reliable with a dry sense of humour",
    "Confident but never overpowering",
    "Soft-spoken and emotionally intelligent"
];

// =====================================================
// ORACLE MESSAGES
// =====================================================

const oracleMessages = {
    "A rose": [
        {
            title: "Affection grows where it is tended.",
            text: "Notice the person who makes consistent effort rather than offering only grand promises."
        },
        {
            title: "A gentle beginning can become a lasting bond.",
            text: "The strongest clue may be warmth that grows more noticeable with time."
        },
        {
            title: "Romance will feel natural rather than performed.",
            text: "Your result favours sincerity, patience and small acts of care."
        }
    ],

    "A handwritten letter": [
        {
            title: "Words will matter in this connection.",
            text: "A thoughtful message or honest conversation may become the moment you remember most."
        },
        {
            title: "The right person will say what they mean.",
            text: "Clear communication is likely to make this relationship feel safe and unusual."
        },
        {
            title: "A private conversation may change everything.",
            text: "Do not underestimate a person who listens carefully before speaking."
        }
    ],

    "A ring": [
        {
            title: "Commitment will be shown through consistency.",
            text: "The person indicated by your answers is likely to treat promises as actions, not decoration."
        },
        {
            title: "A serious bond may begin in an ordinary way.",
            text: "The future connection is more likely to feel dependable than dramatic."
        },
        {
            title: "Security and affection can arrive together.",
            text: "Your best match will make commitment feel reassuring rather than restrictive."
        }
    ],

    "The moon": [
        {
            title: "What is unclear at first may become important later.",
            text: "A subtle connection could deepen once both people feel safe enough to be fully honest."
        },
        {
            title: "Your instincts will notice the first clue.",
            text: "Pay attention to the person whose company feels calm even before you understand why."
        },
        {
            title: "A quiet evening may hold a surprising beginning.",
            text: "The result favours conversation, reflection and an unexpected emotional connection."
        }
    ],

    "A key": [
        {
            title: "Trust will open the most important door.",
            text: "The right person may be the one who makes honesty feel easy rather than risky."
        },
        {
            title: "A practical introduction may unlock something deeper.",
            text: "A shared responsibility or helpful gesture could become the first sign."
        },
        {
            title: "The clue is not excitement alone, but access.",
            text: "The strongest match will make you feel welcomed into their real everyday life."
        }
    ],

    "A pair of birds": [
        {
            title: "Companionship will feel like moving in the same direction.",
            text: "Your reading favours two independent people who choose to build a rhythm together."
        },
        {
            title: "Shared freedom will strengthen the bond.",
            text: "The right relationship will include closeness without either person losing themselves."
        },
        {
            title: "A journey or outing may bring two paths together.",
            text: "New surroundings could make an important conversation possible."
        }
    ]
};

    const PORTRAIT_BACKGROUNDS = Object.freeze([
        "white",
        "black",
        "asian",
        "hispanic",
        "middle eastern",
        "mixed"
    ]);

    const GENDER_FOLDERS = Object.freeze({
        man: "men",
        woman: "women",
        neutral: "neutral"
    });

    const FILENAME_PREFIXES = Object.freeze({
        man: "man",
        woman: "woman",
        neutral: "neutral"
    });

    const BACKGROUND_MAP = Object.freeze({
        White: "white",
        Black: "black",
        Asian: "asian",
        Hispanic: "hispanic",
        "Middle Eastern": "middle eastern",
        Mixed: "mixed",
        "South Asian": "asian",
        "East Asian": "asian",
        "Middle Eastern or North African": "middle eastern",
        "Mixed or another background": "mixed"
    });

    function portraitAgeFolder(partnerAgeKey) {
        if (["18 to 24", "25 to 34"].includes(partnerAgeKey)) {
            return "18-29";
        }

        if (["35 to 44", "45 to 54"].includes(partnerAgeKey)) {
            return "45-59";
        }

        return "60-74";
    }

    function portraitBackgroundKey(answer, seed) {
        return BACKGROUND_MAP[answer]
            || App.utils.choose(PORTRAIT_BACKGROUNDS, seed, 89)
            || "mixed";
    }

    function getCompanionPortraitPath(result, backgroundAnswer) {
        const genderKey = GENDER_FOLDERS[result?.genderKey]
            ? result.genderKey
            : "neutral";
        const ageFolder = portraitAgeFolder(result?.partnerAgeKey);
        const backgroundFolder = portraitBackgroundKey(
            backgroundAnswer,
            result?.seed
        );
        const filenameBackground = backgroundFolder.replace(/\s+/g, "-");
        const filename = `${FILENAME_PREFIXES[genderKey]}-${ageFolder}-${filenameBackground}-01.png`;

        return [
            "assets/images/companions",
            GENDER_FOLDERS[genderKey],
            ageFolder,
            backgroundFolder,
            filename
        ].join("/");
    }

    App.modules.portraits = {
        data: {
            namePools,
            temperamentResults,
            oracleMessages
        },
        portraitAgeFolder,
        portraitBackgroundKey,
        getCompanionPortraitPath
    };
})();
