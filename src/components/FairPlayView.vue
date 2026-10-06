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
    <ion-card-header><ion-card-title>Today’s minutes</ion-card-title></ion-card-header><ion-card-content class="fair-list">
      <div
        v-for="(player, index) in matchRows"
        :key="player.name"
        class="fair-row"
      >
        <span class="fair-name"><i
          aria-hidden="true"
          :class="`traffic ${fairnessColor(index, matchRows.length)}`"
        /><b>{{ player.name }}</b></span><strong>{{ Math.floor(player.seconds / 60) }} min</strong>
      </div>
      <div
        v-if="!matchRows.length"
        class="empty-state"
      >
        Start a match to track playing time.
      </div>
      <div
        v-if="matchActive && matchPriority"
        class="recommendation"
      >
        <div>
          <span
            class="traffic red"
            aria-hidden="true"
          /><strong>{{ matchPriority }} needs about {{ recommendedMinutes }} more {{ recommendedMinutes === 1 ? 'minute' : 'minutes' }}</strong>
        </div><small>Recommended substitution: {{ matchPriority }} ON · {{ clockText(secondsLeft + (periodCount - quarter) * periodLength * 60) }} left in match</small>
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

export default {
  components: {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  },
  ...pitchPalView(['matchActive', 'events', 'matchFairness', 'seasonFairness', 'matchRows', 'matchPriority', 'recommendedMinutes', 'secondsLeft', 'periodCount', 'quarter', 'periodLength', 'clockText', 'seasonRows', 'data'], ['fairnessColor']),
};
</script>
