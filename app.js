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
        { code: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
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
        { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
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

// 3. Complete State: Contains Official Simulated Outcomes & Friends Predictions
const STATE = {
    activeTab: 'leaderboard',
    activeBracketUser: 'user',   // Current user selected on Bracket Tab
    activeGroupUser: 'user',     // Current user selected on Groups Tab
    
    // The administrative actual outcomes of the World Cup
    officialResults: {
        matches: {}, // key: matchId (1 to 32), value: winningTeamCode
        goldenBoot: '', // Official Golden Boot winner code or string
        advancingTeams: [] // Explicit list of 32 teams who reached knockout stage
    },

    // User profiles & predicted selections (Brackets, Groups, Golden Boot)
    participants: {
        user: {
            name: "Ashish (You)",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ashish",
            goldenBoot: "Lionel Messi",
            champ: "ARG",
            groupStandings: {}, // Custom group ranks (Group: Array of codes)
            bracketPicks: {}    // Match predictions (matchId: winningTeamCode)
        },
        alex: {
            name: "Alex",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
            goldenBoot: "Kylian Mbappé",
            champ: "FRA",
            groupStandings: {},
            bracketPicks: {}
        },
        jordan: {
            name: "Jordan",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan",
            goldenBoot: "Vinícius Júnior",
            champ: "BRA",
            groupStandings: {},
            bracketPicks: {}
        },
        taylor: {
            name: "Taylor",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor",
            goldenBoot: "Harry Kane",
            champ: "ENG",
            groupStandings: {},
            bracketPicks: {}
        },
        morgan: {
            name: "Morgan",
            avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan",
            goldenBoot: "Erling Haaland",
            champ: "NOR",
            groupStandings: {},
            bracketPicks: {}
        }
    }
};

// 4. Progressive Point Constants
const POINTS_SCALE = {
    groupAdvancement: 5,   // Correct team to advance (Max 32 * 5 = 160 pts)
    roundOf32Winner: 10,   // R16 participants (Max 16 * 10 = 160 pts)
    roundOf16Winner: 20,   // QF participants (Max 8 * 20 = 160 pts)
    quarterfinalWinner: 40, // SF participants (Max 4 * 40 = 160 pts)
    semifinalWinner: 80,   // Finalists (Max 2 * 80 = 160 pts)
    thirdPlaceWinner: 40,  // Predict 3rd Place Match winner (Max 40 pts)
    finalWinner: 160,      // Predict World Cup Champion (Max 160 pts)
    goldenBoot: 100        // Predict the Golden Boot Winner (Max 100 pts)
};

// 5. Initialization: Load static configurations and pre-load mock predictions
function init() {
    setupTabListeners();
    setupDropdownListeners();
    setupAdminReset();
    setupThemeToggle();
    
    // Set default initial standings for all users
    for (const username in STATE.participants) {
        const user = STATE.participants[username];
        for (const group in GROUPS_DATA) {
            // By default, copy the static group order into their prediction state
            user.groupStandings[group] = GROUPS_DATA[group].map(t => t.code);
        }
        // Build the bracket based on default standings
        buildBracketFromStandings(username);
    }
    
    // Inject specific mock variants for friends so they don't have identical predictions
    populateMockFriendsPicks();

    // Set initial official admin results (some simulated match values)
    prepopulateSimulatedResults();
    
    // Initial Render of UI
    renderAll();
}

// Custom mock variants to make the leaderboard interesting
function populateMockFriendsPicks() {
    // Alex: heavily favors France, Germany, Belgium
    const alex = STATE.participants.alex;
    forceAdvance(alex, 'FRA', 32); // Finalist
    forceAdvance(alex, 'GER', 32); // Finalist
    alex.bracketPicks[32] = 'FRA'; // French Champion
    alex.champ = 'FRA';
    
    // Jordan: heavily favors Brazil, Spain, USA
    const jordan = STATE.participants.jordan;
    forceAdvance(jordan, 'BRA', 32);
    forceAdvance(jordan, 'ESP', 32);
    jordan.bracketPicks[32] = 'BRA'; // Brazil Champion
    jordan.champ = 'BRA';
    
    // Taylor: favors England, Portugal, Argentina
    const taylor = STATE.participants.taylor;
    forceAdvance(taylor, 'ENG', 32);
    forceAdvance(taylor, 'POR', 32);
    taylor.bracketPicks[32] = 'ENG'; // England Champion
    taylor.champ = 'ENG';
    
    // Morgan: favors Norway (Erling Haaland!), Netherlands
    const morgan = STATE.participants.morgan;
    forceAdvance(morgan, 'NOR', 32);
    forceAdvance(morgan, 'NED', 32);
    morgan.bracketPicks[32] = 'NOR'; // Norway Champion
    morgan.champ = 'NOR';

    // Ashish (You): Argentina Champion
    const user = STATE.participants.user;
    forceAdvance(user, 'ARG', 32);
    forceAdvance(user, 'BRA', 32);
    user.bracketPicks[32] = 'ARG';
    user.champ = 'ARG';
}

// Force a team to reach a specific match node for mock setups
function forceAdvance(participant, teamCode, matchId) {
    // Check backwards from the final matches and select the path
    participant.bracketPicks[matchId] = teamCode;
    const match = KNOCKOUTS_SCHEMA[matchId];
    if (match && match.round !== 'R32') {
        // Backtrace parent slots
        const previousRounds = Object.values(KNOCKOUTS_SCHEMA).filter(m => m.nextMatch === matchId);
        if (previousRounds.length > 0) {
            // Randomly or logically push through first slot
            forceAdvance(participant, teamCode, previousRounds[0].name.replace('M',''));
        }
    }
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
            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabName = button.getAttribute('data-tab');
            STATE.activeTab = tabName;

            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Dynamic header labels
            const titleMap = {
                leaderboard: { title: "Leaderboard Standings", desc: "Track scores, predictions, and real-time rank movements among friends." },
                bracket: { title: "Interactive Bracket Sheet", desc: "Toggle between participants to view predicted paths. Click teams to advance them." },
                groups: { title: "Group Standings Builder", desc: "Sort teams in groups A to L to populate the Round of 32 knockout grid." },
                admin: { title: "Admin Match Simulator", desc: "Enter official outcomes and award golden boot predictions to recalculate rankings." }
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
    });

    // Group standings user switcher
    document.getElementById('groups-user-select').addEventListener('change', (e) => {
        STATE.activeGroupUser = e.target.value;
        renderGroups();
    });

    // Group apply button
    document.getElementById('btn-save-standings').addEventListener('click', () => {
        buildBracketFromStandings(STATE.activeGroupUser);
        if (STATE.activeGroupUser === STATE.activeBracketUser) {
            renderBracket();
        }
        alert(`Standings applied to ${STATE.participants[STATE.activeGroupUser].name}'s bracket!`);
    });
}

function setupAdminReset() {
    document.getElementById('btn-reset-simulator').addEventListener('click', () => {
        STATE.officialResults.matches = {};
        STATE.officialResults.goldenBoot = '';
        document.getElementById('admin-golden-boot').value = '';
        renderAll();
    });

    document.getElementById('admin-golden-boot').addEventListener('change', (e) => {
        STATE.officialResults.goldenBoot = e.target.value;
        renderLeaderboard();
        renderUserBadge();
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
        const p = STATE.participants[username];
        let groupPts = 0;
        let koPts = 0;
        let bootPts = 0;

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

        // C. Golden Boot Prediction Verification
        if (results.goldenBoot && p.goldenBoot.trim().toLowerCase() === results.goldenBoot.trim().toLowerCase()) {
            bootPts += POINTS_SCALE.goldenBoot;
        }

        const totalScore = groupPts + koPts + bootPts;
        scoredList.push({
            id: username,
            name: p.name,
            avatar: p.avatar,
            champ: getTeamByCode(p.champ),
            goldenBoot: p.goldenBoot,
            groupPts,
            koPts,
            bootPts,
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

// 8. Render Leaderboard & Podium Ranks
function renderLeaderboard() {
    const scores = calculateParticipantScores();
    renderPodium(scores.slice(0, 3));
    renderRankingsTable(scores);
    renderUserBadge(scores);
}

function renderUserBadge(scores) {
    if (!scores) scores = calculateParticipantScores();
    const myRank = scores.findIndex(s => s.id === 'user') + 1;
    const myScore = scores.find(s => s.id === 'user').totalScore;
    
    // Add ordinal suffix (1st, 2nd, 3rd...)
    const ordinal = (n) => n + (['st', 'nd', 'rd'][((n + 90) % 100 % 10 - 1)] || 'th');
    
    document.querySelector('.user-rank').innerText = `${ordinal(myRank)} Place - ${myScore} Pts`;
}

function renderPodium(top3) {
    const wrapper = document.getElementById('podium-wrapper');
    wrapper.innerHTML = '';

    const podiumOrder = [1, 0, 2]; // Render 2nd place first, then 1st, then 3rd for proper standard visual structure

    podiumOrder.forEach(idx => {
        const player = top3[idx];
        if (!player) return;

        const rankNumber = idx + 1;
        const podiumCard = document.createElement('div');
        podiumCard.className = `podium-card rank-${rankNumber}`;

        podiumCard.innerHTML = `
            ${rankNumber === 1 ? '<i class="fa-solid fa-crown crown-badge"></i>' : ''}
            <img src="${player.avatar}" alt="${player.name}" class="podium-avatar">
            <span class="podium-name">${player.name}</span>
            <span class="badge badge-gold">${player.champ.flag} ${player.champ.code}</span>
            <span class="podium-points">${player.totalScore} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted)">pts</span></span>
            <span class="podium-meta">Boot: ${player.goldenBoot}</span>
            <div class="podium-number">${rankNumber}</div>
        `;
        wrapper.appendChild(podiumCard);
    });
}

function renderRankingsTable(scores) {
    const tbody = document.getElementById('leaderboard-rows');
    tbody.innerHTML = '';

    scores.forEach((player, index) => {
        const tr = document.createElement('tr');
        if (player.id === 'user') tr.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';

        tr.innerHTML = `
            <td>
                <div class="rank-badge">${index + 1}</div>
            </td>
            <td>
                <div class="player-cell">
                    <img src="${player.avatar}" alt="" class="player-avatar">
                    <span class="player-name">${player.name}</span>
                </div>
            </td>
            <td>
                <span class="badge badge-info">${player.champ.flag} ${player.champ.name}</span>
            </td>
            <td>
                <span class="badge badge-warning"><i class="fa-solid fa-shoe-prints"></i> ${player.goldenBoot}</span>
            </td>
            <td class="text-center font-heading">${player.groupPts} <span style="font-size:0.75rem; color:var(--text-dark)">/160</span></td>
            <td class="text-center font-heading">${player.koPts} <span style="font-size:0.75rem; color:var(--text-dark)">/840</span></td>
            <td class="text-center font-heading">${player.bootPts} <span style="font-size:0.75rem; color:var(--text-dark)">/100</span></td>
            <td class="text-right points-emphasis">${player.totalScore} Pts</td>
        `;
        tbody.appendChild(tr);
    });
}

// 9. Render Interactive Tournament Bracket Sheet
function renderBracket() {
    const canvas = document.getElementById('bracket-tree');
    canvas.innerHTML = '';

    const p = STATE.participants[STATE.activeBracketUser];
    const results = STATE.officialResults;

    // Define the rounds columns to draw
    const roundsList = [
        { key: 'R32', title: 'Round of 32', matches: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
        { key: 'R16', title: 'Round of 16', matches: [17, 18, 19, 20, 21, 22, 23, 24] },
        { key: 'QF', title: 'Quarterfinals', matches: [25, 26, 27, 28] },
        { key: 'SF', title: 'Semifinals', matches: [29, 30] },
        { key: 'F', title: 'Finals & 3rd', matches: [32, 31] }, // Render Final above 3rd Place Match
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
        } else {
            round.matches.forEach(matchId => {
                const matchSchema = KNOCKOUTS_SCHEMA[matchId];
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';

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
                    <div class="team-slot ${predictedWinner === homeCode && homeCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${homeCode}">
                        <div class="team-slot-info">
                            <span class="team-flag">${homeTeam.flag}</span>
                            <span class="team-name-text">${homeTeam.name}</span>
                        </div>
                        <span class="team-score">${homeCode && officialWinner === homeCode ? '<i class="fa-solid fa-circle-check"></i>' : ''}</span>
                    </div>
                    <div class="team-slot ${predictedWinner === awayCode && awayCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${awayCode}">
                        <div class="team-slot-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            <span class="team-name-text">${awayTeam.name}</span>
                        </div>
                        <span class="team-score">${awayCode && officialWinner === awayCode ? '<i class="fa-solid fa-circle-check"></i>' : ''}</span>
                    </div>
                `;

                // Set interactive click event for advancement selection
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

                col.appendChild(matchCard);
            });
        }

        canvas.appendChild(col);
    });
}

// Logic to pull which team code occupies a home/away knockout slot based on user's parent predictions
function getKnockoutParticipant(participant, matchId, slot) {
    const schema = KNOCKOUTS_SCHEMA[matchId];
    if (schema.round === 'R32') {
        return slot === 'home' ? schema.homeTeamCode || schema.defaultHome : slot === 'away' ? schema.awayTeamCode || schema.defaultAway;
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
    const nextSlot = schema.slot;

    // Check if the participant's prediction for the next round is invalid
    const nextPick = participant.bracketPicks[nextId];
    if (nextPick && nextPick !== teamCode) {
        // Clear all subsequent nodes that match the old parent
        clearChildMatchPicks(participant, nextId, nextPick);
    }
    
    // Automatically advance team to next round slot
    // Wait: we don't force automatic advancement to avoid confusing user, but standard bracket builders do force it. Let's do it! It's premium.
    // If the next slot is empty, or has an invalid selection, auto-advance it!
    participant.bracketPicks[nextId] = teamCode;
    if (nextId === 32) participant.champ = teamCode;

    propagateWinner(participant, nextId, teamCode);
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

    const p = STATE.participants[STATE.activeGroupUser];

    for (const groupName in GROUPS_DATA) {
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';

        const orderedCodes = p.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
        
        let teamRowsHtml = '';
        orderedCodes.forEach((code, index) => {
            const team = getTeamByCode(code);
            teamRowsHtml += `
                <div class="draggable-team-row" data-group="${groupName}" data-code="${code}" data-idx="${index}">
                    <div class="team-row-left">
                        <div class="team-position-marker">${index + 1}</div>
                        <span class="team-flag">${team.flag}</span>
                        <span>${team.name}</span>
                    </div>
                    <div class="team-sort-actions">
                        <button class="sort-btn btn-up" onclick="moveTeam('${groupName}', ${index}, -1)"><i class="fa-solid fa-chevron-up"></i></button>
                        <button class="sort-btn btn-down" onclick="moveTeam('${groupName}', ${index}, 1)"><i class="fa-solid fa-chevron-down"></i></button>
                    </div>
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

// Interactive arrow clicks to sort team standings rows
window.moveTeam = function(groupName, currentIndex, direction) {
    const p = STATE.participants[STATE.activeGroupUser];
    const standings = p.groupStandings[groupName];
    
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= standings.length) return;

    // Swap elements
    const temp = standings[currentIndex];
    standings[currentIndex] = standings[targetIndex];
    standings[targetIndex] = temp;

    renderGroups();
};

// Map standings choices to Round of 32 slots when save is clicked
function buildBracketFromStandings(username) {
    const p = STATE.participants[username];
    
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

    // Mirror updates inside participant's bracket prediction object
    p.bracketPicks[1] = p.bracketPicks[1] || KNOCKOUTS_SCHEMA[1].homeTeamCode;
    p.bracketPicks[2] = p.bracketPicks[2] || KNOCKOUTS_SCHEMA[2].homeTeamCode;
}

// 11. Render Admin simulator matches panel
function renderAdminSimulator() {
    const listContainer = document.getElementById('admin-simulator-matches');
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

        // Pull simulated team options (Uses Ashish's current view brackets as structural option references)
        const homeCode = getKnockoutParticipant(STATE.participants.user, matchId, 'home');
        const awayCode = getKnockoutParticipant(STATE.participants.user, matchId, 'away');
        
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
                    // Clicking same team twice resets the match result
                    delete results.matches[mid];
                } else {
                    results.matches[mid] = team;
                }

                renderLeaderboard();
                renderBracket();
                renderAdminSimulator();
                updateSimStats();
            });
        });

        listContainer.appendChild(row);
    }

    updateSimStats();
}

function updateSimStats() {
    const results = STATE.officialResults;
    const matchesSimulated = Object.keys(results.matches).length;
    document.getElementById('sim-matches-played').innerText = `${matchesSimulated} / 34`;

    const scores = calculateParticipantScores();
    const highest = scores[0] ? scores[0].totalScore : 0;
    document.getElementById('sim-highest-score').innerText = `${highest} pts`;
}

// Return advancing list for group standings
function getPredictedAdvancers(username) {
    const p = STATE.participants[username];
    const list = [];
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

// Initialize on window load
window.addEventListener('load', init);
