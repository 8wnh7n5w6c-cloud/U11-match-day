<template>
  <div class="eyebrow">
    THE BIG PICTURE
  </div><h1>Your season <span>so far.</span></h1>
  <div class="season-hero">
    <small>MATCH RECORD</small><strong>{{ recordText }}</strong><span>Goal difference {{ goalDiff > 0 ? '+' : '' }}{{ goalDiff }}</span>
  </div>
  <div class="section-heading compact">
    <div><span class="eyebrow">PLAYER STATS</span><h2>Minutes and appearances</h2></div>
  </div>
  <ion-card class="surface-card">
    <ion-card-content class="season-table">
      <div
        v-for="name in [...players].sort((a, b) => (data.p[b]?.minutes || 0) - (data.p[a]?.minutes || 0))"
        :key="name"
        class="season-player"
      >
        <span
          class="avatar"
          aria-hidden="true"
        >{{ playerInitial(name) }}</span><b>{{ name }}</b><span>{{ data.p[name]?.apps || 0 }} apps</span><span>{{ data.p[name]?.goals || 0 }}G · {{ data.p[name]?.assists || 0 }}A</span><strong>{{ data.p[name]?.minutes || 0 }}m</strong>
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
          :class="match.result.toLowerCase()"
        >
          {{ match.result }}
        </div><div class="history-info">
          <b>{{ match.opponent }}</b><small>{{ new Date(match.date).toLocaleDateString() }}</small>
        </div><strong>{{ match.score }}–{{ match.against }}</strong>
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
import { pitchPalView } from '../mixins/pitchPalView.js';

export default pitchPalView(['recordText', 'goalDiff', 'players', 'data', 'playerInitial'], ['clearSeason']);
</script>
