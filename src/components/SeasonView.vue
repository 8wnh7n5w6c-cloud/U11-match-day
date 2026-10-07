<template>
  <div class="eyebrow">
    THE BIG PICTURE
  </div><h1>Your season <span>so far.</span></h1>
  <div class="season-hero">
    <small>MATCH RECORD</small><strong>{{ recordText }}</strong><span>Goal difference {{ goalDiff > 0 ? '+' : '' }}{{ goalDiff }}</span>
  </div>
  <div class="season-overview-grid">
    <div class="quick-stat">
      <small>GAMES</small><strong>{{ seasonSummary.games }}</strong>
    </div>
    <div class="quick-stat">
      <small>WINS</small><strong>{{ seasonSummary.wins }}</strong>
    </div>
    <div class="quick-stat">
      <small>DRAWS</small><strong>{{ seasonSummary.draws }}</strong>
    </div>
    <div class="quick-stat">
      <small>LOSSES</small><strong>{{ seasonSummary.losses }}</strong>
    </div>
    <div class="quick-stat">
      <small>GOALS FOR</small><strong>{{ seasonSummary.goalsFor }}</strong>
    </div>
    <div class="quick-stat">
      <small>GOALS AGAINST</small><strong>{{ seasonSummary.goalsAgainst }}</strong>
    </div>
  </div>
  <div class="section-heading compact">
    <div><span class="eyebrow">PLAYER STATS</span><h2>Season totals</h2></div>
    <label class="stats-sort">Sort by
      <ion-select
        v-model="sortBy"
        aria-label="Sort player stats by"
        interface="popover"
      >
        <ion-select-option value="apps">Games</ion-select-option>
        <ion-select-option value="starts">Starts</ion-select-option>
        <ion-select-option value="subapps">Sub appearances</ion-select-option>
        <ion-select-option value="minutes">Minutes</ion-select-option>
        <ion-select-option value="goals">Goals</ion-select-option>
        <ion-select-option value="assists">Assists</ion-select-option>
        <ion-select-option value="captaincies">Captaincies</ion-select-option>
        <ion-select-option value="motm">Man of the match</ion-select-option>
        <ion-select-option value="potm">Parents’ player</ion-select-option>
        <ion-select-option value="cleanSheets">Clean sheets</ion-select-option>
      </ion-select>
    </label>
  </div>
  <ion-card class="surface-card">
    <ion-card-content>
      <div
        class="stats-table-wrap"
        role="region"
        aria-label="Season player statistics"
        tabindex="0"
      >
        <table class="season-stats">
          <thead>
            <tr>
              <th scope="col">
                Player
              </th><th scope="col">
                Games
              </th><th scope="col">
                Starts
              </th><th scope="col">
                Subs
              </th><th scope="col">
                Minutes
              </th><th scope="col">
                Goals
              </th><th scope="col">
                Assists
              </th><th scope="col">
                Captain
              </th><th scope="col">
                MOTM
              </th><th scope="col">
                Parent
              </th><th scope="col">
                Clean sheets
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="name in sortedPlayers"
              :key="name"
            >
              <th scope="row">
                {{ name }}
              </th><td>{{ data.p[name]?.apps || 0 }}</td><td>{{ data.p[name]?.starts || 0 }}</td><td>{{ data.p[name]?.subapps || 0 }}</td><td>{{ data.p[name]?.minutes || 0 }}</td><td>{{ data.p[name]?.goals || 0 }}</td><td>{{ data.p[name]?.assists || 0 }}</td><td>{{ data.p[name]?.captaincies || 0 }}</td><td>{{ data.p[name]?.motm || 0 }}</td><td>{{ data.p[name]?.potm || 0 }}</td><td>{{ data.p[name]?.cleanSheets || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ion-card-content>
  </ion-card>
  <div class="section-heading compact">
    <div><span class="eyebrow">RECENT FIXTURES</span><h2>Match history</h2></div>
  </div>
  <ion-card class="surface-card">
    <ion-card-content>
      <div
        v-for="(match, index) in data.matches"
        :key="`${match.date}-${index}`"
        class="history-row"
      >
        <div
          class="history-result"
          :class="(match.result || 'd').toLowerCase()"
        >
          {{ match.result || '—' }}
        </div><div class="history-info">
          <b>{{ match.opponent }}</b><small>{{ new Date(match.date).toLocaleDateString() }}</small>
        </div><strong>{{ match.score }}–{{ match.against }}</strong>
        <div class="history-meta">
          {{ match.periodType === 'halves' ? '2 halves' : '4 quarters' }} · {{ match.formation || 'Formation not recorded' }} · Captain: {{ match.captain || '—' }}
          <span v-if="match.motm"> · MOTM: {{ match.motm }}</span><span v-if="match.potm"> · Parents’ player: {{ match.potm }}</span>
        </div>
        <details
          v-if="match.quarterLineups?.some(Boolean)"
          class="match-lineup-details"
        >
          <summary>Lineups and positions</summary>
          <div
            v-for="(lineup, periodIndex) in match.quarterLineups"
            :key="periodIndex"
          >
            <b>{{ match.periodType === 'halves' ? `Half ${periodIndex + 1}` : `Quarter ${periodIndex + 1}` }}:</b>
            <span v-if="lineup">{{ lineup.starters.map((player) => `${player} (${lineup.positions?.[player] || '—'})`).join(', ') }}</span><span v-else>Not recorded</span>
          </div>
        </details>
      </div><div
        v-if="!data.matches.length"
        class="empty-state"
      >
        Saved matches will show here.
      </div>
    </ion-card-content>
  </ion-card>
  <ion-button
    fill="clear"
    class="danger-button"
    @click="clearSeason"
  >
    Clear season data
  </ion-button>
</template>

<script>
import { IonButton, IonCard, IonCardContent, IonSelect, IonSelectOption } from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';

const seasonView = pitchPalView(['recordText', 'goalDiff', 'players', 'data', 'playerInitial'], ['clearSeason']);

export default {
  ...seasonView,
  components: { IonButton, IonCard, IonCardContent, IonSelect, IonSelectOption },
  data() {
    return { sortBy: 'apps' };
  },
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => (this.data.p[b]?.[this.sortBy] || 0) - (this.data.p[a]?.[this.sortBy] || 0));
    },
    seasonSummary() {
      const matches = this.data.matches || [];
      return {
        games: matches.length,
        wins: matches.filter((match) => match.result === 'W').length,
        draws: matches.filter((match) => match.result === 'D').length,
        losses: matches.filter((match) => match.result === 'L').length,
        goalsFor: matches.reduce((total, match) => total + Number(match.score || 0), 0),
        goalsAgainst: matches.reduce((total, match) => total + Number(match.against || 0), 0),
      };
    },
    ...seasonView.computed,
  },
};
</script>
