<template>
  <div class="setup-section-title">
    <h2>Set up your next <span>match.</span></h2>
  </div>
  <ion-card class="surface-card">
    <ion-card-content>
      <p class="setup-card-description">Choose an opponent and set the match format.</p>
      <ion-label
        class="field-label"
        for="opponent-input"
      >
        Opponent
      </ion-label><ion-input
        id="opponent-input"
        v-model="opponent"
        placeholder="e.g. Riverside Juniors"
        class="input-control"
        aria-label="Opponent"
      />
      <ion-label
        id="match-format-label"
        class="field-label spaced"
      >
        Match format
      </ion-label>
      <ion-segment
        :value="periodType"
        aria-labelledby="match-format-label"
        @ion-change="switchSplit($event.detail.value)"
      >
        <ion-segment-button value="quarters">
          <ion-label>4 Quarters</ion-label>
        </ion-segment-button><ion-segment-button value="halves">
          <ion-label>2 Halves</ion-label>
        </ion-segment-button>
      </ion-segment>
      <div class="two-fields">
        <div>
          <ion-label
            id="period-length-label"
            class="field-label spaced"
            for="period-length-input"
          >
            {{ periodType === 'quarters' ? 'Minutes per quarter' : 'Minutes per half' }}
          </ion-label><ion-input
            id="period-length-input"
            v-model.number="periodLength"
            type="number"
            min="1"
            step="0.5"
            class="input-control"
            aria-labelledby="period-length-label"
          />
        </div><div>
          <ion-label
            id="setup-formation-label"
            class="field-label spaced"
          >
            Formation
          </ion-label><ion-select
            v-model="formation"
            interface="popover"
            class="input-control"
            aria-labelledby="setup-formation-label"
          >
            <ion-select-option
              v-for="item in formations"
              :key="item"
              :value="item"
            >
              {{ item }}
            </ion-select-option>
          </ion-select>
        </div>
      </div>
      <div class="setup-note">
        <span
          class="live-dot"
          aria-hidden="true"
        /><span>{{ availablePlayers.length }} players available · {{ periodCount * periodLength }} minutes total</span>
      </div>
    </ion-card-content>
  </ion-card>
  <ion-button
    expand="block"
    class="primary-button"
    @click="tab = 'Squad'"
  >
    Build your squad <span aria-hidden="true">→</span>
  </ion-button>
  <div class="section-heading">
    <div><span class="eyebrow">THE SEASON</span><h2>Your squad so far</h2></div><button
      type="button"
      class="text-link"
      @click="tab = 'Season'"
    >
      View stats ↗
    </button>
  </div>
  <div class="quick-stats">
    <div class="quick-stat">
      <small>GAMES</small><strong>{{ data.matches.length }}</strong>
    </div><div class="quick-stat">
      <small>RECORD</small><strong>{{ recordText }}</strong>
    </div><div class="quick-stat">
      <small>GOAL DIFF.</small><strong>{{ goalDiff > 0 ? '+' : '' }}{{ goalDiff }}</strong>
    </div>
  </div>
</template>

<script>
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';

export default {
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonInput,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
  },
  ...pitchPalView(['opponent', 'periodType', 'periodLength', 'periodCount', 'formation', 'formations', 'availablePlayers', 'data', 'recordText', 'goalDiff', 'tab'], ['switchSplit']),
};
</script>
