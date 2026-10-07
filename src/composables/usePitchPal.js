import { computed, reactive, ref, watch } from 'vue';
import { buildSeasonRows, fairnessColor, scoreEvenness } from '../domain/fairness.js';

const defaultPlayers = ['Oscar', 'Samuel', 'Parker', 'Finlay', 'Jacob', 'Cyrus', 'Harry', 'Ronnie', 'Jaisane', 'Josh'];
const positionsList = ['GK', 'LB', 'RB', 'LM', 'CM', 'RM', 'ST'];
const formations = ['2-3-1', '3-2-1', '2-2-2', '3-3'];

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function createPlayerStats() {
  return { apps: 0, starts: 0, subapps: 0, minutes: 0, goals: 0, assists: 0, captaincies: 0, motm: 0, potm: 0, cleanSheets: 0 };
}

export function usePitchPal() {
  const players = ref(readJson('playerNames', defaultPlayers));
  if (!Array.isArray(players.value) || !players.value.length) players.value = defaultPlayers;

  const data = reactive(readJson('u11v5', { matches: [], p: {}, availability: {}, lineups: [], saved: [], gameSplit: 'quarters' }));
  data.matches ||= [];
  data.p ||= {};
  data.availability ||= {};
  if ('teamColor' in data) {
    delete data.teamColor;
    localStorage.setItem('u11v5', JSON.stringify(data));
  }
  data.lineups ||= [];
  players.value.forEach((name) => {
    data.p[name] ||= createPlayerStats();
    data.availability[name] ??= true;
  });

  const savedLineups = data.lineups;
  const periodType = ref(data.gameSplit === 'halves' ? 'halves' : 'quarters');
  const periodLength = ref(Number(data.periodLength || 12.5));
  const teamName = ref(data.teamName || '');
  const opponent = ref('');
  const formation = ref('2-3-1');
  const tab = ref('Team profile');
  const quarter = ref(1);
  const starters = ref([]);
  const playerPositions = ref({});
  const dedicatedGK = ref(data.dedicatedGK || (typeof data.hasDedicatedGK === 'string' ? data.hasDedicatedGK : ''));
  const captain = ref(data.captain || savedLineups.find((lineup) => lineup?.captain)?.captain || '');
  const seconds = reactive(Object.fromEntries(players.value.map((name) => [name, 0])));
  const defensiveSeconds = reactive(Object.fromEntries(players.value.map((name) => [name, 0])));
  const availableAtStart = ref({});
  const events = ref([]);
  const homeScore = ref(0);
  const awayScore = ref(0);
  const secondsLeft = ref(Math.round(periodLength.value * 60));
  const matchActive = ref(false);
  const matchReady = ref(false);
  const periodRunning = ref(false);
  const matchSaved = ref(false);
  const selectedOut = ref('');
  const selectedIn = ref('');
  const goalScorer = ref('');
  const goalAssist = ref('');
  const matchGoalCredits = ref([]);
  const motm = ref('');
  const potm = ref('');
  let timer;

  const periodCount = computed(() => periodType.value === 'quarters' ? 4 : 2);
  const periodName = computed(() => periodType.value === 'quarters' ? 'Quarter' : 'Half');
  const availablePlayers = computed(() => players.value.filter((name) => data.availability[name]));
  const matchParticipants = computed(() => players.value.filter((name) => availableAtStart.value[name]));
  const bench = computed(() => {
    const available = matchActive.value
      ? players.value.filter((name) => availableAtStart.value[name])
      : availablePlayers.value;
    return available.filter((name) => !starters.value.includes(name));
  });
  const activePlayers = computed(() => starters.value);
  const substitutionCandidates = computed(() => activePlayers.value.filter((name) => name !== dedicatedGK.value));
  const currentPeriodTitle = computed(() => `${periodName.value} ${quarter.value} of ${periodCount.value}`);
  const matchRows = computed(() => players.value
    .filter((name) => availableAtStart.value[name])
    .map((name) => ({ name, seconds: seconds[name] || 0 }))
    .sort((a, b) => a.seconds - b.seconds));
  const matchFairness = computed(() => matchRows.value.length ? scoreEvenness(matchRows.value.map((player) => player.seconds)) : 0);
  const matchPriority = computed(() => bench.value.slice().sort((a, b) => (seconds[a] || 0) - (seconds[b] || 0))[0]);
  const recommendedMinutes = computed(() => {
    if (!matchPriority.value) return 0;
    const totalMinutes = periodLength.value * periodCount.value;
    const elapsedMinutes = totalMinutes - ((periodCount.value - quarter.value) * periodLength.value + secondsLeft.value / 60);
    const fairShare = availablePlayers.value.length ? elapsedMinutes * 7 / availablePlayers.value.length : 0;
    return Math.max(0, Math.ceil(fairShare - (seconds[matchPriority.value] || 0) / 60));
  });
  const seasonRows = computed(() => buildSeasonRows(players.value, data.matches, data.p));
  const seasonFairness = computed(() => data.matches.length ? scoreEvenness(seasonRows.value.map((row) => row.average)) : null);
  const goalDiff = computed(() => data.matches.reduce((sum, match) => sum + Number(match.score || 0) - Number(match.against || 0), 0));
  const recordText = computed(() => `${data.matches.filter((match) => match.result === 'W').length}W · ${data.matches.filter((match) => match.result === 'D').length}D · ${data.matches.filter((match) => match.result === 'L').length}L`);
  const resultLabel = computed(() => homeScore.value > awayScore.value ? 'WIN' : homeScore.value < awayScore.value ? 'LOSS' : 'DRAW');

  function persist() {
    data.gameSplit = periodType.value;
    data.periodLength = periodLength.value;
    data.teamName = teamName.value.trim();
    data.captain = captain.value;
    data.lineups = savedLineups;
    localStorage.setItem('u11v5', JSON.stringify(data));
    localStorage.setItem('playerNames', JSON.stringify(players.value));
  }

  function addPlayer(value) {
    const name = String(value || '').trim();
    if (!name) return false;
    if (players.value.some((player) => player.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      window.alert('A player with that name is already in the squad.');
      return false;
    }

    players.value.push(name);
    data.p[name] ||= createPlayerStats();
    data.availability[name] ??= true;
    seconds[name] ??= 0;
    defensiveSeconds[name] ??= 0;
    persist();
    return true;
  }

  function renamePlayer(currentName, value) {
    const name = String(value || '').trim();
    if (!name) {
      let number = Math.max(0, players.value.indexOf(currentName)) + 1;
      while (players.value.some((player) => player.toLocaleLowerCase() === `player ${number}` && player !== currentName)
        || currentName.toLocaleLowerCase() === `player ${number}`) number++;
      return renamePlayer(currentName, `Player ${number}`);
    }
    if (players.value.some((player) => player !== currentName && player.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      window.alert('A player with that name is already in the squad.');
      return false;
    }
    if (name === currentName) return true;

    const renameKey = (record) => {
      if (!record || !Object.prototype.hasOwnProperty.call(record, currentName)) return;
      record[name] = record[currentName];
      delete record[currentName];
    };
    const renameArray = (names) => (names || []).map((player) => player === currentName ? name : player);
    const renameLineup = (lineup) => {
      if (!lineup) return;
      lineup.starters = renameArray(lineup.starters);
      renameKey(lineup.positions);
      if (lineup.captain === currentName) lineup.captain = name;
    };

    renameKey(data.p);
    renameKey(data.availability);
    renameKey(seconds);
    renameKey(defensiveSeconds);
    renameKey(availableAtStart.value);
    savedLineups.forEach(renameLineup);
    starters.value = renameArray(starters.value);
    renameKey(playerPositions.value);
    if (captain.value === currentName) captain.value = name;
    if (dedicatedGK.value === currentName) dedicatedGK.value = name;
    if (selectedOut.value === currentName) selectedOut.value = name;
    if (selectedIn.value === currentName) selectedIn.value = name;
    if (goalScorer.value === currentName) goalScorer.value = name;
    if (goalAssist.value === currentName) goalAssist.value = name;
    matchGoalCredits.value.forEach((credit) => {
      if (credit.scorer === currentName) credit.scorer = name;
      if (credit.assist === currentName) credit.assist = name;
    });
    events.value = events.value.map((event) => event.split(currentName).join(name));

    data.matches.forEach((match) => {
      renameKey(match.playerMinutes);
      renameKey(match.matchAvailability);
      ['captain', 'motm', 'potm', 'dedicatedGK'].forEach((key) => {
        if (match[key] === currentName) match[key] = name;
      });
      match.starters = renameArray(match.starters);
      (match.quarterLineups || []).forEach(renameLineup);
      if (match.events) match.events = match.events.map((event) => event.split(currentName).join(name));
    });
    if (data.captain === currentName) data.captain = name;
    if (data.dedicatedGK === currentName) data.dedicatedGK = name;

    players.value[players.value.indexOf(currentName)] = name;
    persist();
    return true;
  }

  function removePlayer(name) {
    if (!players.value.includes(name)) return false;

    players.value = players.value.filter((player) => player !== name);
    delete data.p[name];
    delete data.availability[name];
    delete seconds[name];
    delete defensiveSeconds[name];
    delete availableAtStart.value[name];
    starters.value = starters.value.filter((player) => player !== name);
    delete playerPositions.value[name];
    savedLineups.forEach((lineup) => {
      if (!lineup) return;
      lineup.starters = lineup.starters.filter((player) => player !== name);
      delete lineup.positions[name];
      if (lineup.captain === name) lineup.captain = '';
    });
    if (captain.value === name) captain.value = '';
    if (dedicatedGK.value === name) dedicatedGK.value = '';
    if (data.captain === name) data.captain = '';
    if (data.dedicatedGK === name) data.dedicatedGK = '';
    if (selectedOut.value === name) selectedOut.value = '';
    if (selectedIn.value === name) selectedIn.value = '';
    if (goalScorer.value === name) goalScorer.value = '';
    if (goalAssist.value === name) goalAssist.value = '';
    if (motm.value === name) motm.value = '';
    if (potm.value === name) potm.value = '';
    matchGoalCredits.value = matchGoalCredits.value.filter((credit) => credit.scorer !== name && credit.assist !== name);
    persist();
    return true;
  }

  function rememberLineup() {
    savedLineups[quarter.value - 1] = {
      starters: [...starters.value],
      positions: { ...playerPositions.value },
      formation: formation.value,
      captain: captain.value,
    };
    persist();
  }

  function loadLineup(index) {
    const lineup = savedLineups[index];
    if (lineup) {
      starters.value = lineup.starters.filter((name) => players.value.includes(name));
      playerPositions.value = { ...lineup.positions };
      formation.value = lineup.formation || formation.value;
      if (!captain.value && lineup.captain) captain.value = lineup.captain;
    }
    ensureDedicatedKeeper();
    normalizeLineupPositions();
  }

  function ensureDedicatedKeeper() {
    const keeper = dedicatedGK.value;
    if (!keeper || !data.availability[keeper]) return;
    if (!starters.value.includes(keeper)) {
      const replace = starters.value[starters.value.length - 1];
      if (replace) {
        starters.value.pop();
        delete playerPositions.value[replace];
      }
      if (starters.value.length < 7) starters.value.push(keeper);
    }
    starters.value.forEach((name) => {
      if (name !== keeper && playerPositions.value[name] === 'GK') playerPositions.value[name] = '';
    });
    playerPositions.value[keeper] = 'GK';
  }

  function normalizeLineupPositions() {
    const seen = new Set();
    const orderedStarters = dedicatedGK.value
      ? [dedicatedGK.value, ...starters.value.filter((name) => name !== dedicatedGK.value)]
      : starters.value;
    orderedStarters.forEach((name) => {
      const position = playerPositions.value[name];
      if (!position) return;
      if (seen.has(position)) playerPositions.value[name] = '';
      else seen.add(position);
    });
  }

  function setDedicatedGK(name) {
    const previousKeeper = dedicatedGK.value;
    dedicatedGK.value = name;
    data.dedicatedGK = name;
    if (previousKeeper && previousKeeper !== name) {
      delete playerPositions.value[previousKeeper];
      savedLineups.forEach((lineup) => {
        if (lineup?.positions?.[previousKeeper] === 'GK') lineup.positions[previousKeeper] = '';
      });
    }
    if (name) {
      savedLineups.forEach((lineup) => {
        if (!lineup) return;
        lineup.positions ||= {};
        const replaceIndex = lineup.starters.indexOf(name) === -1 ? lineup.starters.length - 1 : -1;
        if (replaceIndex >= 0 && lineup.starters.length >= 7) {
          delete lineup.positions[lineup.starters[replaceIndex]];
          lineup.starters.splice(replaceIndex, 1);
        }
        if (!lineup.starters.includes(name)) lineup.starters.push(name);
        lineup.positions[name] = 'GK';
      });
      ensureDedicatedKeeper();
    }
    rememberLineup();
  }

  function changePeriod(index) {
    rememberLineup();
    quarter.value = index;
    loadLineup(index - 1);
  }

  function selectPlayer(name) {
    if (name === dedicatedGK.value && starters.value.includes(name)) return;
    if (starters.value.includes(name)) {
      starters.value = starters.value.filter((player) => player !== name);
      delete playerPositions.value[name];
    } else if (starters.value.length < 7 && data.availability[name]) {
      starters.value.push(name);
      playerPositions.value[name] = positionsList.find((position) => !starters.value.some((starter) => starter !== name && playerPositions.value[starter] === position)) || '';
    }
    rememberLineup();
  }

  function setPlayerPosition(name, position) {
    if (!data.availability[name]) return;
    if (name === dedicatedGK.value && position !== 'GK') return;
    if (position === 'GK' && dedicatedGK.value && name !== dedicatedGK.value) return;
    const currentIndex = starters.value.indexOf(name);
    if (!position) {
      if (name === dedicatedGK.value) return;
      if (currentIndex !== -1) starters.value.splice(currentIndex, 1);
      delete playerPositions.value[name];
      rememberLineup();
      return;
    }
    const occupant = position && starters.value.find((starter) => starter !== name && playerPositions.value[starter] === position);
    if (currentIndex === -1) {
      if (occupant) {
        const occupantIndex = starters.value.indexOf(occupant);
        starters.value.splice(occupantIndex, 1, name);
        delete playerPositions.value[occupant];
      } else if (starters.value.length < 7) starters.value.push(name);
      else return;
    } else if (occupant) {
      playerPositions.value[occupant] = playerPositions.value[name] || '';
    }
    playerPositions.value[name] = position;
    rememberLineup();
  }

  function toggleAvailability(name) {
    if (name === dedicatedGK.value && data.availability[name]) setDedicatedGK('');
    data.availability[name] = !data.availability[name];
    if (!data.availability[name] && starters.value.includes(name)) selectPlayer(name);
  }

  function setCaptain(name) {
    captain.value = name;
    data.captain = name;
    savedLineups.forEach((lineup) => { if (lineup) lineup.captain = name; });
    rememberLineup();
  }

  function switchSplit(value) {
    periodType.value = value === 'halves' ? 'halves' : 'quarters';
    if (quarter.value > periodCount.value) quarter.value = periodCount.value;
    persist();
  }

  function resetTimer() { secondsLeft.value = Math.round((Number(periodLength.value) || 12.5) * 60); }

  function stopClock() {
    if (timer) clearInterval(timer);
    timer = undefined;
    periodRunning.value = false;
  }

  function runClock() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (secondsLeft.value > 0) {
        secondsLeft.value--;
        starters.value.forEach((name) => {
          seconds[name] = (seconds[name] || 0) + 1;
          if (['GK', 'LB', 'RB'].includes(playerPositions.value[name])) defensiveSeconds[name] = (defensiveSeconds[name] || 0) + 1;
        });
      } else stopClock();
    }, 1000);
  }

  function beginMatch(startImmediately = true) {
    if (starters.value.length !== 7) {
      window.alert('Choose seven starters in Squad before kick-off.');
      tab.value = 'Squad';
      return;
    }
    rememberLineup();
    quarter.value = 1;
    loadLineup(0);
    players.value.forEach((name) => { seconds[name] = 0; });
    players.value.forEach((name) => { defensiveSeconds[name] = 0; });
    availableAtStart.value = Object.fromEntries(players.value.map((name) => [name, !!data.availability[name]]));
    homeScore.value = 0;
    awayScore.value = 0;
    events.value = [`Kick-off · ${periodName.value} 1`];
    matchGoalCredits.value = [];
    goalScorer.value = '';
    goalAssist.value = '';
    selectedOut.value = '';
    selectedIn.value = '';
    motm.value = '';
    potm.value = '';
    matchActive.value = true;
    matchReady.value = !startImmediately;
    matchSaved.value = false;
    periodRunning.value = startImmediately;
    resetTimer();
    tab.value = 'Match';
    if (startImmediately) runClock();
    else stopClock();
  }

  function restartMatch() {
    if (!window.confirm('Restart this match from the beginning? The current score, clock, and events will be reset. Saved season results will remain.')) return;
    stopClock();
    beginMatch(false);
  }

  function toggleClock() {
    if (periodRunning.value) stopClock();
    else if (matchActive.value && secondsLeft.value > 0) {
      matchReady.value = false;
      periodRunning.value = true;
      runClock();
    }
  }

  function nextPeriod() {
    if (quarter.value >= periodCount.value) { finishMatch(); return; }
    rememberLineup();
    events.value.unshift(`${periodName.value} ${quarter.value} finished`);
    quarter.value++;
    loadLineup(quarter.value - 1);
    resetTimer();
    periodRunning.value = true;
    runClock();
  }

  function finishMatch() {
    stopClock();
    matchActive.value = false;
    matchReady.value = false;
    events.value.unshift(secondsLeft.value ? `Match finished early · ${formatClock(secondsLeft.value)} left` : 'Full time');
  }

  function registerGoal() {
    if (!goalScorer.value) return;
    homeScore.value++;
    if (goalScorer.value === 'own-goal') events.value.unshift('Goal · Opponent own goal');
    else {
      matchGoalCredits.value.push({ scorer: goalScorer.value, assist: goalAssist.value });
      events.value.unshift(`Goal · ${goalScorer.value}${goalAssist.value ? ` · Assist ${goalAssist.value}` : ''}`);
    }
    goalScorer.value = '';
    goalAssist.value = '';
  }

  function addOpponentGoal() { awayScore.value++; events.value.unshift('Goal · Opponent'); }

  function chooseSubstitutionPlayer(name) {
    if (!matchActive.value) return;
    if (starters.value.includes(name)) {
      if (name === dedicatedGK.value) return;
      selectedOut.value = selectedOut.value === name ? '' : name;
    } else if (bench.value.includes(name)) {
      selectedIn.value = selectedIn.value === name ? '' : name;
    } else return;
    if (selectedOut.value && selectedIn.value) substitute();
  }

  function substitute() {
    if (!selectedOut.value || !selectedIn.value) return;
    const out = selectedOut.value;
    const incoming = selectedIn.value;
    if (out === dedicatedGK.value || incoming === dedicatedGK.value) return;
    const index = starters.value.indexOf(out);
    const position = playerPositions.value[out] || positionsList[index] || '';
    starters.value = starters.value.filter((name) => name !== out);
    starters.value.splice(index, 0, incoming);
    delete playerPositions.value[out];
    playerPositions.value[incoming] = position;
    events.value.unshift(`Substitution · ${out} off, ${incoming} on`);
    selectedOut.value = '';
    selectedIn.value = '';
    rememberLineup();
  }

  function saveMatch() {
    if (matchSaved.value) return;
    if (!opponent.value.trim()) {
      window.alert('Add the opponent in Setup before saving.');
      tab.value = 'Setup';
      return;
    }
    rememberLineup();
    const result = homeScore.value > awayScore.value ? 'W' : homeScore.value < awayScore.value ? 'L' : 'D';
    matchGoalCredits.value.forEach(({ scorer, assist }) => {
      if (data.p[scorer]) data.p[scorer].goals++;
      if (assist && data.p[assist]) data.p[assist].assists++;
    });
    if (awayScore.value === 0) {
      players.value.filter((name) => defensiveSeconds[name] > 0).forEach((name) => { data.p[name].cleanSheets++; });
    }
    players.value.filter((name) => seconds[name] > 0).forEach((name) => {
      const player = data.p[name];
      player.apps++;
      player.minutes += Math.round(seconds[name] / 60);
      if (savedLineups[0]?.starters.includes(name)) player.starts++;
      else player.subapps++;
    });
    if (captain.value && data.p[captain.value]) data.p[captain.value].captaincies++;
    if (motm.value && data.p[motm.value]) data.p[motm.value].motm++;
    if (potm.value && data.p[potm.value]) data.p[potm.value].potm++;
    data.matches.unshift({
      date: new Date().toISOString(),
      opponent: opponent.value.trim(),
      teamName: teamName.value.trim(),
      score: homeScore.value,
      against: awayScore.value,
      result,
      playerMinutes: Object.fromEntries(players.value.map((name) => [name, Math.round(seconds[name] / 60)])),
      matchAvailability: { ...availableAtStart.value },
      formation: savedLineups[0]?.formation || formation.value,
      periodType: periodType.value,
      periodLength: periodLength.value,
      captain: captain.value,
      motm: motm.value,
      potm: potm.value,
      dedicatedGK: dedicatedGK.value,
      starters: [...(savedLineups[0]?.starters || [])],
      quarterLineups: savedLineups.map((lineup) => lineup ? {
        starters: [...lineup.starters],
        positions: { ...lineup.positions },
        formation: lineup.formation,
        captain: lineup.captain,
      } : null),
      cleanSheet: awayScore.value === 0,
      events: [...events.value],
    });
    matchSaved.value = true;
    persist();
  }

  function clearSeason() {
    if (!window.confirm('Clear all season match and player data?')) return;
    data.matches.splice(0);
    Object.assign(data.p, Object.fromEntries(players.value.map((name) => [name, createPlayerStats()])));
    persist();
  }

  function formatClock(value) {
    return `${String(Math.floor(Math.max(0, value) / 60)).padStart(2, '0')}:${String(Math.max(0, value) % 60).padStart(2, '0')}`;
  }

  function formatMinutes(value) { return Math.floor(Math.max(0, value) / 60); }
  function periodLabel(index) { return periodType.value === 'quarters' ? `Q${index + 1}` : `H${index + 1}`; }
  function playerInitial(name) { return name.trim().slice(0, 1).toUpperCase(); }

  watch(data, persist, { deep: true });
  watch(players, persist, { deep: true });
  watch(teamName, persist);
  watch([secondsLeft, homeScore, awayScore, matchActive], () => {
    if (matchActive.value) {
      localStorage.setItem('pitchPalMatch', JSON.stringify({
        active: true, quarter: quarter.value, secondsLeft: secondsLeft.value,
        homeScore: homeScore.value, awayScore: awayScore.value, seconds: { ...seconds },
        defensiveSeconds: { ...defensiveSeconds },
        events: events.value, availableAtStart: availableAtStart.value, starters: starters.value,
        positions: playerPositions.value, goalCredits: matchGoalCredits.value,
      }));
    } else localStorage.removeItem('pitchPalMatch');
  });

  function restoreMatch() {
    loadLineup(0);
    const recovered = readJson('pitchPalMatch', null);
    if (!recovered?.active) return;
    quarter.value = recovered.quarter || 1;
    secondsLeft.value = recovered.secondsLeft ?? secondsLeft.value;
    homeScore.value = recovered.homeScore || 0;
    awayScore.value = recovered.awayScore || 0;
    Object.assign(seconds, recovered.seconds || {});
    Object.assign(defensiveSeconds, recovered.defensiveSeconds || {});
    events.value = recovered.events || [];
    if (recovered.starters) starters.value = recovered.starters;
    if (recovered.positions) playerPositions.value = recovered.positions;
    matchGoalCredits.value = recovered.goalCredits || [];
    availableAtStart.value = recovered.availableAtStart || {};
    matchActive.value = true;
  }

  return {
    players, data, positionsList, formations, periodType, periodLength, teamName, opponent, formation, tab, dedicatedGK,
    quarter, starters, playerPositions, captain, seconds, events, homeScore, awayScore, secondsLeft,
    matchActive, matchReady, periodRunning, matchSaved, selectedOut, selectedIn, goalScorer, goalAssist, motm, potm,
    periodCount, periodName, availablePlayers, matchParticipants, bench, activePlayers, substitutionCandidates, currentPeriodTitle, matchRows,
    matchFairness, matchPriority, recommendedMinutes, seasonRows, seasonFairness, goalDiff, recordText,
    resultLabel, clockText: formatClock, addPlayer, renamePlayer, removePlayer, changePeriod, selectPlayer, setPlayerPosition, toggleAvailability, setCaptain, setDedicatedGK, switchSplit, beginMatch, restartMatch,
    toggleClock, nextPeriod, finishMatch, registerGoal, addOpponentGoal, chooseSubstitutionPlayer, substitute, saveMatch,
    clearSeason, rememberLineup, formatClock, formatMinutes, periodLabel, playerInitial,
    restoreMatch, dispose: stopClock, fairnessColor,
  };
}
