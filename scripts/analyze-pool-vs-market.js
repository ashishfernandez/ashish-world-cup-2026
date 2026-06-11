#!/usr/bin/env node
/**
 * Compare pool submissions to global market probabilities.
 *
 * - Expected points (probability-weighted, matches app scoring + any-path rule)
 * - Monte Carlo pool win % (10k simulated tournaments)
 * - "Chalk" benchmark (always pick highest-probability team at each stage)
 *
 * Usage:
 *   node scripts/analyze-pool-vs-market.js
 *   node scripts/analyze-pool-vs-market.js --simulations 20000
 *   node scripts/analyze-pool-vs-market.js --no-group-scoring
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ovfmmszhlkedypfveyxj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oEuZ2NtTLNBineH2ae8gaQ_ud-Fi2vE';

const POINTS = {
  groupAdvance: 5,
  r32: 10,
  r16: 20,
  qf: 40,
  sf: 80,
  bronze: 40,
  champion: 160,
};

const KNOCKOUT_ROUNDS = {
  R32: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  R16: [17, 18, 19, 20, 21, 22, 23, 24],
  QF: [25, 26, 27, 28],
  SF: [29, 30],
};

const marketData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'team-market-probabilities.json'), 'utf8')
);

const args = process.argv.slice(2);
const simCount = parseInt(getArg('--simulations', '10000'), 10);
const groupScoringActive = !args.includes('--no-group-scoring');

function getArg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

function defaultProbs() {
  return { reachR32: 0.01, reachR16: 0.005, winCup: 0.001 };
}

function getMarket(teamCode) {
  return marketData.teams[teamCode] || defaultProbs();
}

/** Interpolate QF / SF / Final / bronze from published R16 + win odds */
function stageProbs(teamCode) {
  const m = getMarket(teamCode);
  const reachR32 = m.reachR32;
  const reachR16 = m.reachR16;
  const winCup = m.winCup;
  const reachFinal = Math.min(1, winCup * 2);
  const reachSF = Math.sqrt(Math.max(0, reachR16 * reachFinal));
  const reachQF = Math.sqrt(Math.max(0, reachR16 * reachSF));
  const bronze = reachSF * 0.35;
  return { reachR32, reachR16, reachQF, reachSF, reachFinal, winCup, bronze };
}

function getBracketPicks(data) {
  return data.bracketPicks || {};
}

function getPicksForRound(data, roundName) {
  const picks = getBracketPicks(data);
  return KNOCKOUT_ROUNDS[roundName]
    .map((id) => picks[String(id)] || picks[id])
    .filter(Boolean);
}

function getPredictedAdvancers(data) {
  const list = [];
  const gs = data.groupStandings || {};
  for (const group of 'ABCDEFGHIJKL') {
    const row = gs[group];
    if (!row) continue;
    if (row[0]) list.push(row[0]);
    if (row[1]) list.push(row[1]);
  }
  for (const group of 'ABCDEFGH') {
    const row = gs[group];
    if (row?.[2]) list.push(row[2]);
  }
  return list;
}

function getChampionCode(data) {
  const picks = getBracketPicks(data);
  return (data.champ || picks['32'] || picks[32] || '').trim();
}

function getBronzeCode(data) {
  const picks = getBracketPicks(data);
  return (picks['31'] || picks[31] || '').trim();
}

/** All Bernoulli scoring events for one entry (independent draws in simulation) */
function collectScoringEvents(data) {
  const events = [];

  if (groupScoringActive) {
    for (const code of getPredictedAdvancers(data)) {
      events.push({ points: POINTS.groupAdvance, prob: stageProbs(code).reachR32, label: `group:${code}` });
    }
  }

  for (const code of getPicksForRound(data, 'R32')) {
    events.push({ points: POINTS.r32, prob: stageProbs(code).reachR16, label: `r32:${code}` });
  }
  for (const code of getPicksForRound(data, 'R16')) {
    events.push({ points: POINTS.r16, prob: stageProbs(code).reachQF, label: `r16:${code}` });
  }
  for (const code of getPicksForRound(data, 'QF')) {
    events.push({ points: POINTS.qf, prob: stageProbs(code).reachSF, label: `qf:${code}` });
  }
  for (const code of getPicksForRound(data, 'SF')) {
    events.push({ points: POINTS.sf, prob: stageProbs(code).reachFinal, label: `sf:${code}` });
  }

  const bronze = getBronzeCode(data);
  if (bronze) {
    events.push({ points: POINTS.bronze, prob: stageProbs(bronze).bronze, label: `bronze:${bronze}` });
  }

  const champ = getChampionCode(data);
  if (champ) {
    events.push({ points: POINTS.champion, prob: stageProbs(champ).winCup, label: `champ:${champ}` });
  }

  return events;
}

function expectedPoints(events) {
  return events.reduce((sum, e) => sum + e.points * e.prob, 0);
}

function simulateScore(events) {
  let score = 0;
  for (const e of events) {
    if (Math.random() < e.prob) score += e.points;
  }
  return score;
}

async function fetchSubmissions() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?select=id,data`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function topTeamBy(metric) {
  return Object.entries(marketData.teams).sort((a, b) => b[1][metric] - a[1][metric])[0][0];
}

/** Synthetic "chalk" entry: favorites at each published stage */
function buildChalkEntry() {
  const byR32 = Object.entries(marketData.teams).sort((a, b) => b[1].reachR32 - a[1].reachR32);
  const advancers = byR32.slice(0, 32).map(([c]) => c);

  const groupStandings = {};
  const groups = 'ABCDEFGHIJKL';
  let i = 0;
  for (const g of groups) {
    groupStandings[g] = [advancers[i++], advancers[i++], advancers[i++] || advancers[0]];
  }

  const bracketPicks = {};
  const pickFav = (metric) =>
    Object.entries(marketData.teams).sort((a, b) => b[1][metric] - a[1][metric])[0][0];

  for (const id of KNOCKOUT_ROUNDS.R32) bracketPicks[id] = pickFav('reachR16');
  for (const id of KNOCKOUT_ROUNDS.R16) bracketPicks[id] = pickFav('reachR16');
  for (const id of KNOCKOUT_ROUNDS.QF) bracketPicks[id] = pickFav('reachR16');
  for (const id of KNOCKOUT_ROUNDS.SF) bracketPicks[id] = pickFav('reachR16');
  bracketPicks[31] = pickFav('reachR16');
  bracketPicks[32] = topTeamBy('winCup');

  return {
    id: 'chalk_benchmark',
    name: '(Market chalk benchmark)',
    champ: bracketPicks[32],
    groupStandings,
    bracketPicks,
  };
}

function printReport(entries, chalk) {
  const analyzed = entries.map((row) => {
    const data = row.data;
    const events = collectScoringEvents(data);
    const exp = expectedPoints(events);
    const champ = getChampionCode(data);
    return {
      id: row.id,
      name: data.name || row.id,
      champ,
      champMarketPct: champ ? (stageProbs(champ).winCup * 100) : 0,
      expectedPoints: exp,
      events,
    };
  });

  const chalkEvents = collectScoringEvents(chalk);
  const chalkExp = expectedPoints(chalkEvents);

  const winCounts = Object.fromEntries(analyzed.map((e) => [e.id, 0]));
  let chalkWins = 0;

  for (let s = 0; s < simCount; s++) {
    const scores = analyzed.map((e) => ({
      id: e.id,
      name: e.name,
      score: simulateScore(e.events),
    }));

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0].score;
    const tied = scores.filter((x) => x.score === top);
    const share = 1 / tied.length;
    for (const t of tied) {
      winCounts[t.id] += share;
    }

    const chalkScore = simulateScore(chalkEvents);
    const chalkTop = scores[0];
    if (chalkScore > chalkTop.score) chalkWins += 1;
    else if (chalkScore === chalkTop.score) chalkWins += 1 / (tied.length + 1);
  }

  analyzed.sort((a, b) => b.expectedPoints - a.expectedPoints);

  const totalWins = Object.values(winCounts).reduce((a, b) => a + b, 0);
  const totalExpPts = analyzed.reduce((sum, e) => sum + e.expectedPoints, 0);
  const equalChancePct = 100 / analyzed.length;

  const tableRows = analyzed.map((e, i) => {
    const rawWinPct = (winCounts[e.id] / simCount) * 100;
    const poolWinShare = (winCounts[e.id] / totalWins) * 100;
    const expPtsPoolShare = (e.expectedPoints / totalExpPts) * 100;
    return {
      rank: i + 1,
      participant: e.name,
      expPts: Number(e.expectedPoints.toFixed(1)),
      startingPoolWinProb: Number(rawWinPct.toFixed(1)),
      poolWinShare: Number(poolWinShare.toFixed(2)),
      expPtsPoolShare: Number(expPtsPoolShare.toFixed(2)),
      vsEqualChance: Number((rawWinPct / equalChancePct).toFixed(2)),
    };
  });

  const exportPath = path.join(__dirname, 'pool-starting-win-probabilities.csv');
  const csvLines = [
    'Rank,Participant,Exp Pts,Starting Pool Win Prob,Pool Win Share (33-player),Exp Pts Pool Share,vs Equal Chance (1x=3.03%)',
    ...tableRows.map(
      (r) =>
        `${r.rank},"${r.participant.replace(/"/g, '""')}",${r.expPts},${r.startingPoolWinProb}%,${r.poolWinShare}%,${r.expPtsPoolShare}%,${r.vsEqualChance}x`
    ),
  ];
  fs.writeFileSync(exportPath, csvLines.join('\n') + '\n', 'utf8');

  console.log('');
  console.log('=== Pool vs global market probabilities ===');
  console.log(`Market data: ${marketData.source}`);
  console.log(`As of: ${marketData.asOf}`);
  console.log(`Submissions: ${analyzed.length} | Simulations: ${simCount.toLocaleString()}`);
  console.log(`Group scoring in model: ${groupScoringActive ? 'ON' : 'OFF'}`);
  console.log(`Chalk benchmark expected pts: ${chalkExp.toFixed(1)}`);
  console.log('');
  const useStandardizedOnly = args.includes('--standardized');

  if (useStandardizedOnly) {
    console.log(
      'Rank'.padEnd(5) +
        'Participant'.padEnd(24) +
        'Exp Pts'.padEnd(10) +
        'Pool Win Share'
    );
    console.log('-'.repeat(58));
    for (const row of tableRows) {
      console.log(
        String(row.rank).padEnd(5) +
          row.participant.slice(0, 22).padEnd(24) +
          String(row.expPts).padEnd(10) +
          `${row.poolWinShare}%`
      );
    }
  } else {
    console.log(
      'Rank'.padEnd(5) +
        'Participant'.padEnd(22) +
        'Exp Pts'.padEnd(9) +
        'Win Prob'.padEnd(10) +
        'Pool Share'.padEnd(12) +
        'Exp Share'
    );
    console.log('-'.repeat(72));
    for (const row of tableRows) {
      console.log(
        String(row.rank).padEnd(5) +
          row.participant.slice(0, 20).padEnd(22) +
          String(row.expPts).padEnd(9) +
          `${row.startingPoolWinProb}%`.padEnd(10) +
          `${row.poolWinShare}%`.padEnd(12) +
          `${row.expPtsPoolShare}%`
      );
    }
  }

  console.log('');
  console.log(`Exported: ${exportPath}`);
  console.log(
    `Chalk benchmark (not in pool): ${chalkExp.toFixed(1)} exp pts; would beat leader ~${((chalkWins / simCount) * 100).toFixed(1)}% of sims`
  );
  console.log('');
  console.log('Notes:');
  console.log('- Exp Pts = sum of (market probability × points) for each scoring event.');
  console.log(`- Starting Pool Win Prob = raw MC finish-1st rate among the ${analyzed.length} pool entries.`);
  console.log('- Pool Win Share = same MC wins renormalized to sum to exactly 100% across active players only.');
  console.log('- Exp Pts Pool Share = each player\'s expected points as a % of total pool expected points (sums to 100%).');
  console.log(`- Equal chance baseline with ${analyzed.length} players = ${equalChancePct.toFixed(2)}% each.`);
  console.log('- Use --standardized for a 4-column table (Rank, Participant, Exp Pts, Pool Win Share).');
  console.log('- Knockout stages use any-path scoring (same as the site).');
  console.log('- QF/SF/bronze probs interpolated between published R16 and win odds.');
  console.log('- Update scripts/team-market-probabilities.json when markets move.');
  console.log('');
}

async function main() {
  const rows = await fetchSubmissions();
  if (!rows.length) {
    console.error('No submissions found.');
    process.exit(1);
  }

  const entries = rows.map((r) => ({ id: r.id, data: r.data }));
  const chalk = buildChalkEntry();
  printReport(entries, chalk);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
