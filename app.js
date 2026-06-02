// World Cup 2026 Bracket Pool Core Engine

// Supabase Client Initialization — Lazy pattern to handle CDN race conditions
const SUPABASE_URL = 'https://ovfmmszhlkedypfveyxj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oEuZ2NtTLNBineH2ae8gaQ_ud-Fi2vE';
let _db = null;
let _cloudSyncStarted = false;
let _cloudPollTimer = null;
let _cloudSyncChannel = null;
const CLOUD_POLL_INTERVAL_MS = 8000;
let _lastCloudSyncOk = false;

/** Stripe entry fee — set required: false only for local dev without Edge Functions */
const PAYMENT_CONFIG = {
    required: true,
    entryFeeDisplay: '$0.05',
    productLabel: "Ash's WC Tourney Pool Entry",
};

const WIZARD_PAYMENT_STEP = 6;

/**
 * Lazy Supabase client getter. Retries initialization on every call
 * so the CDN script has time to load even if it wasn't ready at parse time.
 */
function getDb() {
    if (_db) return _db;
    try {
        if (window.supabase && window.supabase.createClient) {
            _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('☁️ Supabase client initialized successfully');
        }
    } catch(e) {
        console.warn('☁️ Supabase SDK initialization failed:', e);
    }
    return _db;
}

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
    if (!code) return { code: '', name: 'TBD', flag: '' };
    for (const group in GROUPS_DATA) {
        const team = GROUPS_DATA[group].find(t => t.code === code);
        if (team) return { code: team.code, name: team.name, flag: '' };
    }
    return { code: code, name: code, flag: '' };
}

function isTbdLabel(text) {
    if (text === undefined || text === null || text === '') return true;
    return String(text).trim().toUpperCase() === 'TBD';
}

const WIZARD_UNPICKED_LABEL = 'Please choose';

/** Bracket sheet: red prominent TBD when slot is unfilled */
function teamNameSpanHtml(name) {
    const label = name || 'TBD';
    if (isTbdLabel(label)) {
        return '<span class="team-name-text team-tbd">TBD</span>';
    }
    const safe = String(label)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<span class="team-name-text">${safe}</span>`;
}

/** Submit picks wizard only: same styling, different copy */
function wizardTeamNameSpanHtml(name) {
    const label = name || 'TBD';
    if (isTbdLabel(label)) {
        return `<span class="team-name-text team-tbd">${WIZARD_UNPICKED_LABEL}</span>`;
    }
    const safe = String(label)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<span class="team-name-text">${safe}</span>`;
}

function setWizardReviewAward(el, team, hasPick) {
    if (!el) return;
    if (!hasPick || isTbdLabel(team?.name)) {
        el.innerHTML = `<span class="team-tbd">${WIZARD_UNPICKED_LABEL}</span>`;
        el.classList.add('has-tbd');
    } else {
        el.textContent = `${team.flag} ${team.name}`.trim();
        el.classList.remove('has-tbd');
    }
}

/** Champion, silver (final loser), and bronze (3rd-place match winner) from bracket picks */
function getPredictedMedalists(p) {
    const champCode = p.champ || p.bracketPicks[32] || '';
    const homeCode32 = getKnockoutParticipant(p, 32, 'home');
    const awayCode32 = getKnockoutParticipant(p, 32, 'away');
    let silverCode = '';
    if (champCode && homeCode32 && awayCode32) {
        silverCode = champCode === homeCode32 ? awayCode32 : homeCode32;
    }
    const bronzeCode = p.bracketPicks[31] || '';
    return {
        champ: getTeamByCode(champCode),
        silver: getTeamByCode(silverCode),
        bronze: getTeamByCode(bronzeCode)
    };
}

function leaderboardPredictionBadge(team) {
    const t = team || getTeamByCode('');
    if (!t.code || isTbdLabel(t.name)) {
        return '<span class="badge badge-medal-tbd">TBD</span>';
    }
    return `<span class="badge badge-info">${t.flag} ${t.name}</span>`;
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
        advancingTeams: [], // Explicit list of 32 teams who reached knockout stage
        groupScoringActive: true, // Admin toggle: group column on leaderboard (max 160)
        stripePaymentRequired: true // Admin toggle: wizard step 6 + Stripe checkout
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
async function init() {
    setupTabListeners();
    setupDropdownListeners();
    setupAdminReset();
    setupAdminGroupScoringToggle();
    setupAdminStripePaymentToggle();
    setupThemeToggle();
    setupDragScroll();
    setupBracketConnectorSync();
    
    // Local-only: draft, official actuals cache, theme — NOT other people's picks
    loadStateFromStorage();
    setupOnboarding();
    ensureStandardStandings();

    if (!localStorage.getItem('wc-official-results')) {
        prepopulateSimulatedResults();
    }

    // Show cached pool immediately (helps desktop browsers with stale tabs)
    loadSubmissionsFromLocalCache();
    populateUserDropdowns();
    renderAll();

    setupCloudSyncControls();
    updateCloudSyncBanner('loading');

    // Global pool from Supabase (overwrites cache when successful)
    await refreshFromCloudAndRender();

    setupCloudSync();

    if (!_lastCloudSyncOk) {
        scheduleCloudRetries();
    }

    handlePaymentReturn();
}

function setupCloudSyncControls() {
    /* Sidebar sync chip removed; cloud refresh runs automatically */
}

function scheduleCloudRetries() {
    setupCloudSync();
    [2000, 5000, 12000].forEach((delay) => {
        setTimeout(async () => {
            if (_lastCloudSyncOk) return;
            await refreshFromCloudAndRender();
        }, delay);
    });
}

function updateCloudSyncBanner(mode) {
    const label = document.getElementById('sync-status-label');
    const pulse = document.getElementById('sync-pulse');
    const statusRow = pulse?.closest('.status-row');

    if (label) {
        if (mode === 'ok') label.textContent = 'Live global pool';
        else if (mode === 'loading') label.textContent = 'Connecting…';
        else label.textContent = 'Offline / cached';
    }
    if (statusRow) {
        statusRow.classList.toggle('sync-error-row', mode === 'error' || mode === 'warn');
    }
}

/** Load last known global pool from this browser (fallback when cloud fetch fails) */
function loadSubmissionsFromLocalCache() {
    const saved = localStorage.getItem('wc-submissions');
    if (!saved) return 0;
    let subs;
    try {
        subs = JSON.parse(saved);
    } catch {
        return 0;
    }
    if (!Array.isArray(subs)) return 0;

    let count = 0;
    subs.forEach(sub => {
        const parsed = parseSubmissionRow({ id: sub.id, data: sub });
        if (!parsed) return;
        STATE.participants[parsed.id] = parsed;
        count++;
    });
    return count;
}

/** Fetch submissions via REST when supabase-js client fails (common with cache/ad blockers) */
async function fetchSubmissionsViaRest() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?select=*`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`REST ${res.status}: ${body}`);
    }
    return res.json();
}

/** Parse JSONB/string participant payload from a Supabase row */
function parseSubmissionRow(row) {
    if (!row) return null;
    let sub = row.data !== undefined ? row.data : row;
    if (typeof sub === 'string') {
        try {
            sub = JSON.parse(sub);
        } catch {
            return null;
        }
    }
    const id = sub.id || row.id;
    if (!id || id === 'actuals' || id === 'draft') return null;
    // Every row in the shared submissions table is a public pool entry
    return {
        ...sub,
        id,
        submitted: true,
        name: sub.name || id,
        groupStandings: sub.groupStandings || {},
        selectedThirds: sub.selectedThirds || [],
        bracketPicks: sub.bracketPicks || {},
        champ: sub.champ || ''
    };
}

/** All locked submissions currently in the global pool (sorted by display name) */
function getGlobalSubmissionEntries() {
    return Object.keys(STATE.participants)
        .filter(id => id !== 'draft' && id !== 'actuals')
        .map(id => STATE.participants[id])
        .filter(p => p && p.submitted !== false)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
}

/**
 * Replace the in-memory global pool with exactly what is in Supabase.
 * Called on every successful fetch so all visitors see the same list.
 */
function applySubmissionsFromCloud(subsData) {
    for (const username of Object.keys(STATE.participants)) {
        if (username !== 'draft' && username !== 'actuals') {
            delete STATE.participants[username];
        }
    }

    const applied = [];
    subsData.forEach(row => {
        const sub = parseSubmissionRow(row);
        if (!sub) return;
        STATE.participants[sub.id] = sub;
        applied.push(sub);
    });

    localStorage.setItem('wc-submissions', JSON.stringify(applied));
    return applied.length;
}

function isGroupScoringActive() {
    return STATE.officialResults.groupScoringActive !== false;
}

function isStripePaymentRequired() {
    return PAYMENT_CONFIG.required && STATE.officialResults.stripePaymentRequired !== false;
}

function getOfficialResultsPayload() {
    return {
        matches: STATE.officialResults.matches,
        advancingTeams: STATE.officialResults.advancingTeams,
        groupScoringActive: isGroupScoringActive(),
        stripePaymentRequired: STATE.officialResults.stripePaymentRequired !== false,
        groupStandings: STATE.participants.actuals ? STATE.participants.actuals.groupStandings : {},
        selectedThirds: STATE.participants.actuals ? STATE.participants.actuals.selectedThirds : []
    };
}

function applyOfficialResultsFields(parsed) {
    STATE.officialResults.matches = parsed.matches || {};
    STATE.officialResults.advancingTeams = parsed.advancingTeams || [];
    STATE.officialResults.groupScoringActive = parsed.groupScoringActive !== false;
    STATE.officialResults.stripePaymentRequired = parsed.stripePaymentRequired !== false;
    if (parsed.groupStandings && STATE.participants.actuals) {
        STATE.participants.actuals.groupStandings = parsed.groupStandings;
    }
    if (parsed.selectedThirds && STATE.participants.actuals) {
        STATE.participants.actuals.selectedThirds = parsed.selectedThirds;
    }
}

function applyOfficialResultsFromCloud(resData) {
    if (!resData || !resData.data) return false;
    let parsed = resData.data;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            return false;
        }
    }
    applyOfficialResultsFields(parsed);
    localStorage.setItem('wc-official-results', JSON.stringify(getOfficialResultsPayload()));
    syncGroupScoringToggleUI();
    syncStripePaymentToggleUI();
    syncWizardPaymentUI();
    return true;
}

/** Pull latest global pool from Supabase; returns true if submissions fetch succeeded */
async function loadStateFromCloud() {
    let submissionsOk = false;

    try {
        let subsData = null;
        const db = getDb();

        if (db) {
            const { data, error } = await db.from('submissions').select('*');
            if (error) throw error;
            subsData = data;
        } else {
            throw new Error('Supabase SDK not loaded');
        }

        if (subsData && Array.isArray(subsData)) {
            const count = applySubmissionsFromCloud(subsData);
            console.log(`☁️ Loaded ${count} global submission(s) via Supabase client`);
            submissionsOk = true;
        }
    } catch (clientErr) {
        console.warn('☁️ Supabase client fetch failed, trying REST fallback:', clientErr);
        try {
            const subsData = await fetchSubmissionsViaRest();
            if (Array.isArray(subsData)) {
                const count = applySubmissionsFromCloud(subsData);
                console.log(`☁️ Loaded ${count} global submission(s) via REST fallback`);
                submissionsOk = true;
            }
        } catch (restErr) {
            console.warn('☁️ REST fallback failed:', restErr);
        }
    }

    if (!submissionsOk) {
        const cached = loadSubmissionsFromLocalCache();
        console.warn(`☁️ Using local cache: ${cached} submission(s)`);
    }

    const db = getDb();
    if (db) {
        try {
            const { data: resData, error: resError } = await db
                .from('official_results')
                .select('*')
                .eq('id', 'current')
                .maybeSingle();

            if (!resError && applyOfficialResultsFromCloud(resData)) {
                /* official results updated */
            }
        } catch (err) {
            console.warn('☁️ Cloud sync - official results fetch failed:', err);
        }
    }

    _lastCloudSyncOk = submissionsOk;
    return submissionsOk;
}

async function refreshFromCloudAndRender() {
    const ok = await loadStateFromCloud();
    const count = getGlobalSubmissionEntries().length;

    if (ok) {
        updateCloudSyncBanner('ok');
    } else if (count > 0) {
        updateCloudSyncBanner('warn');
    } else {
        updateCloudSyncBanner('error');
    }

    ensureStandardStandings();
    syncGroupScoringToggleUI();
    syncStripePaymentToggleUI();
    syncWizardPaymentUI();
    populateUserDropdowns();
    renderAll();
    updateActivePlayersCount();
}

function setupCloudSync() {
    if (_cloudSyncStarted) return;
    _cloudSyncStarted = true;

    if (_cloudPollTimer) clearInterval(_cloudPollTimer);
    _cloudPollTimer = setInterval(() => {
        refreshFromCloudAndRender().catch(err =>
            console.warn('☁️ Periodic cloud refresh failed:', err)
        );
    }, CLOUD_POLL_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshFromCloudAndRender().catch(err =>
                console.warn('☁️ Visibility cloud refresh failed:', err)
            );
        }
    });

    const db = getDb();
    if (!db) return;

    try {
        if (_cloudSyncChannel) {
            db.removeChannel(_cloudSyncChannel);
        }
        _cloudSyncChannel = db
            .channel('wc-pool-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'submissions' },
                () => refreshFromCloudAndRender()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'official_results' },
                () => refreshFromCloudAndRender()
            )
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    console.log('☁️ Realtime global pool sync active');
                }
            });
    } catch (err) {
        console.warn('☁️ Realtime subscribe failed (polling still active):', err);
    }
}

async function deleteParticipantFromCloud(participantId) {
    const db = getDb();
    if (!db) return false;
    try {
        const { error } = await db.from('submissions').delete().eq('id', participantId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('❌ Failed to delete submission from cloud:', err);
        return false;
    }
}

function ensureStandardStandings() {
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
}

function loadStateFromStorage() {
    // 1. Load official results first if they exist
    const savedResults = localStorage.getItem('wc-official-results');
    let loadedGroupStandings = null;
    let loadedSelectedThirds = null;
    if (savedResults) {
        const parsed = JSON.parse(savedResults);
        STATE.officialResults.matches = parsed.matches || {};
        STATE.officialResults.advancingTeams = parsed.advancingTeams || [];
        STATE.officialResults.groupScoringActive = parsed.groupScoringActive !== false;
        STATE.officialResults.stripePaymentRequired = parsed.stripePaymentRequired !== false;
        loadedGroupStandings = parsed.groupStandings || null;
        loadedSelectedThirds = parsed.selectedThirds || null;
    }

    // Initialize official actuals profile
    STATE.participants.actuals = {
        id: 'actuals',
        name: 'Official Actuals',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FIFA',
        champ: '',
        groupStandings: {},
        selectedThirds: loadedSelectedThirds || [],
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

    // Submissions are NOT loaded from localStorage — only from Supabase (see loadStateFromCloud).
    // wc-submissions is a write-through cache updated after each cloud fetch.

    // 2. Load draft or initialize a fresh one
    const savedDraft = localStorage.getItem('wc-draft');
    if (savedDraft) {
        STATE.participants.draft = JSON.parse(savedDraft);
    } else {
        resetDraft();
    }
}

async function saveStateToCloud() {
    const db = getDb();
    if (!db) {
        console.warn('☁️ Supabase client not available — skipping cloud sync');
        return false;
    }

    try {
        // 1. Save participant submissions
        let syncCount = 0;
        let lastError = null;
        for (const username in STATE.participants) {
            if (username !== 'draft' && username !== 'actuals' && STATE.participants[username].submitted) {
                const participant = STATE.participants[username];
                
                // upsert the submission (uses id as primary key)
                const { error } = await db
                    .from('submissions')
                    .upsert(
                        { id: participant.id, data: participant },
                        { onConflict: 'id' }
                    );
                    
                if (error) {
                    console.error(`❌ Failed to sync submission for ${username}:`, error);
                    lastError = error;
                } else {
                    syncCount++;
                }
            }
        }
        if (syncCount > 0) console.log(`☁️ Synced ${syncCount} submission(s) to Supabase`);

        // 2. Save official results
        const official = getOfficialResultsPayload();
        
        const { error } = await db
            .from('official_results')
            .upsert({ id: 'current', data: official }, { onConflict: 'id' });
            
        if (error) {
            console.error('❌ Failed to sync official results:', error);
            lastError = error;
        }

        return !lastError;
    } catch (err) {
        console.error('❌ Failed to sync to cloud:', err);
        return false;
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
    localStorage.setItem('wc-official-results', JSON.stringify(getOfficialResultsPayload()));

    // Centralized trigger: Sync all state asynchronously in the background (non-blocking)
    saveStateToCloud().catch(err => console.warn('Cloud sync error:', err));
}

function resetDraft() {
    STATE.participants.draft = {
        id: 'draft',
        name: 'Guest Player',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest',
        champ: '',
        groupStandings: {},
        selectedThirds: [],
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

/** Scroll only the bottom nav strip — never use scrollIntoView (breaks fixed mobile nav). */
function scrollMobileNavTabIntoView(tabName) {
    const navMenu = document.querySelector('.sidebar .nav-menu');
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (!navMenu || !activeNav) return;

    const targetLeft = activeNav.offsetLeft - (navMenu.clientWidth / 2) + (activeNav.offsetWidth / 2);
    navMenu.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth'
    });
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

            if (window.matchMedia('(max-width: 768px)').matches) {
                window.scrollTo(0, 0);
                scrollMobileNavTabIntoView(tabName);
            }

            // Dynamic header labels
            const titleMap = {
                leaderboard: { title: "Leaderboard Standings", desc: "Track scores, predictions, and real-time rank movements among friends." },
                bracket: { title: "Knock-Out Stages View", desc: "Use the dropdown to view different knock-out stages selections." },
                groups: { title: "Group Stages Viewer", desc: "Use the dropdown to view different group stages selections." },
                points: { title: "Points Outline", desc: "Understand how points are scored for your predictions." },
                admin: { title: "Admin Control Panel", desc: "Enter official outcomes to recalculate rankings." }
            };
            
            document.getElementById('current-tab-title').innerText = titleMap[tabName].title;
            document.getElementById('current-tab-desc').innerText = titleMap[tabName].desc;

            // Fresh global pool when switching tabs
            refreshFromCloudAndRender().catch(err =>
                console.warn('☁️ Tab switch cloud refresh failed:', err)
            );

            if (tabName === 'bracket') {
                ensureBracketSheetScrollReady();
            }
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

function syncGroupScoringToggleUI() {
    const active = isGroupScoringActive();
    const btnActive = document.getElementById('btn-group-scoring-active');
    const btnInactive = document.getElementById('btn-group-scoring-inactive');
    const statusEl = document.getElementById('group-scoring-status-text');

    btnActive?.classList.toggle('active', active);
    btnInactive?.classList.toggle('active', !active);
    if (statusEl) {
        statusEl.textContent = active
            ? 'Group points are counting toward total scores.'
            : "'Inactive' = Group (160) shows 0 for everyone.";
    }
}

function setGroupScoringActive(active) {
    STATE.officialResults.groupScoringActive = active;
    syncGroupScoringToggleUI();
    saveStateToStorage();
    renderLeaderboard();
}

function setupAdminGroupScoringToggle() {
    document.getElementById('btn-group-scoring-active')?.addEventListener('click', () => {
        setGroupScoringActive(true);
    });
    document.getElementById('btn-group-scoring-inactive')?.addEventListener('click', () => {
        setGroupScoringActive(false);
    });
    syncGroupScoringToggleUI();
}

function syncStripePaymentToggleUI() {
    const on = isStripePaymentRequired();
    document.getElementById('btn-stripe-payment-on')?.classList.toggle('active', on);
    document.getElementById('btn-stripe-payment-off')?.classList.toggle('active', !on);
    const statusEl = document.getElementById('stripe-payment-status-text');
    if (statusEl) {
        statusEl.textContent = on
            ? 'New entries must pay via Stripe before joining the pool.'
            : 'Submit picks skip payment and go straight to the leaderboard (testing / comp entries).';
    }
}

function syncWizardPaymentUI() {
    const on = isStripePaymentRequired();
    const hintEl = document.getElementById('wizard-review-payment-hint');
    if (hintEl) {
        hintEl.textContent = on
            ? 'Confirm your champion, silver, and bronze picks above. On the next step you will complete payment to lock your entry on the leaderboard.'
            : 'Confirm your champion, silver, and bronze picks above, then submit to add your entry to the leaderboard.';
    }
    const continueBtn = document.getElementById('btn-wizard-continue-payment');
    if (continueBtn) {
        continueBtn.innerHTML = on
            ? 'Continue to Payment <i class="fa-solid fa-chevron-right"></i>'
            : '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Entry';
    }
    document.querySelectorAll('.wizard-progress-tracker .progress-step[data-step="6"]').forEach((el) => {
        el.classList.toggle('progress-step-skipped', !on);
    });
}

async function advanceFromReviewStep() {
    if (isStripePaymentRequired()) {
        goToWizardStep(WIZARD_PAYMENT_STEP);
    } else {
        await submitWithoutPayment();
    }
}

function setStripePaymentRequired(required) {
    STATE.officialResults.stripePaymentRequired = required;
    syncStripePaymentToggleUI();
    syncWizardPaymentUI();
    saveStateToStorage();
}

function setupAdminStripePaymentToggle() {
    document.getElementById('btn-stripe-payment-on')?.addEventListener('click', () => {
        setStripePaymentRequired(true);
    });
    document.getElementById('btn-stripe-payment-off')?.addEventListener('click', () => {
        setStripePaymentRequired(false);
    });
    syncStripePaymentToggleUI();
    syncWizardPaymentUI();
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

    // Load initial preference from localStorage (default to dark mode)
    const savedTheme = localStorage.getItem('wc-theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        btn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
    } else {
        document.body.classList.add('dark-theme');
        btn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
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

    for (const p of getGlobalSubmissionEntries()) {
        const username = p.id;
        let groupPts = 0;
        let koPts = 0;

        // A. Group advancement verification (Top 2 from each group + best 8 third places)
        // Check how many of the participant's predicted advancing teams actually advanced
        if (isGroupScoringActive()) {
            const userAdvancers = getPredictedAdvancers(username);
            const actualAdvancers = results.advancingTeams || [];
            userAdvancers.forEach(team => {
                if (actualAdvancers.includes(team)) {
                    groupPts += POINTS_SCALE.groupAdvancement;
                }
            });
        }

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
        const medalists = getPredictedMedalists(p);
        scoredList.push({
            id: username,
            name: p.name,
            avatar: p.avatar,
            champ: medalists.champ,
            silver: medalists.silver,
            bronze: medalists.bronze,
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

    const count = getGlobalSubmissionEntries().length;
    countEl.innerText = String(count);
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
            <td colspan="10" class="text-center" style="padding: 4rem 1rem; color: var(--text-dark);">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.6; color: var(--accent-gold);">
                    <i class="fa-solid fa-users-slash"></i>
                </div>
                <div style="font-weight: 600; font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">
                    No Active Predictions Yet
                </div>
                <div style="font-size: 0.9rem; max-width: 440px; margin: 0 auto; line-height: 1.6; color: var(--text-dark);">
                    Be the first to submit your predictions! Use <strong>Submit Picks</strong> in the sidebar to submit your predictions to the leaderboard.
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
            <td>${leaderboardPredictionBadge(player.champ)}</td>
            <td>${leaderboardPredictionBadge(player.silver)}</td>
            <td>${leaderboardPredictionBadge(player.bronze)}</td>
            <td class="text-center font-heading">${!isGroupScoringActive()
                ? `<strong class="group-pts-inactive-zero">${player.groupPts}</strong>`
                : player.groupPts} <span style="font-size:0.75rem; color:var(--text-dark)">/160</span></td>
            <td class="text-center font-heading">${player.koPts} <span style="font-size:0.75rem; color:var(--text-dark)">/840</span></td>
            <td class="text-right points-emphasis">${player.totalScore} Pts</td>
        `;

        // Row click switches to the Bracket sheet view for this specific participant
        tr.addEventListener('click', () => {
            STATE.activeBracketUser = player.id;
            STATE.activeGroupUser = player.id;

            const bracketTabBtn = document.querySelector('.nav-item[data-tab="bracket"]');
            if (bracketTabBtn) {
                bracketTabBtn.click();
            }

            populateUserDropdowns();
            renderBracket();
            renderGroups();
            updateSubmitButtonState();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        tbody.appendChild(tr);
    });
}

let _bracketConnectorRaf = null;

function appendBracketVerticalConnector(matchCard, roundKey, matchIndex) {
    if (roundKey === 'F') return;
    matchCard.classList.add(matchIndex % 2 === 0 ? 'upper-pair-match' : 'lower-pair-match');
    const connector = document.createElement('div');
    connector.className = 'vertical-connector';
    connector.setAttribute('aria-hidden', 'true');
    matchCard.appendChild(connector);
}

function syncBracketVerticalConnectors(canvasEl) {
    if (!canvasEl) return;
    canvasEl.querySelectorAll('.round-column').forEach((col) => {
        col.querySelectorAll('.match-card.upper-pair-match').forEach((upper) => {
            const lower = upper.nextElementSibling;
            if (!lower?.classList.contains('lower-pair-match')) return;

            const upperConn = upper.querySelector('.vertical-connector');
            const lowerConn = lower.querySelector('.vertical-connector');
            if (!upperConn || !lowerConn) return;

            const upperMid = upper.offsetTop + upper.offsetHeight / 2;
            const lowerMid = lower.offsetTop + lower.offsetHeight / 2;
            const junction = (upperMid + lowerMid) / 2;

            upperConn.style.height = `${Math.max(1, junction - upperMid)}px`;
            upperConn.style.top = '50%';
            upperConn.style.bottom = 'auto';

            lowerConn.style.height = `${Math.max(1, lowerMid - junction)}px`;
            lowerConn.style.top = 'auto';
            lowerConn.style.bottom = '50%';
        });
    });
}

function scheduleBracketConnectorSync() {
    if (_bracketConnectorRaf) cancelAnimationFrame(_bracketConnectorRaf);
    _bracketConnectorRaf = requestAnimationFrame(() => {
        _bracketConnectorRaf = null;
        syncBracketVerticalConnectors(document.getElementById('bracket-tree'));
        syncBracketVerticalConnectors(document.getElementById('wizard-bracket-tree'));
    });
}

function setupBracketConnectorSync() {
    window.addEventListener('resize', scheduleBracketConnectorSync);
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
        { key: 'QF', title: 'Quarters', matches: [25, 26, 27, 28] },
        { key: 'SF', title: 'Semis', matches: [29, 30] },
        { key: 'F', title: 'Gold & Bronze', matches: [32, 31] }, 
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
                    ${teamNameSpanHtml(champTeam.name)}
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
                    ${teamNameSpanHtml(silverTeam.name)}
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
                    ${teamNameSpanHtml(bronzeTeam.name)}
                </div>
            `;
            col.appendChild(bronzeCard);
        } else {
            round.matches.forEach((matchId, idx) => {
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
                    <div class="team-slot ${predictedWinner === homeCode && homeCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${homeCode}" style="${p.submitted ? 'cursor: default !important;' : 'cursor: pointer;'}">
                        <div class="team-slot-info">
                            <span class="team-flag">${homeTeam.flag}</span>
                            ${teamNameSpanHtml(homeTeam.name)}
                        </div>
                        <span class="team-score">${homeCode && officialWinner === homeCode ? '<i class="fa-solid fa-circle-check"></i>' : ''}</span>
                    </div>
                    <div class="team-slot ${predictedWinner === awayCode && awayCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${awayCode}" style="${p.submitted ? 'cursor: default !important;' : 'cursor: pointer;'}">
                        <div class="team-slot-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            ${teamNameSpanHtml(awayTeam.name)}
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

                appendBracketVerticalConnector(matchCard, round.key, idx);
                col.appendChild(matchCard);
            });
        }

        canvas.appendChild(col);
    });

    scheduleBracketConnectorSync();
    ensureBracketSheetScrollReady();
}

function ensureBracketSheetScrollReady() {
    const container = document.querySelector('#tab-bracket .bracket-scroll-container');
    const canvas = document.getElementById('bracket-tree');
    if (!container || !canvas) return;

    requestAnimationFrame(() => {
        if (canvas.scrollWidth > container.clientWidth) {
            container.classList.add('has-horizontal-scroll');
        } else {
            container.classList.remove('has-horizontal-scroll');
        }
    });
}

// Logic to pull which team code occupies a home/away knockout slot based on user's parent predictions
function getKnockoutParticipant(participant, matchId, slot) {
    if (!participant || !participant.bracketPicks) return '';

    // If viewing official results and third-place choices are incomplete, force all R32 teams to TBD
    if (participant.isActuals && (!participant.selectedThirds || participant.selectedThirds.length < 8)) {
        if (KNOCKOUTS_SCHEMA[matchId].round === 'R32') {
            return '';
        }
    }

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

    // Invalidate and filter out selected third-place teams that are no longer 3rd place in their groups due to standings changes
    if (p.selectedThirds) {
        const currentThirds = groupThirds.map(item => item.code);
        const originalLen = p.selectedThirds.length;
        p.selectedThirds = p.selectedThirds.filter(code => currentThirds.includes(code));
        if (p.selectedThirds.length !== originalLen) {
            // Reset subsequent bracket picks since third-place participants changed
            resetSubsequentBracketPicks(p);
        }
    }

    // Determine 3rd place advancers based on user's selection, fallback to A-H defaults
    let selectedThirds = p.selectedThirds;
    if (!selectedThirds || selectedThirds.length !== 8) {
        selectedThirds = groupThirds.slice(0, 8).map(item => item.code);
    }

    KNOCKOUTS_SCHEMA[1].awayTeamCode = selectedThirds[0] || ''; // 1st choice
    KNOCKOUTS_SCHEMA[2].awayTeamCode = selectedThirds[1] || ''; // 2nd choice
    KNOCKOUTS_SCHEMA[7].awayTeamCode = selectedThirds[2] || ''; // 3rd choice
    KNOCKOUTS_SCHEMA[8].awayTeamCode = selectedThirds[3] || ''; // 4th choice
    KNOCKOUTS_SCHEMA[11].awayTeamCode = selectedThirds[4] || ''; // 5th choice
    KNOCKOUTS_SCHEMA[12].awayTeamCode = selectedThirds[5] || ''; // 6th choice
    KNOCKOUTS_SCHEMA[15].awayTeamCode = selectedThirds[6] || ''; // 7th choice
    KNOCKOUTS_SCHEMA[16].awayTeamCode = selectedThirds[7] || ''; // 8th choice
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
        
        const act = STATE.participants.actuals;
        if (!act.selectedThirds || act.selectedThirds.length < 8) {
            listContainer.innerHTML = `
                <div style="padding: 2.5rem 1.5rem; text-align: center; border: 1px dashed var(--card-border); border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.01); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem;">
                    <i class="fa-solid fa-lock" style="font-size: 2rem; color: var(--primary); opacity: 0.8;"></i>
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Rounds Simulation Locked</div>
                    <div style="font-size: 0.8rem; color: var(--text-dark); max-width: 320px; line-height: 1.5; margin: 0 auto;">
                        Please select exactly <strong>8 advancing third-place teams</strong> in the <strong>Final Top-8 3rd place Editor</strong> above to unlock official knockout rounds matches simulation.
                    </div>
                </div>
            `;
        } else {
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
                    });
                });

                listContainer.appendChild(row);
            }
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
        
        const globalEntries = getGlobalSubmissionEntries();
        let userCount = globalEntries.length;
        for (const p of globalEntries) {
            const username = p.id;
            
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
            
            userRow.querySelector('.delete-user-btn').addEventListener('click', async () => {
                if (confirm(`⚠️ Are you sure you want to permanently delete participant "${p.name}"?`)) {
                    const cloudDeleted = await deleteParticipantFromCloud(username);
                    delete STATE.participants[username];

                    if (STATE.activeBracketUser === username) STATE.activeBracketUser = 'actuals';
                    if (STATE.activeGroupUser === username) STATE.activeGroupUser = 'actuals';

                    saveStateToStorage();
                    populateUserDropdowns();
                    renderAll();
                    if (cloudDeleted) {
                        alert(`Removed "${p.name}" from the global pool.`);
                    } else {
                        alert(`Removed "${p.name}" locally. Cloud delete may have failed — refresh to confirm.`);
                    }
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

    // 2.5. Render Admin Top-8 3rd Place Editor
    const adminThirdsAvailable = document.getElementById('admin-thirds-available');
    const adminThirdsSelected = document.getElementById('admin-thirds-selected-slots');
    if (adminThirdsAvailable && adminThirdsSelected) {
        adminThirdsAvailable.innerHTML = '';
        adminThirdsSelected.innerHTML = '';
        
        const act = STATE.participants.actuals;
        if (act && act.groupStandings) {
            // Get the 3rd place team from each of the 12 groups A to L
            const allThirds = [];
            for (const groupName in GROUPS_DATA) {
                const standings = act.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
                const thirdPlaceCode = standings[2]; // 3rd place team
                const team = getTeamByCode(thirdPlaceCode);
                allThirds.push({ group: groupName, code: thirdPlaceCode, team: team });
            }

            if (!act.selectedThirds) {
                act.selectedThirds = [];
            }

            // Invalidate and filter out selected third-place teams that are no longer 3rd place in their groups due to standings changes
            const currentThirds = allThirds.map(item => item.code);
            const originalLen = act.selectedThirds.length;
            act.selectedThirds = act.selectedThirds.filter(code => currentThirds.includes(code));
            if (act.selectedThirds.length !== originalLen) {
                resetSubsequentBracketPicks(act);
                saveStateToStorage();
            }

            // Render available official 3rd place teams
            allThirds.forEach(item => {
                const isSelected = act.selectedThirds.includes(item.code);
                
                const card = document.createElement('div');
                card.className = `premium-card third-team-card ${isSelected ? 'selected' : ''}`;
                card.style = `
                    padding: 0.6rem 1rem;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: ${isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg-match)'};
                    border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--card-border)'};
                    opacity: ${isSelected ? '0.6' : '1'};
                    cursor: ${isSelected ? 'default' : 'pointer'};
                    transition: all 0.2s ease;
                    font-size: 0.8rem;
                `;
                card.innerHTML = `
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Group ${item.group}</span>
                        <span style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${item.team.name}</span>
                    </div>
                    ${!isSelected ? '<i class="fa-solid fa-plus-circle" style="color: var(--primary); font-size: 1rem;"></i>' : '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald); font-size: 1rem;"></i>'}
                `;

                if (!isSelected) {
                    card.addEventListener('click', () => {
                        if (act.selectedThirds.length >= 8) {
                            alert('You have already selected 8 teams! Please remove a team first to select another.');
                            return;
                        }
                        act.selectedThirds.push(item.code);
                        resetSubsequentBracketPicks(act);
                        buildBracketFromStandings('actuals');
                        saveStateToStorage();
                        renderAll();
                    });
                }
                adminThirdsAvailable.appendChild(card);
            });

            // Render selected 8 slots
            for (let i = 0; i < 8; i++) {
                const teamCode = act.selectedThirds[i];
                const slotEl = document.createElement('div');
                slotEl.style = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-sm);
                    transition: all 0.2s ease;
                    font-size: 0.8rem;
                `;

                if (teamCode) {
                    const team = getTeamByCode(teamCode);
                    const originItem = allThirds.find(item => item.code === teamCode);
                    const groupLabel = originItem ? `Group ${originItem.group}` : '';

                    slotEl.className = 'premium-card slot-card-selected';
                    slotEl.style.cssText += `
                        background: rgba(59, 130, 246, 0.04);
                        border: 1px solid var(--primary);
                    `;
                    
                    const isFirst = i === 0;
                    const isLast = i === act.selectedThirds.length - 1;

                    slotEl.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--primary); background: rgba(59, 130, 246, 0.1); width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">${i + 1}</span>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">${groupLabel}</span>
                                <span style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${team.name}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <div class="team-sort-actions" style="display: flex; gap: 0.15rem;">
                                <button class="sort-btn btn-up" style="padding: 0; height: 20px; width: 20px; display: inline-flex; align-items: center; justify-content: center;" onclick="moveAdminThird(${i}, -1); event.stopPropagation();" ${isFirst ? 'disabled style="opacity: 0.25; cursor: not-allowed;"' : ''}>
                                    <i class="fa-solid fa-chevron-up" style="font-size: 0.65rem;"></i>
                                </button>
                                <button class="sort-btn btn-down" style="padding: 0; height: 20px; width: 20px; display: inline-flex; align-items: center; justify-content: center;" onclick="moveAdminThird(${i}, 1); event.stopPropagation();" ${isLast ? 'disabled style="opacity: 0.25; cursor: not-allowed;"' : ''}>
                                    <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
                                </button>
                            </div>
                            <button class="sort-btn btn-remove" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--accent-crimson); padding: 0; height: 20px; width: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); cursor: pointer;" onclick="removeAdminThird(${i}); event.stopPropagation();">
                                <i class="fa-solid fa-circle-minus" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                    `;
                } else {
                    slotEl.className = 'slot-card-empty';
                    slotEl.style.cssText += `
                        background: transparent;
                        border: 1px dashed var(--card-border);
                        color: var(--text-dark);
                    `;
                    slotEl.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--text-dark); border: 1px dashed var(--card-border); width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">${i + 1}</span>
                            <span style="font-size: 0.72rem; font-style: italic;">Slot ${i + 1} Empty</span>
                        </div>
                    `;
                }
                adminThirdsSelected.appendChild(slotEl);
            }
        }
    }
}

async function callPaymentEdgeFunction(functionName, body) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
    });
    let data = {};
    try {
        data = await res.json();
    } catch {
        /* ignore */
    }
    if (!res.ok) {
        throw new Error(data.error || `Payment service error (${res.status})`);
    }
    return data;
}

function getPaymentReturnBaseUrl() {
    const url = new URL(window.location.href);
    let path = url.pathname || '/';
    if (path.endsWith('index.html')) {
        path = path.slice(0, -'index.html'.length) || '/';
    }
    return `${url.origin}${path}`;
}

function buildSubmissionFromDraft() {
    const draft = STATE.participants.draft;
    const subId = `sub_${Date.now()}`;
    return {
        id: subId,
        name: draft.name,
        avatar: draft.avatar,
        champ: draft.champ,
        groupStandings: JSON.parse(JSON.stringify(draft.groupStandings)),
        selectedThirds: JSON.parse(JSON.stringify(draft.selectedThirds || [])),
        bracketPicks: JSON.parse(JSON.stringify(draft.bracketPicks)),
        submitted: true,
        onboarded: true,
    };
}

function validateDraftReadyForPayment() {
    const draft = STATE.participants.draft;
    if (!draft.name?.trim()) {
        alert('Please enter your name on step 1.');
        goToWizardStep(1);
        return false;
    }
    if (!draft.selectedThirds || draft.selectedThirds.length !== 8) {
        alert('Please select exactly 8 third-place teams on step 3.');
        goToWizardStep(3);
        return false;
    }
    for (let i = 1; i <= 32; i++) {
        if (!draft.bracketPicks[i]) {
            alert(`Please complete all bracket picks (match ${i} is missing).`);
            goToWizardStep(4);
            return false;
        }
    }
    if (!draft.champ) {
        alert('Please pick a tournament champion on step 4.');
        goToWizardStep(4);
        return false;
    }
    return true;
}

async function startStripeCheckout() {
    if (!validateDraftReadyForPayment()) return;

    const payBtn = document.getElementById('btn-wizard-pay');
    const statusEl = document.getElementById('wizard-payment-status');
    const participant = buildSubmissionFromDraft();
    const base = getPaymentReturnBaseUrl();

    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Redirecting to Stripe…</span>';
    }
    if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = 'Preparing secure checkout…';
        statusEl.className = 'wizard-payment-status is-loading';
    }

    try {
        const data = await callPaymentEdgeFunction('create-checkout-session', {
            participant,
            submissionId: participant.id,
            successUrl: `${base}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${base}?payment=cancelled`,
        });

        sessionStorage.setItem('wc-pending-payment-id', data.pendingId);
        sessionStorage.setItem('wc-pending-submission-id', data.submissionId);
        saveStateToStorage();
        window.location.href = data.url;
    } catch (err) {
        console.error('Stripe checkout error:', err);
        if (statusEl) {
            statusEl.hidden = false;
            statusEl.className = 'wizard-payment-status is-error';
            statusEl.textContent =
                err.message ||
                'Payment is not available yet. Ask the pool admin to configure Stripe (see STRIPE_SETUP.md).';
        } else {
            alert(
                err.message ||
                    'Payment is not available yet. The admin needs to deploy Stripe Edge Functions (see STRIPE_SETUP.md in the repo).'
            );
        }
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="fa-brands fa-stripe"></i> <span>Pay &amp; Submit Entry</span>';
        }
    }
}

async function finalizePaidSubmission(submissionId, participantName) {
    await refreshFromCloudAndRender();
    STATE.activeBracketUser = submissionId;
    STATE.activeGroupUser = submissionId;
    resetDraft();
    saveStateToStorage();
    updateSubmitButtonState();

    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.remove('active');

    const leaderboardTabBtn = document.querySelector('.nav-item[data-tab="leaderboard"]');
    if (leaderboardTabBtn) leaderboardTabBtn.click();

    alert(
        `🎉 Payment received! Your predictions under "${participantName}" are locked in and on the leaderboard.`
    );
}

async function submitWithoutPayment() {
    if (!validateDraftReadyForPayment()) return;

    const newSubmission = buildSubmissionFromDraft();
    STATE.participants[newSubmission.id] = newSubmission;
    resetDraft();
    saveStateToStorage();
    const cloudSuccess = await saveStateToCloud();
    await refreshFromCloudAndRender();
    updateSubmitButtonState();

    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.remove('active');

    STATE.activeBracketUser = newSubmission.id;
    STATE.activeGroupUser = newSubmission.id;

    if (cloudSuccess) {
        alert(`🎉 Success! Your predictions under "${newSubmission.name}" are submitted and synced to the cloud!`);
    } else {
        alert(
            `✅ Your predictions under "${newSubmission.name}" are saved locally!\n\n⚠️ Cloud sync may have failed — try refreshing the page.`
        );
    }

    const leaderboardTabBtn = document.querySelector('.nav-item[data-tab="leaderboard"]');
    if (leaderboardTabBtn) leaderboardTabBtn.click();
}

async function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment') === 'cancelled') {
        window.history.replaceState({}, '', getPaymentReturnBaseUrl());
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            goToWizardStep(isStripePaymentRequired() ? WIZARD_PAYMENT_STEP : 5);
            modal.classList.add('active');
        }
        return;
    }

    if (params.get('payment') !== 'success') return;

    const sessionId = params.get('session_id');
    if (!sessionId) return;

    window.history.replaceState({}, '', getPaymentReturnBaseUrl());

    const statusEl = document.getElementById('wizard-payment-status');
    if (statusEl) {
        statusEl.hidden = false;
        statusEl.className = 'wizard-payment-status is-loading';
        statusEl.textContent = 'Confirming your payment…';
    }

    try {
        const result = await callPaymentEdgeFunction('verify-checkout-session', { sessionId });
        sessionStorage.removeItem('wc-pending-payment-id');
        sessionStorage.removeItem('wc-pending-submission-id');
        await finalizePaidSubmission(result.submissionId, result.participantName);
    } catch (err) {
        console.error('Payment verification error:', err);
        alert(
            `Payment received, but we could not confirm your entry yet.\n\n${err.message}\n\nPlease refresh in a minute or contact the pool admin with session ID: ${sessionId}`
        );
    }
}

function setupOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    const nameInput = document.getElementById('visitor-name');

    const sidebarBtn = document.getElementById('sidebar-submit-btn');
    const submitPicksBtn = document.getElementById('btn-submit-picks');
    
    const closeBtn = document.getElementById('btn-close-wizard');
    const backBtn = document.getElementById('btn-wizard-back');
    const nextBtn = document.getElementById('btn-wizard-next');
    const continuePaymentBtn = document.getElementById('btn-wizard-continue-payment');
    const payBtn = document.getElementById('btn-wizard-pay');

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
        nextBtn.addEventListener('click', async (e) => {
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
                // Group standings complete - proceed to 3rd places select
                goToWizardStep(3);
            } else if (step === 3) {
                // Validate 3rd places selection (exactly 8 chosen)
                const draft = STATE.participants.draft;
                if (!draft.selectedThirds || draft.selectedThirds.length !== 8) {
                    alert('Please select exactly 8 third-place teams to advance to the knockout rounds!');
                    return;
                }
                goToWizardStep(4);
            } else if (step === 4) {
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
                goToWizardStep(5);
            } else if (step === 5) {
                await advanceFromReviewStep();
            }
        });
    }

    if (continuePaymentBtn) {
        continuePaymentBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (STATE.wizardStep === 5) {
                await advanceFromReviewStep();
            }
        });
    }

    if (payBtn) {
        payBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isStripePaymentRequired()) {
                await startStripeCheckout();
            } else {
                await submitWithoutPayment();
            }
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
        wizardCard.classList.remove('step-1-active', 'step-5-active', 'step-6-active');
        if (step === 1) {
            wizardCard.classList.add('step-1-active');
        } else if (step === 5) {
            wizardCard.classList.add('step-5-active');
        } else if (step === WIZARD_PAYMENT_STEP) {
            wizardCard.classList.add('step-6-active');
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
        nextBtn.classList.toggle('wizard-nav-hidden', step === WIZARD_PAYMENT_STEP);
        if (step === 5) {
            if (isStripePaymentRequired()) {
                nextBtn.innerHTML = 'Continue to Payment <i class="fa-solid fa-chevron-right"></i>';
            } else {
                nextBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Entry';
            }
        } else {
            nextBtn.innerHTML = 'Next <i class="fa-solid fa-chevron-right"></i>';
        }
    }

    // Trigger step-specific renders or details binding
    if (step === 2) {
        renderWizardGroups();
    } else if (step === 3) {
        renderWizardThirds();
    } else if (step === 4) {
        renderWizardBracket();
    } else if (step === 5) {
        const draft = STATE.participants.draft;
        const champCode = draft.champ || '';
        const champTeam = getTeamByCode(champCode);
        
        setWizardReviewAward(document.getElementById('wizard-review-champ'), champTeam, !!champCode);

        // Silver is the loser of the Final Match (Match 32)
        const homeCode32 = getKnockoutParticipant(draft, 32, 'home');
        const awayCode32 = getKnockoutParticipant(draft, 32, 'away');
        let silverCode = '';
        if (champCode && homeCode32 && awayCode32) {
            silverCode = (champCode === homeCode32) ? awayCode32 : homeCode32;
        }
        const silverTeam = getTeamByCode(silverCode);
        setWizardReviewAward(
            document.getElementById('wizard-review-silver'),
            silverTeam,
            !!silverCode
        );

        // Bronze is the winner of 3rd Place (Match 31)
        const bronzeCode = draft.bracketPicks[31] || '';
        const bronzeTeam = getTeamByCode(bronzeCode);
        setWizardReviewAward(document.getElementById('wizard-review-bronze'), bronzeTeam, !!bronzeCode);
        syncWizardPaymentUI();
        if (nextBtn) {
            nextBtn.classList.remove('wizard-nav-hidden');
        }
    } else if (step === WIZARD_PAYMENT_STEP) {
        const draft = STATE.participants.draft;
        const amountEl = document.getElementById('wizard-payment-amount');
        const nameEl = document.getElementById('wizard-payment-name');
        const payBtn = document.getElementById('btn-wizard-pay');
        const statusEl = document.getElementById('wizard-payment-status');

        if (amountEl) amountEl.textContent = PAYMENT_CONFIG.entryFeeDisplay;
        if (nameEl) nameEl.textContent = draft.name || '—';
        if (payBtn) {
            payBtn.disabled = false;
            if (isStripePaymentRequired()) {
                payBtn.innerHTML = '<i class="fa-brands fa-stripe"></i> <span>Pay &amp; Submit Entry</span>';
            } else {
                payBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Submit Entry</span>';
            }
        }
        if (statusEl) {
            statusEl.hidden = true;
            statusEl.textContent = '';
            statusEl.className = 'wizard-payment-status';
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
        // Step 3 is 3rd places selection - exactly 8 chosen
        isEnabled = (draft.selectedThirds && draft.selectedThirds.length === 8);
    } else if (step === 4) {
        // Step 4 is bracket filling - all 32 bracket picks must be complete
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
        { key: 'QF', title: 'Quarters', matches: [25, 26, 27, 28] },
        { key: 'SF', title: 'Semis', matches: [29, 30] },
        { key: 'F', title: 'Gold & Bronze', matches: [32, 31] },
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
                    ${wizardTeamNameSpanHtml(champTeam.name)}
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
                    ${wizardTeamNameSpanHtml(silverTeam.name)}
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
                    ${wizardTeamNameSpanHtml(bronzeTeam.name)}
                </div>
            `;
            col.appendChild(bronzeCard);
        } else {
            round.matches.forEach((matchId, idx) => {
                const matchSchema = KNOCKOUTS_SCHEMA[matchId];
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';

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
                            ${wizardTeamNameSpanHtml(homeTeam.name)}
                        </div>
                        <span class="team-score"></span>
                    </div>
                    <div class="team-slot ${predictedWinner === awayCode && awayCode ? 'predicted-winner' : ''}" data-match="${matchId}" data-team="${awayCode}" style="cursor: pointer;">
                        <div class="team-slot-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            ${wizardTeamNameSpanHtml(awayTeam.name)}
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

                appendBracketVerticalConnector(matchCard, round.key, idx);
                col.appendChild(matchCard);
            });
        }

        canvas.appendChild(col);
    });

    scheduleBracketConnectorSync();
    
    // Reactively update Wizard Next button lit/disabled state on pick selection changes
    updateWizardNextButtonState();
}

function updateSubmitButtonState() {
    const submitPicksBtn = document.getElementById('btn-submit-picks');
    const sidebarBtn = document.getElementById('sidebar-submit-btn');

    // Button always says "Submit Picks" since once submitted, it's locked forever.
    let labelText = 'Submit Picks';
    const iconHtml = '<i class="fa-solid fa-cloud-arrow-up"></i>';

    if (sidebarBtn) {
        sidebarBtn.innerHTML = `${iconHtml} <span>${labelText}</span>`;
        sidebarBtn.disabled = false;
        sidebarBtn.style.opacity = '1';
        sidebarBtn.classList.add('glowing-btn');
    }

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

    // STATE is source of truth (old <select> value must not override a new pick from leaderboard, etc.)
    const currentBracketVal = STATE.activeBracketUser;
    const currentGroupVal = STATE.activeGroupUser;

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

    // 2. All global pool submissions (everyone sees everyone in these dropdowns)
    for (const p of getGlobalSubmissionEntries()) {
        addOptionToBoth(p.id, `👤 ${p.name}`);
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

    makeContainerDraggable(mainBracketContainer, { protectPickableTeamSlots: true });
    makeContainerDraggable(wizardBracketContainer, { protectPickableTeamSlots: true });
}

function isPickableTeamSlotTarget(target) {
    const slot = target?.closest?.('.team-slot');
    if (!slot) return false;
    const cursor = window.getComputedStyle(slot).cursor;
    return cursor === 'pointer';
}

function shouldIgnoreBracketDragStart(e, protectPickableTeamSlots) {
    if (e.target.closest('.sort-btn') || e.target.closest('button') || e.target.closest('select')) {
        return true;
    }
    if (protectPickableTeamSlots && isPickableTeamSlotTarget(e.target)) {
        return true;
    }
    return false;
}

function makeContainerDraggable(container, options = {}) {
    const { protectPickableTeamSlots = false } = options;
    if (!container || container.dataset.dragScrollBound === '1') return;
    container.dataset.dragScrollBound = '1';

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const endDrag = () => {
        isDown = false;
        container.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onDocMouseMove);
        document.removeEventListener('mouseup', onDocMouseUp);
    };

    const onPointerMove = (clientX, e) => {
        if (!isDown) return;

        const walk = clientX - startX;
        if (Math.abs(walk) > 3) {
            hasMoved = true;
            if (e.cancelable) e.preventDefault();
            container.scrollLeft = scrollLeft - walk;
        }
    };

    const onDocMouseMove = (e) => onPointerMove(e.pageX, e);
    const onDocMouseUp = () => endDrag();

    const beginDrag = (clientX, e) => {
        if (shouldIgnoreBracketDragStart(e, protectPickableTeamSlots)) return;

        isDown = true;
        hasMoved = false;
        startX = clientX;
        scrollLeft = container.scrollLeft;
        container.classList.add('is-dragging');
        document.addEventListener('mousemove', onDocMouseMove);
        document.addEventListener('mouseup', onDocMouseUp);
    };

    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        beginDrag(e.pageX, e);
    });

    container.addEventListener('touchstart', (e) => {
        if (!e.touches.length) return;
        beginDrag(e.touches[0].pageX, e);
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (!isDown || !e.touches.length) return;
        onPointerMove(e.touches[0].pageX, e);
    }, { passive: false });

    container.addEventListener('touchend', endDrag);
    container.addEventListener('touchcancel', endDrag);

    container.addEventListener('click', (e) => {
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

// Render available and selected 3rd place teams inside predictions wizard
function renderWizardThirds() {
    const availableContainer = document.getElementById('wizard-thirds-available');
    const selectedContainer = document.getElementById('wizard-thirds-selected-slots');
    if (!availableContainer || !selectedContainer) return;

    availableContainer.innerHTML = '';
    selectedContainer.innerHTML = '';

    const p = STATE.participants.draft;
    if (!p || !p.groupStandings) return;

    // Get the 3rd place team from each of the 12 groups A to L
    const allThirds = [];
    for (const groupName in GROUPS_DATA) {
        const standings = p.groupStandings[groupName] || GROUPS_DATA[groupName].map(t => t.code);
        const thirdPlaceCode = standings[2]; // 3rd place team
        const team = getTeamByCode(thirdPlaceCode);
        allThirds.push({ group: groupName, code: thirdPlaceCode, team: team });
    }

    // Ensure selectedThirds array is initialized
    if (!p.selectedThirds) {
        p.selectedThirds = [];
    }

    // A. Render Available 3rd Place Teams on the Left
    allThirds.forEach(item => {
        const isSelected = p.selectedThirds.includes(item.code);
        
        const card = document.createElement('div');
        card.className = `premium-card third-team-card ${isSelected ? 'selected' : ''}`;
        card.style = `
            padding: 0.85rem 1.25rem;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: ${isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg-match)'};
            border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--card-border)'};
            opacity: ${isSelected ? '0.6' : '1'};
            cursor: ${isSelected ? 'default' : 'pointer'};
            transition: all 0.2s ease;
        `;
        card.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600;">Group ${item.group}</span>
                <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${item.team.name}</span>
            </div>
            ${!isSelected ? '<i class="fa-solid fa-plus-circle" style="color: var(--primary); font-size: 1.15rem;"></i>' : '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald); font-size: 1.15rem;"></i>'}
        `;

        if (!isSelected) {
            card.addEventListener('click', () => {
                if (p.selectedThirds.length >= 8) {
                    alert('You have already selected 8 teams! Please remove a team first to select another.');
                    return;
                }
                p.selectedThirds.push(item.code);
                // Invalidate subsequent picks that might depend on previous third places
                resetSubsequentBracketPicks(p);
                saveStateToStorage();
                renderWizardThirds();
            });
        }
        availableContainer.appendChild(card);
    });

    // B. Render the 8 Slots on the Right
    for (let i = 0; i < 8; i++) {
        const teamCode = p.selectedThirds[i];
        const slotEl = document.createElement('div');
        slotEl.style = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        `;

        if (teamCode) {
            const team = getTeamByCode(teamCode);
            // Find which group this team came from
            const originItem = allThirds.find(item => item.code === teamCode);
            const groupLabel = originItem ? `Group ${originItem.group}` : '';

            slotEl.className = 'premium-card slot-card-selected';
            slotEl.style.cssText += `
                background: rgba(59, 130, 246, 0.04);
                border: 1px solid var(--primary);
            `;
            
            // Build dynamic sort actions + remove actions
            const isFirst = i === 0;
            const isLast = i === p.selectedThirds.length - 1;
            
            slotEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary); background: rgba(59, 130, 246, 0.1); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">${i + 1}</span>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">${groupLabel}</span>
                        <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">${team.name}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="team-sort-actions" style="display: flex; gap: 0.25rem;">
                        <button class="sort-btn btn-up" style="padding: 0; height: 24px; width: 24px; display: inline-flex; align-items: center; justify-content: center;" onclick="moveWizardThird(${i}, -1); event.stopPropagation();" ${isFirst ? 'disabled style="opacity: 0.25; cursor: not-allowed;"' : ''}>
                            <i class="fa-solid fa-chevron-up" style="font-size: 0.72rem;"></i>
                        </button>
                        <button class="sort-btn btn-down" style="padding: 0; height: 24px; width: 24px; display: inline-flex; align-items: center; justify-content: center;" onclick="moveWizardThird(${i}, 1); event.stopPropagation();" ${isLast ? 'disabled style="opacity: 0.25; cursor: not-allowed;"' : ''}>
                            <i class="fa-solid fa-chevron-down" style="font-size: 0.72rem;"></i>
                        </button>
                    </div>
                    <button class="sort-btn btn-remove" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--accent-crimson); padding: 0; height: 24px; width: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); cursor: pointer;" onclick="removeWizardThird(${i}); event.stopPropagation();">
                        <i class="fa-solid fa-circle-minus" style="font-size: 0.85rem;"></i>
                    </button>
                </div>
            `;
        } else {
            slotEl.className = 'slot-card-empty';
            slotEl.style.cssText += `
                background: transparent;
                border: 1px dashed var(--card-border);
                color: var(--text-dark);
            `;
            slotEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-dark); border: 1px dashed var(--card-border); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">${i + 1}</span>
                    <span class="team-tbd" style="font-size: 0.82rem;">Slot ${i + 1} — ${WIZARD_UNPICKED_LABEL}</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-dark);">Click team to fill</span>
            `;
        }
        selectedContainer.appendChild(slotEl);
    }
    updateWizardNextButtonState();
}

window.moveWizardThird = function(currentIndex, direction) {
    const p = STATE.participants.draft;
    if (!p || !p.selectedThirds) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= p.selectedThirds.length) return;

    // Swap elements in selectedThirds array
    const temp = p.selectedThirds[currentIndex];
    p.selectedThirds[currentIndex] = p.selectedThirds[targetIndex];
    p.selectedThirds[targetIndex] = temp;

    // Invalidate subsequent picks since order changed
    resetSubsequentBracketPicks(p);
    saveStateToStorage();
    renderWizardThirds();
};

window.removeWizardThird = function(index) {
    const p = STATE.participants.draft;
    if (!p || !p.selectedThirds) return;

    p.selectedThirds.splice(index, 1);

    // Invalidate subsequent picks since selected thirds set changed
    resetSubsequentBracketPicks(p);
    saveStateToStorage();
    renderWizardThirds();
};

// Invalidate subsequent predicted predicted bracket picks that depend on third places
function resetSubsequentBracketPicks(p) {
    const thirdPlaceMatches = [1, 2, 7, 8, 11, 12, 15, 16];
    thirdPlaceMatches.forEach(mId => {
        p.bracketPicks[mId] = '';
        propagateWinner(p, mId, '');
    });
    p.champ = '';
}

window.moveAdminThird = function(currentIndex, direction) {
    const act = STATE.participants.actuals;
    if (!act || !act.selectedThirds) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= act.selectedThirds.length) return;

    // Swap elements in selectedThirds array
    const temp = act.selectedThirds[currentIndex];
    act.selectedThirds[currentIndex] = act.selectedThirds[targetIndex];
    act.selectedThirds[targetIndex] = temp;

    // Invalidate subsequent picks since order changed
    resetSubsequentBracketPicks(act);
    buildBracketFromStandings('actuals');
    saveStateToStorage();
    renderAll();
};

window.removeAdminThird = function(index) {
    const act = STATE.participants.actuals;
    if (!act || !act.selectedThirds) return;

    act.selectedThirds.splice(index, 1);

    // Invalidate subsequent picks since selected thirds set changed
    resetSubsequentBracketPicks(act);
    buildBracketFromStandings('actuals');
    saveStateToStorage();
    renderAll();
};

// Initialize on window load
window.addEventListener('load', init);
