/** Score equality of playing-time values on a 0–100 scale using the Gini coefficient. */
export function scoreEvenness(values) {
  if (values.length < 2) return 100;

  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;

  const weightedTotal = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  const gini = (2 * weightedTotal) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
  return Math.max(0, Math.round((1 - gini) * 100));
}

/** Return season minutes and average minutes per match in which each player was available. */
export function buildSeasonRows(players, matches, playerStats) {
  const totals = Object.fromEntries(players.map((name) => [name, 0]));
  const appearances = Object.fromEntries(players.map((name) => [name, 0]));
  const snapshotMatches = matches.filter((match) => match.playerMinutes && match.matchAvailability);

  snapshotMatches.forEach((match) => players.forEach((name) => {
    if (match.matchAvailability[name]) {
      totals[name] += Number(match.playerMinutes[name] || 0);
      appearances[name]++;
    }
  }));

  players.forEach((name) => {
    const stats = playerStats[name] || {};
    if (!snapshotMatches.length) {
      totals[name] = Number(stats.minutes || 0);
      appearances[name] = Number(stats.apps || 0);
      return;
    }

    const olderApps = Math.max(0, Number(stats.apps || 0) - appearances[name]);
    const olderMinutes = Math.max(0, Number(stats.minutes || 0) - totals[name]);
    totals[name] += olderMinutes;
    appearances[name] += olderApps;
  });

  return players.map((name) => ({
    name,
    total: totals[name],
    average: appearances[name] ? totals[name] / appearances[name] : 0,
  })).sort((a, b) => a.average - b.average);
}

export function fairnessColor(index, count) {
  if (index === 0) return 'red';
  if (index === count - 1) return 'green';
  return 'amber';
}
