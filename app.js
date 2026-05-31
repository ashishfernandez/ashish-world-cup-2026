// World Cup 2026 Bracket Pool Core Engine

// 1. Static Tourney Data (Groups and Teams as in standard 48-team layout)
const GROUPS_DATA = {
    A: [
        { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
        { code: 'RSA', name: 'South Africa', flag: '🇿🇦' },
        { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
        { code: 'CZE', name: 'Czechia', flag: '🇨🇿' }
    ],
    B: [
        { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
        { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
        { code: 'QAT', name: 'Qatar', flag: '🇶🇦' },
        { code: 'BIH', name: 'Bosnia & Herz.', flag: '🇧🇦' }
    ],
    C: [
        { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
        { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
        { code: 'SCO', name: 'Scotland', flag: '🇬🇧' },
        { code: 'HAI', name: 'Haiti', flag: '🇭🇹' }
    ],
    D: [
        { code: 'USA', name: 'United States', flag: '🇺🇸' },
        { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
        { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
        { code: 'TUR', name: 'Turkey', flag: '🇹🇷' }
    ],
    E: [
        { code: 'GER', name: 'Germany', flag: '🇩🇪' },
        { code: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
        { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮' },
        { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' }
    ],
    F: [
        { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
        { code: 'TUN', name: 'Tunisia', flag: '🇹🇳' },
        { code: 'SWE', name: 'Sweden', flag: '🇸🇪' }
    ],
    G: [
        { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
        { code: 'EGY', name: 'Egypt', flag: '🇪🇬' },
        { code: 'IRN', name: 'Iran', flag: '🇮🇷' },
        { code: 'NZL', name: 'New Zealand', flag: '🇳🇿' }
    ],
    H: [
        { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
        { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
        { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦' },
        { code: 'CPV', name: 'Cape Verde', flag: '🇨🇻' }
    ],
    I: [
        { code: 'FRA', name: 'France', flag: '🇫🇷' },
        { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
        { code: 'NOR', name: 'Norway', flag: '🇳🇴' },
        { code: 'IRQ', name: 'Iraq', flag: '🇮🇶' }
    ],
    J: [
        { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
        { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
        { code: 'ALG', name: 'Algeria', flag: '🇩🇿' },
        { code: 'JOR', name: 'Jordan', flag: '🇯🇴' }
    ],
    K: [
        { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
        { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
        { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
        { code: 'COD', name: 'DR Congo', flag: '🇨🇩' }
    ],
    L: [
        { code: 'ENG', name: 'England', flag: '🇬🇧' },
        { code: 'CRO', name: 'Croatia', flag: '🇭🇷' },
        { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
        { code: 'PAN', name: 'Panama', flag: '🇵🇦' }
    ]
};

// Flatten helper to easily lookup team properties by code
function getTeamByCode(code) {
    if (!code) return { code: '', name: 'TBD', flag: '❓' };
    for (const group in GROUPS_DATA) {
        const team = GROUPS_DATA[group].find(t => t.code === code);
        if (team) return team;
    }
    return { code: code, name: code, flag: '❓' };
}

// 2. Bracket Matches Setup Schema (Matches 1-32)
// This mirrors the official World Cup 2026 Knockout Path mapping
const KNOCKOUTS_SCHEMA = {
    // Round of 32 (Matches 1-16)
    1: { round: 'R32', label: 'Match 1', name: 'M1', venue: 'Boston', date: 'Jun 28', defaultHome: '1E', defaultAway: '3ABCDF', nextMatch: 17, slot: 'home' },
    2: { round: 'R32', label: 'Match 2', name: 'M2', venue: 'New York', date: 'Jun 30', defaultHome: '1I', defaultAway: '3CDFGH', nextMatch: 17, slot: 'away' },
    3: { round: 'R32', label: 'Match 3', name: 'M3', venue: 'Los Angeles', date: 'Jun 28', defaultHome: '2A', defaultAway: '2B', nextMatch: 18, slot: 'home' },
    4: { round: 'R32', label: 'Match 4', name: 'M4', venue: 'Monterrey', date: 'Jun 29', defaultHome: '1F', defaultAway: '2C', nextMatch: 18, slot: 'away' },
    5: { round: 'R32', label: 'Match 5', name: 'M5', venue: 'Toronto', date: 'Jul 02', defaultHome: '2K', defaultAway: '2L', nextMatch: 19, slot: 'home' },
    6: { round: 'R32', label: 'Match 6', name: 'M6', venue: 'Los Angeles', date: 'Jul 02', defaultHome: '1H', defaultAway: '2J', nextMatch: 19, slot: 'away' },
    7: { round: 'R32', label: 'Match 7', name: 'M7', venue: 'San Francisco', date: 'Jul 01', defaultHome: '1D', defaultAway: '3BEFIJ', nextMatch: 20, slot: 'home' },
    8: { round: 'R32', label: 'Match 8', name: 'M8', venue: 'Seattle', date: 'Jul 01', defaultHome: '1G', defaultAway: '3AEHIJ', nextMatch: 20, slot: 'away' },
    
    9: { round: 'R32', label: 'Match 9', name: 'M9', venue: 'Houston', date: 'Jun 29', defaultHome: '1C', defaultAway: '2F', nextMatch: 21, slot: 'home' },
    10: { round: 'R32', label: 'Match 10', name: 'M10', venue: 'Dallas', date: 'Jun 30', defaultHome: '2E', defaultAway: '2I', nextMatch: 21, slot: 'away' },
    11: { round: 'R32', label: 'Match 11', name: 'M11', venue: 'Mexico City', date: 'Jun 30', defaultHome: '1A', defaultAway: '3CEFHI', nextMatch: 22, slot: 'home' },
    12: { round: 'R32', label: 'Match 12', name: 'M12', venue: 'Atlanta', date: 'Jul 01', defaultHome: '1L', defaultAway: '3EHIJK', nextMatch: 22, slot: 'away' },
    13: { round: 'R32', label: 'Match 13', name: 'M13', venue: 'Miami', date: 'Jul 03', defaultHome: '1J', defaultAway: '2H', nextMatch: 23, slot: 'home' },
    14: { round: 'R32', label: 'Match 14', name: 'M14', venue: 'Dallas', date: 'Jul 03', defaultHome: '2D', defaultAway: '2G', nextMatch: 23, slot: 'away' },
    15: { round: 'R32', label: 'Match 15', name: 'M15', venue: 'Vancouver', date: 'Jul 02', defaultHome: '1B', defaultAway: '3EFGLI', nextMatch: 24, slot: 'home' },
    16: { round: 'R32', label: 'Match 16', name: 'M16', venue: 'Kansas City', date: 'Jul 03', defaultHome: '1K', defaultAway: '3DEJLL', nextMatch: 24, slot: 'away' },

    // Round of 16 (Matches 17-24)
    17: { round: 'R16', label: 'Match 74', name: 'M17', venue: 'Philadelphia', date: 'Jul 04', nextMatch: 25, slot: 'home' },
    18: { round: 'R16', label: 'Match 77', name: 'M18', venue: 'Houston', date: 'Jul 04', nextMatch: 25, slot: 'away' },
    19: { round: 'R16', label: 'Match 73', name: 'M19', venue: 'Dallas', date: 'Jul 05', nextMatch: 26, slot: 'home' },
    20: { round: 'R16', label: 'Match 75', name: 'M20', venue: 'Seattle', date: 'Jul 06', nextMatch: 26, slot: 'away' },
    21: { round: 'R16', label: 'Match 76', name: 'M21', venue: 'New York', date: 'Jul 05', nextMatch: 27, slot: 'home' },
    22: { round: 'R16', label: 'Match 78', name: 'M22', venue: 'Mexico City', date: 'Jul 05', nextMatch: 27, slot: 'away' },
    23: { round: 'R16', label: 'Match 79', name: 'M23', venue: 'Atlanta', date: 'Jul 07', nextMatch: 28, slot: 'home' },
    24: { round: 'R16', label: 'Match 80', name: 'M24', venue: 'Vancouver', date: 'Jul 07', nextMatch: 28, slot: 'away' },

    // Quarterfinals (Matches 25-28)
    25: { round: 'QF', label: 'Match 89', name: 'M25', venue: 'Boston', date: 'Jul 09', nextMatch: 29, slot: 'home' },
    26: { round: 'QF', label: 'Match 90', name: 'M26', venue: 'Los Angeles', date: 'Jul 10', nextMatch: 29, slot: 'away' },
    27: { round: 'QF', label: 'Match 91', name: 'M27', venue: 'Miami', date: 'Jul 11', nextMatch: 30, slot: 'home' },
    28: { round: 'QF', label: 'Match 92', name: 'M28', venue: 'Kansas City', date: 'Jul 11', nextMatch: 30, slot: 'away' },

    // Semifinals (Matches 29-30)
    29: { round: 'SF', label: 'Match 97', name: 'M29', venue: 'Dallas', date: 'Jul 14', nextMatch: 32, slot: 'home' }, // Winner goes to Final
    30: { round: 'SF', label: 'Match 98', name: 'M30', venue: 'Atlanta', date: 'Jul 15', nextMatch: 32, slot: 'away' }, // Winner goes to Final

    // 3rd Place (Match 31)
    31: { round: '3RD', label: '3rd Place', name: 'M31', venue: 'Miami', date: 'Jul 18' },

    // Final (Match 32)
    32: { round: 'F', label: 'Final Match', name: 'M32', venue: 'New York', date: 'Jul 19' }
};

// 3. Complete State: Contains Official Simulated Outcomes & Predictions
const STATE = {
    activeTab: 'leaderboard',
    activeBracketUser: 'actuals',   // Current user selected on Bracket Tab (defaults to actuals!)
    activeGroupUser: 'actuals',     // Current user selected on Groups Tab (defaults to actuals!)
    wizardStep: 1,                  // Current active step of predictions wizard
    
    // The administrative actual outcomes of the World Cup
    officialResults: {
        matches: {}, // key: matchId (1 to 32), value: winningTeamCode
        advancingTeams: [] // Explicit list of 32 teams who reached knockout stage
    },

    // User profiles & predicted selections (Brackets, Groups)
    participants: {}
};

// 4. Progressive Point Constants
const POINTS_SCALE = {
    groupAdvancement: 5,   // Correct team to advance (Max 32 * 5 = 160 pts)
    roundOf32Winner: 10,   // R16 participants (Max 16 * 10 = 160 pts)
    roundOf16Winner: 20,   // QF participants (Max 8 * 20 = 160 pts)
    quarterfinalWinner: 40, // SF participants (Max 4 * 40 = 160 pts)
    semifinalWinner: 80,   // Finalists (Max 2 * 80 = 160 pts)
    thirdPlaceWinner: 40,  // Predict 3rd Place Match winner (Max 40 pts)
    finalWinner: 160       // Predict World Cup Champion (Max 160 pts)
};

// 5. Initialization: Load static configurations and predictions state
function init() {
    setupTabListeners();
    setupDropdownListeners();
    setupAdminReset();
    setupThemeToggle();
    setupDragScroll();
    
    // Load predictions state from localStorage
    loadStateFromStorage();
    
    setupOnboarding();
    populateUserDropdowns();
    
    // Set default initial standings for all users (if any aren't set)
    for (const username in STATE.participants) {
        const user = STATE.participants[username];
        if (!user.groupStandings || Object.keys(user.groupStandings).length === 0) {
            user.groupStandings = {};
            for (const group in GROUPS_DATA) {
                user.groupStandings[group] = GROUPS_DATA[group].map(t => t.code);
            }
            buildBracketFromStandings(username);
        }
    }
    
    // Set initial official admin results (some simulated match values) if none were saved
    if (!localStorage.getItem('wc-official-results')) {
        prepopulateSimulatedResults();
    }
    
    // Initial Render of UI
    renderAll();
}

function loadStateFromStorage() {
    // 1. Load official results first if they exist
    const savedResults = localStorage.getItem('wc-official-results');
    let loadedGroupStandings = null;
    if (savedResults) {
        const parsed = JSON.parse(savedResults);
        STATE.officialResults.matches = parsed.matches || {};
        STATE.officialResults.advancingTeams = parsed.advancingTeams || [];
        loadedGroupStandings = parsed.groupStandings || null;
    }

    // Initialize official actuals profile
    STATE.participants.actuals = {
        id: 'actuals',
        name: 'Official Actuals',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FIFA',
        champ: '',
        groupStandings: {},
        bracketPicks: STATE.officialResults.matches,
        submitted: true,
        onboarded: true,
        isActuals: true
    };
    if (loadedGroupStandings) {
        STATE.participants.actuals.groupStandings = loadedGroupStandings;
    } else {
        for (const group in GROUPS_DATA) {
            STATE.participants.actuals.groupStandings[group] = GROUPS_DATA[group].map(t => t.code);
        }
    }

    // 2. Load submissions array (ensure 'actuals' doesn't sneak in from legacy submissions)
    const savedSubs = localStorage.getItem('wc-submissions');
    if (savedSubs) {
        let subs = JSON.parse(savedSubs);
        const originalLength = subs.length;
        subs = subs.filter(sub => sub.id !== 'actuals');
        
        // Self-heal: Save back to localStorage if legacy actuals was removed
        if (subs.length !== originalLength) {
            localStorage.setItem('wc-submissions', JSON.stringify(subs));
        }

        subs.forEach(sub => {
            STATE.participants[sub.id] = sub;
        });
    }

    // 3. Load draft or initialize a fresh one
    const savedDraft = localStorage.getItem('wc-draft');
    if (savedDraft) {
        STATE.participants.draft = JSON.parse(savedDraft);
    } else {
        resetDraft();
    }
}

function saveStateToStorage() {
    // 1. Save submissions (skip actuals and draft)
    const subs = [];
    for (const username in STATE.participants) {
        if (username !== 'draft' && username !== 'actuals' && STATE.participants[username].submitted) {
            subs.push(STATE.participants[username]);
        }
    }
    localStorage.setItem('wc-submissions', JSON.stringify(subs));

    // 2. Save draft
    if (STATE.participants.draft) {
        localStorage.setItem('wc-draft', JSON.stringify(STATE.participants.draft));
    }

    // 3. Save official admin results and official group standings
    localStorage.setItem('wc-official-results', JSON.stringify({
        matches: STATE.officialResults.matches,
        advancingTeams: STATE.officialResults.advancingTeams,
        groupStandings: STATE.participants.actuals ? STATE.participants.actuals.groupStandings : {}
    }));
}

function resetDraft() {
    STATE.participants.draft = {
        id: 'draft',
        name: 'Guest Player',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest',
        champ: '',
        groupStandings: {},
        bracketPicks: {},
        submitted: false,
        onboarded: false
    };
    for (const group in GROUPS_DATA) {
        STATE.participants.draft.groupStandings[group] = GROUPS_DATA[group].map(t => t.code);
    }
    buildBracketFromStandings('draft');
}

// Simulate initial tournament results (e.g. up to Quarterfinals played)
function prepopulateSimulatedResults() {
    const results = STATE.officialResults;
    // Advancing teams based on group first/second places (matching static defaults)
    results.advancingTeams = [];
    for (const group in GROUPS_DATA) {
        results.advancingTeams.push(GROUPS_DATA[group][0].code);
        results.advancingTeams.push(GROUPS_DATA[group][1].code);
    }
    // Plus default best 3rd place teams from first 8 groups (A to H)
    for (let charCode = 65; charCode <= 72; charCode++) {
        const group = String.fromCharCode(charCode);
        results.advancingTeams.push(GROUPS_DATA[group][2].code);
    }

    // Round of 32 results (Match 1 to 16)
    results.matches[1] = 'GER'; // GER vs 3ABCDF
    results.matches[2] = 'FRA'; // FRA vs 3CDFGH
    results.matches[3] = 'MEX'; // MEX vs CAN
    results.matches[4] = 'NED'; // NED vs MAR
    results.matches[5] = 'POR'; // POR vs CRO
    results.matches[6] = 'ESP'; // ESP vs AUT
    results.matches[7] = 'USA'; // USA vs 3BEFIJ
    results.matches[8] = 'BEL'; // BEL vs 3AEHIJ
    results.matches[9] = 'BRA'; // BRA vs JPN
    results.matches[10] = 'SUI'; // SUI vs SEN
    results.matches[11] = 'KOR'; // KOR vs 3CEFHI
    results.matches[12] = 'ENG'; // ENG vs 3EHIJK
    results.matches[13] = 'ARG'; // ARG vs URU
    results.matches[14] = 'AUS'; // AUS vs EGY
    results.matches[15] = 'RSA'; // RSA vs 3EFGLI
    results.matches[16] = 'COL'; // COL vs 3DEJLL

    // Round of 16 simulated results (Match 17 to 24)
    results.matches[17] = 'FRA'; // GER vs FRA
    results.matches[18] = 'NED'; // MEX vs NED
    results.matches[19] = 'ESP'; // POR vs ESP
    results.matches[20] = 'BEL'; // USA vs BEL
    results.matches[21] = 'BRA'; // BRA vs SUI
    results.matches[22] = 'ENG'; // KOR vs ENG
    results.matches[23] = 'ARG'; // ARG vs AUS
    results.matches[24] = 'COL'; // RSA vs COL
}

// 6. State Rendering Engine
function renderAll() {
    renderLeaderboard();
    renderBracket();
    renderGroups();
    renderAdminSimulator();
}

// tab switching triggers
function setupTabListeners() {
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Enforce password protection for Admin Control tab
            if (tabName === 'admin') {
                const password = prompt("Enter Admin Password:");
                if (password !== 'worldcup') {
                    alert("Access Denied: Incorrect Password");
                    return; // Abort tab switching
                }
            }

            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            STATE.activeTab = tabName;

            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Dynamic header labels
            const titleMap = {
                leaderboard: { title: "Leaderboard Standings", desc: "Track scores, predictions, and real-time rank movements among friends." },
                bracket: { title: "Knock-Out Stages View", desc: "Use the dropdown to view different knock-out stages selections." },
                groups: { title: "Group Stages Viewer", desc: "Use the dropdown to view different group stages selections." },
                admin: { title: "Admin Match Simulator", desc: "Enter official outcomes to recalculate rankings." }
            };
            
            document.getElementById('current-tab-title').innerText = titleMap[tabName].title;
            document.getElementById('current-tab-desc').innerText = titleMap[tabName].desc;
        });
    });
}

function setupDropdownListeners() {
    // Bracket view user switcher
    document.getElementById('bracket-user-select').addEventListener('change', (e) => {
        STATE.activeBracketUser = e.target.value;
        renderBracket();
        updateSubmitButtonState();
    });

    // Group standings user switcher
    document.getElementById('groups-user-select').addEventListener('change', (e) => {
        STATE.activeGroupUser = e.target.value;
        renderGroups();
    });
}

function setupAdminReset() {
    document.getElementById('btn-reset-simulator').addEventListener('click', () => {
        // Clear the existing matches object to maintain reference integrity with the actuals profile
        for (const key in STATE.officialResults.matches) {
            delete STATE.officialResults.matches[key];
        }
        saveStateToStorage();
        renderAll();
    });
}

function setupThemeToggle() {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;

    // Load initial preference from localStorage (default to light mode, no class on body)
    const savedTheme = localStorage.getItem('wc-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        btn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
    } else {
        document.body.classList.remove('dark-theme');
        btn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
    }

    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('wc-theme', 'dark');
            btn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
        } else {
            localStorage.setItem('wc-theme', 'light');
            btn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
        }
    });
}

// 7. Calculate Scores & Ranks Engine
// Incorporates the "Any-Path" evaluation rules
function calculateParticipantScores() {
    const scoredList = [];
    const results = STATE.officialResults;

    for (const username in STATE.participants) {
        if (username === 'draft' || username === 'actuals') continue; // Skip draft and official actuals in leaderboard scores
        const p = STATE.participants[username];
        if (!p.submitted) continue; // Skip unsubmitted profiles
        let groupPts = 0;
        let koPts = 0;

        // A. Group advancement verification (Top 2 from each group + best 8 third places)
        // Check how many of the participant's predicted advancing teams actually advanced
        const userAdvancers = getPredictedAdvancers(username);
        const actualAdvancers = results.advancingTeams || [];
        
        userAdvancers.forEach(team => {
            if (actualAdvancers.includes(team)) {
                groupPts += POINTS_SCALE.groupAdvancement;
            }
        });

        // B. Knockout Progression validation ("Any-Path" rule)
        // Verify Round of 32 winners (advancing to R16)
        const r32ActualWinners = getActualWinnersForRound('R32');
        const r32UserPicks = getPicksForRound(p, 'R32');
        r32UserPicks.forEach(pick => {
            if (r32ActualWinners.includes(pick)) koPts += POINTS_SCALE.roundOf32Winner;
        });

        // Verify Round of 16 winners (advancing to QF)
        const r16ActualWinners = getActualWinnersForRound('R16');
        const r16UserPicks = getPicksForRound(p, 'R16');
        r16UserPicks.forEach(pick => {
            if (r16ActualWinners.includes(pick)) koPts += POINTS_SCALE.roundOf16Winner;
        });

        // Verify Quarterfinal winners (advancing to SF)
        const qfActualWinners = getActualWinnersForRound('QF');
        const qfUserPicks = getPicksForRound(p, 'QF');
        qfUserPicks.forEach(pick => {
            if (qfActualWinners.includes(pick)) koPts += POINTS_SCALE.quarterfinalWinner;
        });

        // Verify Semifinal winners (advancing to Finals)
        const sfActualWinners = getActualWinnersForRound('SF');
        const sfUserPicks = getPicksForRound(p, 'SF');
        sfUserPicks.forEach(pick => {
            if (sfActualWinners.includes(pick)) koPts += POINTS_SCALE.semifinalWinner;
        });

        // Verify 3rd place winner
        const thirdActualWinner = results.matches[31];
        const thirdUserPick = p.bracketPicks[31];
        if (thirdActualWinner && thirdUserPick === thirdActualWinner) {
            koPts += POINTS_SCALE.thirdPlaceWinner;
        }

        // Verify Champion winner
        const champActualWinner = results.matches[32];
        const champUserPick = p.bracketPicks[32];
        if (champActualWinner && champUserPick === champActualWinner) {
            koPts += POINTS_SCALE.finalWinner;
        }

        const totalScore = groupPts + koPts;
        scoredList.push({
            id: username,
            name: p.name,
            avatar: p.avatar,
            champ: getTeamByCode(p.champ),
            groupPts,
            koPts,
            totalScore
        });
    }

    // Sort by score descending
    scoredList.sort((a, b) => b.totalScore - a.totalScore);
    return scoredList;
}

function getActualWinnersForRound(roundName) {
    const winners = [];
    for (const matchId in KNOCKOUTS_SCHEMA) {
        const match = KNOCKOUTS_SCHEMA[matchId];
        if (match.round === roundName) {
            const winner = STATE.officialResults.matches[matchId];
            if (winner) winners.push(winner);
        }
    }
    return winners;
}

function getPicksForRound(participant, roundName) {
    const picks = [];
    for (const matchId in KNOCKOUTS_SCHEMA) {
        const match = KNOCKOUTS_SCHEMA[matchId];
        if (match.round === roundName) {
            const pick = participant.bracketPicks[matchId];
            if (pick) picks.push(pick);
        }
    }
    return picks;
}

// 8. Render Leaderboard & Rankings Table
function renderLeaderboard() {
    const scores = calculateParticipantScores();
    renderRankingsTable(scores);
    renderUserBadge(scores);
    updateActivePlayersCount();
}

function updateActivePlayersCount() {
    const countEl = document.getElementById('active-players-count');
    if (!countEl) return;
    
    const count = Object.keys(STATE.participants).filter(username => {
        if (username === 'draft' || username === 'actuals') return false;
        return STATE.participants[username].submitted;
    }).length;
    
    countEl.innerText = `${count} Player${count !== 1 ? 's' : ''}`;
}

function renderUserBadge(scores) {
    const badge = document.querySelector('.user-rank');
    if (!badge) return; // Safeguard if user rank badge doesn't exist in HTML

    if (!scores) scores = calculateParticipantScores();
    const userRow = scores.find(s => s.id === 'user');
    if (!userRow) {
        badge.innerText = 'Join the Pool!';
        return;
    }
    const myRank = scores.findIndex(s => s.id === 'user') + 1;
    const myScore = userRow.totalScore;
    
    // Add ordinal suffix (1st, 2nd, 3rd...)
    const ordinal = (n) => n + (['st', 'nd', 'rd'][((n + 90) % 100 % 10 - 1)] || 'th');
    
    badge.innerText = `${ordinal(myRank)} Place - ${myScore} Pts`;
}

function renderRankingsTable(scores) {
    const tbody = document.getElementById('leaderboard-rows');
    tbody.innerHTML = '';

    if (scores.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="8" class="text-center" style="padding: 4rem 1rem; color: var(--text-dark);">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.6; color: var(--accent-gold);">
                    <i class="fa-solid fa-users-slash"></i>
                </div>
                <div style="font-weight: 600; font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">
                    No Active Predictions Yet
                </div>
                <div style="font-size: 0.9rem; max-width: 440px; margin: 0 auto; line-height: 1.6; color: var(--text-dark);">
                    Be the first to submit your predictions! Click the <strong>Submit Picks</strong> button to customize your profile and submit your predictions to the leaderboard.
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    scores.forEach((player, index) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        
        tr.innerHTML = `
            <td>
                <div class="rank-badge">${index + 1}</div>
            </td>
            <td>
                <div class="player-cell">
                    <div style="display: flex; flex-direction: column;">
                        <span class="player-name" style="font-weight: 600; color: var(--text-primary);">${player.name}</span>
                        <span style="font-size: 0.72rem; color: var(--text-dark); display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 0.15rem;">
                            <i class="fa-solid fa-eye" style="font-size: 0.7rem;"></i> Click to view picks
                        </span>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge badge-info">${player.champ.flag} ${player.champ.name}</span>
            </td>
            <td class="text-center font-heading">${player.groupPts} <span style="font-size:0.75rem; color:var(--text-dark)">/160</span></td>
            <td class="text-center font-heading">${player.koPts} <span style="font-size:0.75rem; color:var(--text-dark)">/840</span></td>
            <td class="text-right points-emphasis">${player.totalScore} Pts</td>
        `;

        // Row click switches to the Bracket sheet view for this specific participant
        tr.addEventListener('click', () => {
            STATE.activeBracketUser = player.id;
            STATE.activeGroupUser = player.id;
            
            populateUserDropdowns();
            renderBracket();
            renderGroups();
            
            const bracketTabBtn = document.querySelector('.nav-item[data-tab="bracket"]');
            if (bracketTabBtn) {
                bracketTabBtn.click();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        tbody.appendChild(tr);
    });
}

// 9. Render Interactive Tournament Bracket Sheet
function renderBracket() {
    const canvas = document.getElementById('bracket-tree');
    canvas.innerHTML = '';

    // Rebuild bracket slots based on the active user standings before drawing
    buildBracketFromStandings(STATE.activeBracketUser);

    const p = STATE.participants[STATE.activeBracketUser];
    const results = STATE.officialResults;

    if (!p) {
        // Render a premium empty/prompt state if no active participant predictions are selected
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-bracket-state';
        emptyDiv.style = 'grid-column: span 6; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 1rem; color: var(--text-dark); text-align: center;';
        emptyDiv.innerHTML = `
            <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1.5rem; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));">
                <i class="fa-solid fa-trophy"></i>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">Start Your Predictions Journey!</h3>
            <p style="font-size: 0.95rem; max-width: 420px; margin: 0 auto; line-height: 1.6;">
                Fill out the group stages and predict your World Cup bracket. Click <strong>Submit Picks</strong> to get started!
            </p>
        `;
        canvas.appendChild(emptyDiv);
        return;
    }

    // Sync official champ
    if (p.isActuals) {
        p.champ = results.matches[32] || '';
    }

    // Render status badge (Official Actuals has no status badge anymore)
    const badgeEl = document.getElementById('bracket-status-badge');
    if (badgeEl) {
        if (p.isActuals) {
            badgeEl.innerHTML = '';
        } else if (p.submitted) {
            badgeEl.innerHTML = '';
        } else {
            badgeEl.innerHTML = `
                <span class="badge" style="background: rgba(59, 130, 246, 0.12); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.25); font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600; margin-right: 1rem;">
                    <i class="fa-solid fa-pen-to-square"></i> Draft
                </span>
            `;
        }
    }

    // Define the rounds columns to draw
    const roundsList = [
        { key: 'R32', title: 'Round of 32', matches: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
        { key: 'R16', title: 'Round of 16', matches: [17, 18, 19, 20, 21, 22, 23, 24] },
        { key: 'QF', title: 'Round of 8', matches: [25, 26, 27, 28] },
        { key: 'SF', title: 'Round of 4', matches: [29, 30] },
        { key: 'F', title: 'Round of 2', matches: [32, 31] }, 
        { key: 'CHAMP', title: 'Champion' }
    ];

    roundsList.forEach(round => {
        const col = document.createElement('div');
        col.className = round.key === 'CHAMP' ? 'champ-column' : 'round-column';
        
        // Add round headers
        const header = document.createElement('div');
        header.className = 'round-column-title';
        header.innerText = round.title;
        col.appendChild(header);

        if (round.key === 'CHAMP') {
            const champCode = p.bracketPicks[32] || '';
            const champTeam = getTeamByCode(champCode);
            const isWinnerCorrect = results.matches[32] && results.matches[32] === champCode;
            const isWinnerIncorrect = results.matches[32] && results.matches[32] !== champCode;

            let borderStyle = 'border: 2px solid rgba(245,158,11,0.4)';
            if (isWinnerCorrect) borderStyle = 'border: 2px solid var(--accent-emerald)';
            if (isWinnerIncorrect) borderStyle = 'border: 2px solid var(--accent-crimson)';

            const champCard = document.createElement('div');
            champCard.className = 'champ-card';
            champCard.style = borderStyle;
            champCard.innerHTML = `
                <i class="fa-solid fa-trophy crown-icon"></i>
                <div class="champ-title">CHAMPION</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${champTeam.flag}</span>
                    <span class="team-name-text">${champTeam.name}</span>
                </div>
            `;
            col.appendChild(champCard);

            // Silver Card (2nd Place) - Exact same shape and size as Champion card
            let silverCode = '';
            const homeCode32 = getKnockoutParticipant(p, 32, 'home');
            const awayCode32 = getKnockoutParticipant(p, 32, 'away');
            if (champCode && homeCode32 && awayCode32) {
                silverCode = (champCode === homeCode32) ? awayCode32 : homeCode32;
            }
            const silverTeam = getTeamByCode(silverCode);
            const silverCard = document.createElement('div');
            silverCard.className = 'champ-card silver-card';
            silverCard.style = 'margin-top: 1.5rem; border: 2px solid rgba(203, 213, 225, 0.4); background: linear-gradient(185deg, var(--card-bg) 0%, rgba(203, 213, 225, 0.1) 100%); box-shadow: 0 10px 30px rgba(203, 213, 225, 0.05);';
            silverCard.innerHTML = `
                <i class="fa-solid fa-medal crown-icon" style="color: #cbd5e1; filter: drop-shadow(0 0 12px rgba(203, 213, 225, 0.2));"></i>
                <div class="champ-title" style="color: #cbd5e1;">2ND PLACE / SILVER</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${silverTeam.flag}</span>
                    <span class="team-name-text">${silverTeam.name}</span>
                </div>
            `;
            col.appendChild(silverCard);

            // Bronze Card (3rd Place) - Exact same shape and size as Champion card
            const bronzeCode = p.bracketPicks[31] || '';
            const bronzeTeam = getTeamByCode(bronzeCode);
            const bronzeCard = document.createElement('div');
            bronzeCard.className = 'champ-card bronze-card';
            bronzeCard.style = 'margin-top: 1.5rem; border: 2px solid rgba(245, 158, 11, 0.4); background: linear-gradient(185deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.1) 100%); box-shadow: 0 10px 30px rgba(245, 158, 11, 0.05);';
            bronzeCard.innerHTML = `
                <i class="fa-solid fa-medal crown-icon" style="color: #fbbf24; filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.2));"></i>
                <div class="champ-title" style="color: #fbbf24;">3RD PLACE / BRONZE</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${bronzeTeam.flag}</span>
                    <span class="team-name-text">${bronzeTeam.name}</span>
                </div>
            `;
            col.appendChild(bronzeCard);
        } else {
            round.matches.forEach((matchId, idx) => {
                const matchSchema = KNOCKOUTS_SCHEMA[matchId];
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';

                // Add classes for vertical connections
                if (round.key !== 'F') {
                    if (idx % 2 === 0) {
                        matchCard.classList.add('upper-pair-match');
                    } else {
                        matchCard.classList.add('lower-pair-match');
                    }
                    
                    // Append the vertical connector line element
                    const connector = document.createElement('div');
                    connector.className = 'vertical-connector';
                    matchCard.appendChild(connector);
                }

                // Determine actual team codes playing this slot
                const homeCode = getKnockoutParticipant(p, matchId, 'home');
                const awayCode = getKnockoutParticipant(p, matchId, 'away');

                const homeTeam = getTeamByCode(homeCode);
                const awayTeam = getTeamByCode(awayCode);

                const predictedWinner = p.bracketPicks[matchId] || '';
                const officialWinner = results.matches[matchId] || '';

                // Apply correct/incorrect border classes if official results are simulated/played
                if (officialWinner) {
                    if (predictedWinner === officialWinner) {
                        matchCard.classList.add('correct-prediction');
                    } else {
                        matchCard.classList.add('incorrect-prediction');
                    }
                }

                matchCard.innerHTML = `
                    <div class="match-info-meta">
                        <span>${matchSchema.label}</span>
                        <span>${matchSchema.date} - ${matchSchema.venue}</span>
                    </div>
                    <div class="team-slot ${predictedWinner === homeCode && homeCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${homeCode}" style="${p.submitted ? 'cursor: default !important;' : 'cursor: pointer;'}">
                        <div class="team-slot-info">
                            <span class="team-flag">${homeTeam.flag}</span>
                            <span class="team-name-text">${homeTeam.name}</span>
                        </div>
                        <span class="team-score">${homeCode && officialWinner === homeCode ? '<i class="fa-solid fa-circle-check"></i>' : ''}</span>
                    </div>
                    <div class="team-slot ${predictedWinner === awayCode && awayCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${awayCode}" style="${p.submitted ? 'cursor: default !important;' : 'cursor: pointer;'}">
                        <div class="team-slot-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            <span class="team-name-text">${awayTeam.name}</span>
                        </div>
                        <span class="team-score">${awayCode && officialWinner === awayCode ? '<i class="fa-solid fa-circle-check"></i>' : ''}</span>
                    </div>
                `;

                // Set interactive click event for advancement selection
                if (!p.submitted) {
                    matchCard.querySelectorAll('.team-slot').forEach(slot => {
                        slot.addEventListener('click', () => {
                            const mId = parseInt(slot.getAttribute('data-match'));
                            const team = slot.getAttribute('data-team');
                            
                            if (!team || team === 'TBD') return;

                            // Set participant pick
                            p.bracketPicks[mId] = team;
                            if (mId === 32) {
                                p.champ = team; // Set global predicted champ
                            }

                            // Recursively propagate and clear children to keep tree logically correct
                            propagateWinner(p, mId, team);
                            
                            renderBracket();
                            renderLeaderboard();
                        });
                    });
                }

                col.appendChild(matchCard);
            });
        }

        canvas.appendChild(col);
    });
}

// Logic to pull which team code occupies a home/away knockout slot based on user's parent predictions
function getKnockoutParticipant(participant, matchId, slot) {
    if (!participant || !participant.bracketPicks) return '';
    const schema = KNOCKOUTS_SCHEMA[matchId];
    if (schema.round === 'R32') {
        return slot === 'home' ? schema.homeTeamCode || schema.defaultHome : slot === 'away' ? schema.awayTeamCode || schema.defaultAway : '';
    }

    // Special Case: 3rd Place Match (Match 31) participants are the losers of the Semifinals
    if (matchId === 31) {
        const sfMatchId = slot === 'home' ? 29 : 30;
        const sfWinner = participant.bracketPicks[sfMatchId];
        if (!sfWinner) return '';
        
        const sfHome = getKnockoutParticipant(participant, sfMatchId, 'home');
        const sfAway = getKnockoutParticipant(participant, sfMatchId, 'away');
        
        if (sfWinner === sfHome) return sfAway;
        if (sfWinner === sfAway) return sfHome;
        return '';
    }

    // Knockout rounds: derive teams dynamically from the winners of parent matches
    const parentMatches = Object.values(KNOCKOUTS_SCHEMA).filter(m => m.nextMatch === matchId);
    
    if (slot === 'home') {
        const parentMatch = parentMatches[0];
        return parentMatch ? participant.bracketPicks[parentMatch.name.replace('M','')] : '';
    } else {
        const parentMatch = parentMatches[1];
        return parentMatch ? participant.bracketPicks[parentMatch.name.replace('M','')] : '';
    }
}

// Keep predicted brackets logically clean on selection changes
function propagateWinner(participant, matchId, teamCode) {
    const schema = KNOCKOUTS_SCHEMA[matchId];
    if (!schema || !schema.nextMatch) return;

    const nextId = schema.nextMatch;

    // Check if the participant's prediction for the next round is invalid
    const nextPick = participant.bracketPicks[nextId];
    if (nextPick && nextPick !== teamCode) {
        // Clear all subsequent nodes that match the old parent
        clearChildMatchPicks(participant, nextId, nextPick);
    }
}

function clearChildMatchPicks(participant, matchId, oldTeamCode) {
    if (participant.bracketPicks[matchId] === oldTeamCode) {
        delete participant.bracketPicks[matchId];
        if (matchId === 32) participant.champ = '';
    }

    const schema = KNOCKOUTS_SCHEMA[matchId];
    if (schema && schema.nextMatch) {
        clearChildMatchPicks(participant, schema.nextMatch, oldTeamCode);
    }
}

// 10. Render Group Standings Sort Panels
function renderGroups() {
    const wrapper = document.getElementById('groups-grid-wrapper');
    wrapper.innerHTML = '';

    // Rebuild bracket slots based on the active user standings before drawing
    buildBracketFromStandings(STATE.activeGroupUser);

    const p = STATE.participants[STATE.activeGroupUser];
    if (!p || !p.groupStandings) {
        wrapper.innerHTML = `
            <div class="empty-groups-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dark);">
                <i class="fa-solid fa-table-cells-large" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <div style="font-weight: 600; color: var(--text-primary);">No User Selected</div>
                <div>Please submit your picks to build your group predictions.</div>
            </div>
        `;
        return;
    }

    // Render status badge (Official Actuals has no status badge anymore)
    const badgeEl = document.getElementById('groups-status-badge');
    if (badgeEl) {
        if (p.isActuals) {
            badgeEl.innerHTML = '';
        } else if (p.submitted) {
            badgeEl.innerHTML = '';
        } else {
            badgeEl.innerHTML = `
                <span class="badge" style="background: rgba(59, 130, 246, 0.12); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.25); font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600; margin-right: 1rem;">
                    <i class="fa-solid fa-pen-to-square"></i> Draft
                </span>
            `;
        }
    }

    for (const groupName in GROUPS_DATA) {
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';

        const orderedCodes = p.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
        
        let teamRowsHtml = '';
        orderedCodes.forEach((code, index) => {
            const team = getTeamByCode(code);
            const sortActionsHtml = !p.submitted ? `
                <div class="team-sort-actions">
                    <button class="sort-btn btn-up" onclick="moveTeam('${groupName}', ${index}, -1)"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="sort-btn btn-down" onclick="moveTeam('${groupName}', ${index}, 1)"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
            ` : '';

            teamRowsHtml += `
                <div class="draggable-team-row" data-group="${groupName}" data-code="${code}" data-idx="${index}" style="${p.submitted ? 'padding-right: 1rem;' : ''}">
                    <div class="team-row-left">
                        <div class="team-position-marker">${index + 1}</div>
                        <span class="team-flag">${team.flag}</span>
                        <span>${team.name}</span>
                    </div>
                    ${sortActionsHtml}
                </div>
            `;
        });

        groupCard.innerHTML = `
            <div class="group-title">
                <span>Group ${groupName}</span>
                <span style="font-size: 0.75rem; color: var(--primary)">Standings</span>
            </div>
            <div class="group-team-list">
                ${teamRowsHtml}
            </div>
        `;
        wrapper.appendChild(groupCard);
    }
}

window.moveTeam = function(groupName, currentIndex, direction) {
    const p = STATE.participants[STATE.activeGroupUser];
    if (!p || !p.groupStandings) return;
    
    const standings = p.groupStandings[groupName];
    if (!standings) return;
    
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= standings.length) return;

    // Swap elements
    const temp = standings[currentIndex];
    standings[currentIndex] = standings[targetIndex];
    standings[targetIndex] = temp;

    // Automatically synchronize standings with bracket in real-time
    buildBracketFromStandings(STATE.activeGroupUser);

    renderGroups();
};

// Map standings choices to Round of 32 slots when save is clicked
function buildBracketFromStandings(username) {
    const p = STATE.participants[username];
    if (!p || !p.groupStandings) return;
    
    // Group first place and second place slots mapped to standard layout
    // A1, A2, B1, B2 ... L1, L2
    const groupFirsts = {};
    const groupSeconds = {};
    const groupThirds = [];

    for (const group in p.groupStandings) {
        const standings = p.groupStandings[group];
        groupFirsts[group] = standings[0];
        groupSeconds[group] = standings[1];
        groupThirds.push({ group: group, code: standings[2] });
    }

    // Set first & second qualifiers in match tree schema dynamically
    KNOCKOUTS_SCHEMA[1].homeTeamCode = groupFirsts['E']; // 1E
    KNOCKOUTS_SCHEMA[2].homeTeamCode = groupFirsts['I']; // 1I
    KNOCKOUTS_SCHEMA[3].homeTeamCode = groupSeconds['A']; // 2A
    KNOCKOUTS_SCHEMA[3].awayTeamCode = groupSeconds['B']; // 2B
    KNOCKOUTS_SCHEMA[4].homeTeamCode = groupFirsts['F']; // 1F
    KNOCKOUTS_SCHEMA[4].awayTeamCode = groupSeconds['C']; // 2C
    KNOCKOUTS_SCHEMA[5].homeTeamCode = groupSeconds['K']; // 2K
    KNOCKOUTS_SCHEMA[5].awayTeamCode = groupSeconds['L']; // 2L
    KNOCKOUTS_SCHEMA[6].homeTeamCode = groupFirsts['H']; // 1H
    KNOCKOUTS_SCHEMA[6].awayTeamCode = groupSeconds['J']; // 2J
    KNOCKOUTS_SCHEMA[7].homeTeamCode = groupFirsts['D']; // 1D
    KNOCKOUTS_SCHEMA[8].homeTeamCode = groupFirsts['G']; // 1G
    
    KNOCKOUTS_SCHEMA[9].homeTeamCode = groupFirsts['C']; // 1C
    KNOCKOUTS_SCHEMA[9].awayTeamCode = groupSeconds['F']; // 2F
    KNOCKOUTS_SCHEMA[10].homeTeamCode = groupSeconds['E']; // 2E
    KNOCKOUTS_SCHEMA[10].awayTeamCode = groupSeconds['I']; // 2I
    KNOCKOUTS_SCHEMA[11].homeTeamCode = groupFirsts['A']; // 1A
    KNOCKOUTS_SCHEMA[12].homeTeamCode = groupFirsts['L']; // 1L
    KNOCKOUTS_SCHEMA[13].homeTeamCode = groupFirsts['J']; // 1J
    KNOCKOUTS_SCHEMA[13].awayTeamCode = groupSeconds['H']; // 2H
    KNOCKOUTS_SCHEMA[14].homeTeamCode = groupSeconds['D']; // 2D
    KNOCKOUTS_SCHEMA[14].awayTeamCode = groupSeconds['G']; // 2G
    KNOCKOUTS_SCHEMA[15].homeTeamCode = groupFirsts['B']; // 1B
    KNOCKOUTS_SCHEMA[16].homeTeamCode = groupFirsts['K']; // 1K

    // Determine 3rd place advancers (Default: select first 8 groups' 3rd places A to H)
    KNOCKOUTS_SCHEMA[1].awayTeamCode = groupThirds[0].code; // 3A
    KNOCKOUTS_SCHEMA[2].awayTeamCode = groupThirds[2].code; // 3C
    KNOCKOUTS_SCHEMA[7].awayTeamCode = groupThirds[1].code; // 3B
    KNOCKOUTS_SCHEMA[8].awayTeamCode = groupThirds[4].code; // 3E
    KNOCKOUTS_SCHEMA[11].awayTeamCode = groupThirds[5].code; // 3F
    KNOCKOUTS_SCHEMA[12].awayTeamCode = groupThirds[7].code; // 3H
    KNOCKOUTS_SCHEMA[15].awayTeamCode = groupThirds[6].code; // 3G
    KNOCKOUTS_SCHEMA[16].awayTeamCode = groupThirds[3].code; // 3D

}

// 11. Render Admin simulator matches panel
function moveActualTeam(groupName, index, direction) {
    const act = STATE.participants.actuals;
    if (!act || !act.groupStandings) return;

    const list = act.groupStandings[groupName];
    if (!list) return;

    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap elements in the array
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Rebuild bracket slots based on the new official group standings
    buildBracketFromStandings('actuals');

    saveStateToStorage();
    renderAll();
}
window.moveActualTeam = moveActualTeam;

// 11. Render Admin simulator matches panel + group editor + user list management
function renderAdminSimulator() {
    // 1. Render Knockout matches simulator
    const listContainer = document.getElementById('admin-simulator-matches');
    if (listContainer) {
        listContainer.innerHTML = '';
        const results = STATE.officialResults;
        const roundTitles = {
            'R32': 'Round of 32 Matches',
            'R16': 'Round of 16 Matches',
            'QF': 'Quarterfinal Matches',
            'SF': 'Semifinal Matches',
            '3RD': '3rd Place Match',
            'F': 'World Cup Championship Final'
        };

        let currentRound = '';

        for (const matchId in KNOCKOUTS_SCHEMA) {
            const m = KNOCKOUTS_SCHEMA[matchId];
            
            // Add round dividers
            if (m.round !== currentRound) {
                currentRound = m.round;
                const div = document.createElement('div');
                div.className = 'admin-simulator-round-divider';
                div.innerText = roundTitles[currentRound];
                listContainer.appendChild(div);
            }

            // Pull simulated team options (Uses active actuals or fallback to defaults)
            const homeCode = getKnockoutParticipant(STATE.participants.actuals, matchId, 'home');
            const awayCode = getKnockoutParticipant(STATE.participants.actuals, matchId, 'away');
            
            const homeTeam = getTeamByCode(homeCode);
            const awayTeam = getTeamByCode(awayCode);

            const currentOfficialWinner = results.matches[matchId] || '';

            const row = document.createElement('div');
            row.className = 'admin-match-row';

            row.innerHTML = `
                <div class="admin-teams-wrapper">
                    <button class="admin-team-button ${currentOfficialWinner === homeCode && homeCode ? 'selected-winner' : ''}" data-match="${matchId}" data-team="${homeCode}">
                        <span>${homeTeam.flag}</span>
                        <span>${homeTeam.name}</span>
                    </button>
                    <span class="admin-vs-label">VS</span>
                    <button class="admin-team-button ${currentOfficialWinner === awayCode && awayCode ? 'selected-winner' : ''}" data-match="${matchId}" data-team="${awayCode}">
                        <span>${awayTeam.flag}</span>
                        <span>${awayTeam.name}</span>
                    </button>
                </div>
                <div class="admin-match-details">
                    <div style="font-weight: 700; color: var(--text-primary)">${m.label}</div>
                    <div>${m.venue}</div>
                </div>
            `;

            row.querySelectorAll('.admin-team-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const team = btn.getAttribute('data-team');
                    const mid = btn.getAttribute('data-match');
                    
                    if (!team || team === 'TBD') return;

                    if (results.matches[mid] === team) {
                        delete results.matches[mid];
                    } else {
                        results.matches[mid] = team;
                    }

                    saveStateToStorage();
                    renderLeaderboard();
                    renderBracket();
                    renderAdminSimulator();
                    updateSimStats();
                });
            });

            listContainer.appendChild(row);
        }
    }

    // 2. Render Official Group Stages Standings Editor
    const groupsGrid = document.getElementById('admin-groups-grid');
    if (groupsGrid) {
        groupsGrid.innerHTML = '';
        const act = STATE.participants.actuals;
        if (act && act.groupStandings) {
            for (const groupName in GROUPS_DATA) {
                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                groupCard.style = 'padding: 1rem;';

                const orderedCodes = act.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
                
                let teamRowsHtml = '';
                orderedCodes.forEach((code, index) => {
                    const team = getTeamByCode(code);
                    const sortActionsHtml = `
                        <div class="team-sort-actions">
                            <button class="sort-btn btn-up" onclick="moveActualTeam('${groupName}', ${index}, -1); event.preventDefault();"><i class="fa-solid fa-chevron-up"></i></button>
                            <button class="sort-btn btn-down" onclick="moveActualTeam('${groupName}', ${index}, 1); event.preventDefault();"><i class="fa-solid fa-chevron-down"></i></button>
                        </div>
                    `;

                    teamRowsHtml += `
                        <div class="draggable-team-row" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; margin-bottom: 0.3rem;" data-group="${groupName}" data-code="${code}" data-idx="${index}">
                            <div class="team-row-left">
                                <div class="team-position-marker" style="width: 18px; height: 18px; font-size: 0.7rem;">${index + 1}</div>
                                <span class="team-flag" style="font-size: 0.95rem;">${team.flag}</span>
                                <span>${team.name}</span>
                            </div>
                            ${sortActionsHtml}
                        </div>
                    `;
                });

                groupCard.innerHTML = `
                    <div class="group-title" style="margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <span>Group ${groupName}</span>
                        <span style="font-size: 0.7rem; color: var(--primary)">Official</span>
                    </div>
                    <div class="group-teams-wrapper">
                        ${teamRowsHtml}
                    </div>
                `;

                groupsGrid.appendChild(groupCard);
            }
        }
    }

    // 3. Render Participant List for Deletion
    const userList = document.getElementById('admin-user-list-container');
    if (userList) {
        userList.innerHTML = '';
        
        let userCount = 0;
        for (const username in STATE.participants) {
            if (username === 'draft' || username === 'actuals') continue;
            
            userCount++;
            const p = STATE.participants[username];
            
            const userRow = document.createElement('div');
            userRow.style = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--card-border);';
            
            userRow.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                    <span style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">${p.name}</span>
                    <span style="font-size: 0.72rem; color: var(--text-dark);">Champ: ${getTeamByCode(p.champ).flag} ${getTeamByCode(p.champ).name || 'None'}</span>
                </div>
                <button class="btn btn-secondary delete-user-btn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.3); color: var(--accent-crimson); display: inline-flex; align-items: center; gap: 0.3rem;" data-user="${username}">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            `;
            
            userRow.querySelector('.delete-user-btn').addEventListener('click', () => {
                if (confirm(`⚠️ Are you sure you want to permanently delete participant "${p.name}"?`)) {
                    delete STATE.participants[username];
                    
                    if (STATE.activeBracketUser === username) STATE.activeBracketUser = 'actuals';
                    if (STATE.activeGroupUser === username) STATE.activeGroupUser = 'actuals';
                    
                    saveStateToStorage();
                    populateUserDropdowns();
                    renderAll();
                    alert(`Removed "${p.name}" from the pool.`);
                }
            });
            
            userList.appendChild(userRow);
        }

        if (userCount === 0) {
            userList.innerHTML = `
                <div style="padding: 2rem 1rem; text-align: center; color: var(--text-dark); font-size: 0.85rem;">
                    No participants registered yet
                </div>
            `;
        }
    }

    updateSimStats();
}

function updateSimStats() {
    const results = STATE.officialResults;
    const matchesSimulated = Object.keys(results.matches).length;
    document.getElementById('sim-matches-played').innerText = `${matchesSimulated} / 32`;
}

function setupOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    const nameInput = document.getElementById('visitor-name');

    const sidebarBtn = document.getElementById('sidebar-submit-btn');
    const leaderboardBtn = document.getElementById('leaderboard-submit-btn');
    const submitPicksBtn = document.getElementById('btn-submit-picks');
    
    const closeBtn = document.getElementById('btn-close-wizard');
    const backBtn = document.getElementById('btn-wizard-back');
    const nextBtn = document.getElementById('btn-wizard-next');
    const submitBtn = document.getElementById('btn-wizard-submit');

    // Toggle Submit Button visibility
    updateSubmitButtonState();

    if (nameInput) {
        nameInput.addEventListener('input', updateWizardNextButtonState);
    }

    // 1. Wizard Open Trigger
    const openWizard = () => {
        const draft = STATE.participants.draft;
        nameInput.value = draft.onboarded ? draft.name : '';

        goToWizardStep(1);
        modal.classList.add('active');
    };

    if (sidebarBtn) sidebarBtn.addEventListener('click', openWizard);
    if (leaderboardBtn) leaderboardBtn.addEventListener('click', openWizard);
    if (submitPicksBtn) submitPicksBtn.addEventListener('click', openWizard);

    // 2. Close Button Trigger
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            saveStateToStorage();
            modal.classList.remove('active');
        });
    }

    // 3. Navigation - Back Button
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (STATE.wizardStep > 1) {
                goToWizardStep(STATE.wizardStep - 1);
            }
        });
    }

    // 4. Navigation - Next Button
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const step = STATE.wizardStep;
            
            if (step === 1) {
                // Profile Validation
                const nameVal = nameInput.value.trim();
                if (!nameVal) {
                    alert('Please enter your name to personalize your predictions entry!');
                    return;
                }
                const draft = STATE.participants.draft;

                draft.name = nameVal;
                draft.avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nameVal)}`;
                draft.onboarded = true;

                saveStateToStorage();
                goToWizardStep(2);
            } else if (step === 2) {
                // Group standings complete - proceed to bracket tree
                goToWizardStep(3);
            } else if (step === 3) {
                // Bracket tree complete - validate all 32 matches are picked before proceeding to summary
                const draft = STATE.participants.draft;
                const incomplete = [];
                for (let i = 1; i <= 32; i++) {
                    if (!draft.bracketPicks[i]) {
                        incomplete.push(i);
                    }
                }
                if (incomplete.length > 0) {
                    alert(`Please complete all 32 bracket picks before proceeding! You have ${incomplete.length} unselected matchup${incomplete.length > 1 ? 's' : ''} left.`);
                    return;
                }
                goToWizardStep(4);
            }
        });
    }

    // 5. Navigation - Final Submit Button
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const draft = STATE.participants.draft;
            
            if (!draft.champ) {
                alert('Please complete your knockout bracket and predict a tournament Champion in Step 3 before submitting!');
                goToWizardStep(3);
                return;
            }

            // Commit the draft as a permanent frozen submission
            const subId = `sub_${Date.now()}`;
            const newSubmission = {
                id: subId,
                name: draft.name,
                avatar: draft.avatar,
                champ: draft.champ,
                groupStandings: JSON.parse(JSON.stringify(draft.groupStandings)),
                bracketPicks: JSON.parse(JSON.stringify(draft.bracketPicks)),
                submitted: true,
                onboarded: true
            };

            // Inject to active participants pool
            STATE.participants[subId] = newSubmission;

            // Reset guest draft state
            resetDraft();
            saveStateToStorage();

            // Close modal overlay
            modal.classList.remove('active');

            // Select the newly submitted player on the main page read-only tabs
            STATE.activeBracketUser = subId;
            STATE.activeGroupUser = subId;

            populateUserDropdowns();
            updateSubmitButtonState();
            renderAll();

            alert(`🎉 Success! Your predictions are submitted under name "${newSubmission.name}" and locked forever.`);

            // Navigate visitor to leaderboard tab
            const leaderboardTabBtn = document.querySelector('.nav-item[data-tab="leaderboard"]');
            if (leaderboardTabBtn) leaderboardTabBtn.click();
        });
    }
}

// Global Wizard Navigation Logic
function goToWizardStep(step) {
    STATE.wizardStep = step;
    
    // Toggle active panels
    const panels = document.querySelectorAll('.wizard-step-panel');
    panels.forEach(panel => {
        const panelStep = parseInt(panel.getAttribute('data-step'));
        if (panelStep === step) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    // Update progress tracker visual bubbles
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(pStep => {
        const stepNum = parseInt(pStep.getAttribute('data-step'));
        if (stepNum === step) {
            pStep.classList.add('active');
            pStep.classList.remove('completed');
        } else if (stepNum < step) {
            pStep.classList.remove('active');
            pStep.classList.add('completed');
        } else {
            pStep.classList.remove('active');
            pStep.classList.remove('completed');
        }
    });

    // Dynamically adjust modal scaling sizes
    const wizardCard = document.querySelector('.wizard-card');
    if (wizardCard) {
        wizardCard.classList.remove('step-1-active', 'step-4-active');
        if (step === 1) {
            wizardCard.classList.add('step-1-active');
        } else if (step === 4) {
            wizardCard.classList.add('step-4-active');
        }
    }

    // Toggle Back button visibility
    const backBtn = document.getElementById('btn-wizard-back');
    if (backBtn) {
        backBtn.style.visibility = (step === 1) ? 'hidden' : 'visible';
    }

    // Toggle Next button visibility
    const nextBtn = document.getElementById('btn-wizard-next');
    if (nextBtn) {
        nextBtn.style.display = (step === 4) ? 'none' : 'inline-flex';
    }

    // Trigger step-specific renders or details binding
    if (step === 2) {
        renderWizardGroups();
    } else if (step === 3) {
        renderWizardBracket();
    } else if (step === 4) {
        const draft = STATE.participants.draft;
        const champCode = draft.champ || '';
        const champTeam = getTeamByCode(champCode);
        
        const reviewChamp = document.getElementById('wizard-review-champ');
        if (reviewChamp) {
            reviewChamp.innerText = champCode ? `${champTeam.flag} ${champTeam.name}` : 'TBD';
        }

        // Silver is the loser of the Final Match (Match 32)
        const homeCode32 = getKnockoutParticipant(draft, 32, 'home');
        const awayCode32 = getKnockoutParticipant(draft, 32, 'away');
        let silverCode = 'TBD';
        if (champCode) {
            silverCode = (champCode === homeCode32) ? awayCode32 : homeCode32;
        }
        const silverTeam = getTeamByCode(silverCode);
        const reviewSilver = document.getElementById('wizard-review-silver');
        if (reviewSilver) {
            reviewSilver.innerText = (silverCode && silverCode !== 'TBD') ? `${silverTeam.flag} ${silverTeam.name}` : 'TBD';
        }

        // Bronze is the winner of 3rd Place (Match 31)
        const bronzeCode = draft.bracketPicks[31] || '';
        const bronzeTeam = getTeamByCode(bronzeCode);
        const reviewBronze = document.getElementById('wizard-review-bronze');
        if (reviewBronze) {
            reviewBronze.innerText = bronzeCode ? `${bronzeTeam.flag} ${bronzeTeam.name}` : 'TBD';
        }
    }
    
    // Update Next button unlit/disabled state reactively on step entry
    updateWizardNextButtonState();
}

function updateWizardNextButtonState() {
    const nextBtn = document.getElementById('btn-wizard-next');
    if (!nextBtn) return;
    
    const step = STATE.wizardStep;
    const draft = STATE.participants.draft;
    
    let isEnabled = true;
    
    if (step === 1) {
        // Name field must not be empty
        const nameInput = document.getElementById('visitor-name');
        isEnabled = nameInput && nameInput.value.trim().length > 0;
    } else if (step === 2) {
        // Groups are always populated (pre-loaded list)
        isEnabled = true;
    } else if (step === 3) {
        // All 32 bracket picks must be complete
        let picksCount = 0;
        for (let i = 1; i <= 32; i++) {
            if (draft.bracketPicks[i]) {
                picksCount++;
            }
        }
        isEnabled = (picksCount === 32);
    }
    
    if (isEnabled) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.classList.remove('disabled-btn');
    } else {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.4';
        nextBtn.style.pointerEvents = 'none';
        nextBtn.classList.add('disabled-btn');
    }
}

// Render dynamic group stage standings builder inside predictions wizard
function renderWizardGroups() {
    const wrapper = document.getElementById('wizard-groups-grid');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    // Rebuild bracket slots based on standings
    buildBracketFromStandings('draft');

    const p = STATE.participants.draft;
    if (!p || !p.groupStandings) return;

    for (const groupName in GROUPS_DATA) {
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';

        const orderedCodes = p.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
        
        let teamRowsHtml = '';
        orderedCodes.forEach((code, index) => {
            const team = getTeamByCode(code);
            const sortActionsHtml = `
                <div class="team-sort-actions">
                    <button class="sort-btn btn-up" onclick="moveWizardTeam('${groupName}', ${index}, -1); event.preventDefault();"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="sort-btn btn-down" onclick="moveWizardTeam('${groupName}', ${index}, 1); event.preventDefault();"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
            `;

            teamRowsHtml += `
                <div class="draggable-team-row" data-group="${groupName}" data-code="${code}" data-idx="${index}">
                    <div class="team-row-left">
                        <div class="team-position-marker">${index + 1}</div>
                        <span class="team-flag">${team.flag}</span>
                        <span>${team.name}</span>
                    </div>
                    ${sortActionsHtml}
                </div>
            `;
        });

        groupCard.innerHTML = `
            <div class="group-title">
                <span>Group ${groupName}</span>
                <span style="font-size: 0.75rem; color: var(--primary)">Standings</span>
            </div>
            <div class="group-team-list">
                ${teamRowsHtml}
            </div>
        `;
        wrapper.appendChild(groupCard);
    }
}

window.moveWizardTeam = function(groupName, currentIndex, direction) {
    const p = STATE.participants.draft;
    if (!p || !p.groupStandings) return;
    
    const standings = p.groupStandings[groupName];
    if (!standings) return;
    
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= standings.length) return;

    // Swap elements
    const temp = standings[currentIndex];
    standings[currentIndex] = standings[targetIndex];
    standings[targetIndex] = temp;

    // Sync standings with bracket tree schema in real-time
    buildBracketFromStandings('draft');

    renderWizardGroups();
};

// Render interactive bracket sheet tree inside predictions wizard
function renderWizardBracket() {
    const canvas = document.getElementById('wizard-bracket-tree');
    if (!canvas) return;
    canvas.innerHTML = '';

    // Rebuild bracket slots
    buildBracketFromStandings('draft');

    const p = STATE.participants.draft;
    if (!p) return;

    const roundsList = [
        { key: 'R32', title: 'Round of 32', matches: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
        { key: 'R16', title: 'Round of 16', matches: [17, 18, 19, 20, 21, 22, 23, 24] },
        { key: 'QF', title: 'Round of 8', matches: [25, 26, 27, 28] },
        { key: 'SF', title: 'Round of 4', matches: [29, 30] },
        { key: 'F', title: 'Round of 2', matches: [32, 31] },
        { key: 'CHAMP', title: 'Champion' }
    ];

    roundsList.forEach(round => {
        const col = document.createElement('div');
        col.className = round.key === 'CHAMP' ? 'champ-column' : 'round-column';
        
        const header = document.createElement('div');
        header.className = 'round-column-title';
        header.innerText = round.title;
        col.appendChild(header);

        if (round.key === 'CHAMP') {
            const champCode = p.bracketPicks[32] || '';
            const champTeam = getTeamByCode(champCode);

            const champCard = document.createElement('div');
            champCard.className = 'champ-card';
            champCard.style = 'border: 2px solid rgba(245,158,11,0.4)';
            champCard.innerHTML = `
                <i class="fa-solid fa-trophy crown-icon"></i>
                <div class="champ-title">CHAMPION</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${champTeam.flag}</span>
                    <span class="team-name-text">${champTeam.name}</span>
                </div>
            `;
            col.appendChild(champCard);

            // Silver Card (2nd Place) - Exact same shape and size as Champion card
            let silverCode = '';
            const homeCode32 = getKnockoutParticipant(p, 32, 'home');
            const awayCode32 = getKnockoutParticipant(p, 32, 'away');
            if (champCode && homeCode32 && awayCode32) {
                silverCode = (champCode === homeCode32) ? awayCode32 : homeCode32;
            }
            const silverTeam = getTeamByCode(silverCode);
            const silverCard = document.createElement('div');
            silverCard.className = 'champ-card silver-card';
            silverCard.style = 'margin-top: 1.5rem; border: 2px solid rgba(203, 213, 225, 0.4); background: linear-gradient(185deg, var(--card-bg) 0%, rgba(203, 213, 225, 0.1) 100%); box-shadow: 0 10px 30px rgba(203, 213, 225, 0.05);';
            silverCard.innerHTML = `
                <i class="fa-solid fa-medal crown-icon" style="color: #cbd5e1; filter: drop-shadow(0 0 12px rgba(203, 213, 225, 0.2));"></i>
                <div class="champ-title" style="color: #cbd5e1;">2ND PLACE / SILVER</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${silverTeam.flag}</span>
                    <span class="team-name-text">${silverTeam.name}</span>
                </div>
            `;
            col.appendChild(silverCard);

            // Bronze Card (3rd Place) - Exact same shape and size as Champion card
            const bronzeCode = p.bracketPicks[31] || '';
            const bronzeTeam = getTeamByCode(bronzeCode);
            const bronzeCard = document.createElement('div');
            bronzeCard.className = 'champ-card bronze-card';
            bronzeCard.style = 'margin-top: 1.5rem; border: 2px solid rgba(245, 158, 11, 0.4); background: linear-gradient(185deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.1) 100%); box-shadow: 0 10px 30px rgba(245, 158, 11, 0.05);';
            bronzeCard.innerHTML = `
                <i class="fa-solid fa-medal crown-icon" style="color: #fbbf24; filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.2));"></i>
                <div class="champ-title" style="color: #fbbf24;">3RD PLACE / BRONZE</div>
                <div class="champ-team-spot">
                    <span class="team-flag">${bronzeTeam.flag}</span>
                    <span class="team-name-text">${bronzeTeam.name}</span>
                </div>
            `;
            col.appendChild(bronzeCard);
        } else {
            round.matches.forEach((matchId, idx) => {
                const matchSchema = KNOCKOUTS_SCHEMA[matchId];
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';

                // Add classes for vertical connections
                if (round.key !== 'F') {
                    if (idx % 2 === 0) {
                        matchCard.classList.add('upper-pair-match');
                    } else {
                        matchCard.classList.add('lower-pair-match');
                    }
                    
                    // Append the vertical connector line element
                    const connector = document.createElement('div');
                    connector.className = 'vertical-connector';
                    matchCard.appendChild(connector);
                }

                const homeCode = getKnockoutParticipant(p, matchId, 'home');
                const awayCode = getKnockoutParticipant(p, matchId, 'away');

                const homeTeam = getTeamByCode(homeCode);
                const awayTeam = getTeamByCode(awayCode);

                const predictedWinner = p.bracketPicks[matchId] || '';

                matchCard.innerHTML = `
                    <div class="match-info-meta">
                        <span>${matchSchema.label}</span>
                        <span>${matchSchema.date} - ${matchSchema.venue}</span>
                    </div>
                    <div class="team-slot ${predictedWinner === homeCode && homeCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${homeCode}" style="cursor: pointer;">
                        <div class="team-slot-info">
                            <span class="team-flag">${homeTeam.flag}</span>
                            <span class="team-name-text">${homeTeam.name}</span>
                        </div>
                        <span class="team-score"></span>
                    </div>
                    <div class="team-slot ${predictedWinner === awayCode && awayCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${awayCode}" style="cursor: pointer;">
                        <div class="team-slot-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            <span class="team-name-text">${awayTeam.name}</span>
                        </div>
                        <span class="team-score"></span>
                    </div>
                `;

                matchCard.querySelectorAll('.team-slot').forEach(slot => {
                    slot.addEventListener('click', () => {
                        const mId = parseInt(slot.getAttribute('data-match'));
                        const team = slot.getAttribute('data-team');
                        
                        if (!team || team === 'TBD') return;

                        p.bracketPicks[mId] = team;
                        if (mId === 32) {
                            p.champ = team;
                        }

                        propagateWinner(p, mId, team);
                        renderWizardBracket();
                    });
                });

                col.appendChild(matchCard);
            });
        }

        canvas.appendChild(col);
    });
    
    // Reactively update Wizard Next button lit/disabled state on pick selection changes
    updateWizardNextButtonState();
}

function updateSubmitButtonState() {
    const submitPicksBtn = document.getElementById('btn-submit-picks');
    const sidebarBtn = document.getElementById('sidebar-submit-btn');
    const leaderboardBtn = document.getElementById('leaderboard-submit-btn');

    // Button always says "Submit Picks" since once submitted, it's locked forever.
    let labelText = 'Submit Picks';
    const iconHtml = '<i class="fa-solid fa-cloud-arrow-up"></i>';

    // Sidebar and Leaderboard buttons are always fully active
    [sidebarBtn, leaderboardBtn].forEach(btn => {
        if (btn) {
            btn.innerHTML = `${iconHtml} <span>${labelText}</span>`;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.classList.add('glowing-btn');
        }
    });

    // Only show submit button inside Bracket Sheet tab when editing active draft
    if (submitPicksBtn) {
        if (STATE.activeBracketUser === 'draft') {
            submitPicksBtn.innerHTML = `${iconHtml} <span>Submit My Picks</span>`;
            submitPicksBtn.style.display = 'inline-flex';
            submitPicksBtn.classList.add('glowing-btn');
        } else {
            submitPicksBtn.style.display = 'none';
        }
    }
}

function populateUserDropdowns() {
    const selectBracket = document.getElementById('bracket-user-select');
    const selectGroup = document.getElementById('groups-user-select');
    if (!selectBracket || !selectGroup) return;

    const currentBracketVal = selectBracket.value || STATE.activeBracketUser;
    const currentGroupVal = selectGroup.value || STATE.activeGroupUser;

    selectBracket.innerHTML = '';
    selectGroup.innerHTML = '';

    // Helper to add the same option to both dropdowns
    const addOptionToBoth = (val, labelText) => {
        const opt1 = document.createElement('option');
        opt1.value = val;
        opt1.innerText = labelText;
        selectBracket.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = val;
        opt2.innerText = labelText;
        selectGroup.appendChild(opt2);
    };

    // 1. Add "🏆 Official Actuals" at the very top of both dropdowns
    if (STATE.participants.actuals) {
        addOptionToBoth('actuals', '🏆 Official Actuals');
    }

    // 2. Add all submitted entries in order
    for (const username in STATE.participants) {
        if (username === 'actuals' || username === 'draft') continue;
        const p = STATE.participants[username];
        addOptionToBoth(username, `👤 ${p.name} (Submitted)`);
    }

    // Restore values if available, else fallback to 'actuals'
    if (STATE.participants[currentBracketVal] && currentBracketVal !== 'draft') {
        selectBracket.value = currentBracketVal;
    } else {
        selectBracket.value = 'actuals';
        STATE.activeBracketUser = 'actuals';
    }

    if (STATE.participants[currentGroupVal] && currentGroupVal !== 'draft') {
        selectGroup.value = currentGroupVal;
    } else {
        selectGroup.value = 'actuals';
        STATE.activeGroupUser = 'actuals';
    }
}

function getPredictedAdvancers(username) {
    const p = STATE.participants[username];
    const list = [];
    if (!p || !p.groupStandings) return list;
    for (const group in p.groupStandings) {
        list.push(p.groupStandings[group][0]); // 1st
        list.push(p.groupStandings[group][1]); // 2nd
    }
    // Plus default best 3rd places
    for (let charCode = 65; charCode <= 72; charCode++) {
        const group = String.fromCharCode(charCode);
        if (p.groupStandings[group]) list.push(p.groupStandings[group][2]);
    }
    return list;
}

function setupDragScroll() {
    const mainBracketContainer = document.querySelector('#tab-bracket .bracket-scroll-container');
    const wizardBracketContainer = document.querySelector('.wizard-bracket-scroll-area .bracket-scroll-container');
    
    // Main bracket tab is read-only, allow dragging everywhere (including team slots)
    makeContainerDraggable(mainBracketContainer, false);
    // Wizard bracket selection is interactive, prevent dragging on team slots
    makeContainerDraggable(wizardBracketContainer, true);
}

function makeContainerDraggable(container, isInteractive = false) {
    if (!container) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        // Prevent triggering scroll if clicking buttons, selects, or sort buttons
        if (e.target.closest('.sort-btn') || e.target.closest('button') || e.target.closest('select')) {
            return;
        }
        // If interactive (wizard selector), also prevent drag scroll on team slots so click advances works cleanly
        if (isInteractive && e.target.closest('.team-slot')) {
            return;
        }
        
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        e.preventDefault(); // Enforce smooth drag-to-scroll without browser selection interference
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // scrolling speed multiplier
        container.scrollLeft = scrollLeft - walk;
    });
}

// Initialize on window load
window.addEventListener('load', init);
