<template>
  <div class="eyebrow">
    PLAYING-TIME BALANCE
  </div><h1>Fair play,<br><span>made visible.</span></h1>
  <div class="score-grid">
    <ion-card class="fair-score-card">
      <ion-card-content><small>MATCH FAIRNESS</small><strong>{{ matchActive || events.length ? `${matchFairness}%` : '—' }}</strong><span>Available players this match</span></ion-card-content>
    </ion-card><ion-card class="fair-score-card season-score">
      <ion-card-content><small>SEASON FAIRNESS</small><strong>{{ seasonFairness === null ? '—' : `${seasonFairness}%` }}</strong><span>Across saved matches</span></ion-card-content>
    </ion-card>
  </div>
  <div class="fair-explainer">
    These scores show how evenly playing time has been shared. They are not ratings of players or performance.
  </div>
  <ion-card class="surface-card">
    <ion-card-header><ion-card-title>Fairness by match</ion-card-title></ion-card-header><ion-card-content class="fair-list">
      <div
        v-for="match in matchFairnessHistory"
        :key="match.id"
        class="fair-row match-fair-row"
      >
        <span class="fair-name match-fair-info"><i
          aria-hidden="true"
          :class="`traffic ${match.color}`"
        /><span><b>{{ match.opponent }}</b><small>{{ match.date }} · {{ match.score }}–{{ match.against }}</small></span></span><strong>{{ match.fairness === null ? '—' : `${match.fairness}%` }}</strong>
      </div>
      <div
        v-if="!matchFairnessHistory.length"
        class="empty-state"
      >
        Save a match to see its playing-time fairness.
      </div>
    </ion-card-content>
  </ion-card>
  <ion-card class="surface-card">
    <ion-card-header>
      <ion-card-title>Season balance</ion-card-title><p class="card-subtitle">
        Priority today: <b>{{ seasonRows[0]?.name || '—' }}</b>
      </p>
    </ion-card-header><ion-card-content class="fair-list">
      <div
        v-for="(player, index) in seasonRows"
        :key="player.name"
        class="fair-row"
      >
        <span class="fair-name"><i
          aria-hidden="true"
          :class="`traffic ${fairnessColor(index, seasonRows.length)}`"
        /><b>{{ player.name }}</b></span><strong>{{ Math.round(player.total) }} min <small>· {{ Math.round(player.average) }} avg</small></strong>
      </div>
      <div
        v-if="!data.matches.length"
        class="empty-state"
      >
        Save a match to begin the season comparison.
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script>
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';
import { scoreEvenness } from '../domain/fairness.js';

const view = pitchPalView(['matchActive', 'events', 'matchFairness', 'seasonFairness', 'seasonRows', 'data'], ['fairnessColor']);

export default {
  components: {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  },
  ...view,
  computed: {
    ...view.computed,
    matchFairnessHistory() {
      return (this.data.matches || []).map((match, index) => {
        const availability = match.matchAvailability || {};
        const minutes = Object.keys(availability)
          .filter((name) => availability[name])
          .map((name) => Number(match.playerMinutes?.[name] || 0));
        const fairness = minutes.length && minutes.some((value) => value > 0)
          ? scoreEvenness(minutes)
          : null;
        const parsedDate = new Date(match.date);
        const date = Number.isNaN(parsedDate.getTime())
          ? 'Date unavailable'
          : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parsedDate);

        return {
          id: `${match.date || 'match'}-${index}`,
          opponent: match.opponent || 'Unknown opponent',
          date,
          score: Number(match.score || 0),
          against: Number(match.against || 0),
          fairness,
          color: fairness === null || fairness < 60 ? 'red' : fairness < 80 ? 'amber' : 'green',
        };
      });
    },
  },
};
</script>
