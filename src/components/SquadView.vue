<template>
  <div class="eyebrow">
    YOUR SQUAD
  </div><h1>Pick your <span>seven.</span></h1>
  <div class="period-picker">
    <button
      v-for="i in periodCount"
      :key="i"
      type="button"
      :class="['period-chip', { selected: quarter === i }]"
      :aria-pressed="quarter === i"
      @click="changePeriod(i)"
    >
      {{ periodLabel(i - 1) }}
    </button>
  </div>
  <div class="formation-panel">
    <ion-label
      id="squad-formation-label"
      class="field-label"
    >
      Formation for {{ periodLabel(quarter - 1) }}
    </ion-label><ion-select
      v-model="formation"
      interface="popover"
      aria-labelledby="squad-formation-label"
      @ion-change="rememberLineup"
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
  <div class="section-heading compact">
    <div><h2>Starting lineup</h2><small>{{ starters.length }} of 7 selected · {{ formation }}</small></div><span class="count-badge">{{ starters.length }}/7</span>
  </div>
  <ion-card class="surface-card roster-card">
    <ion-card-content>
      <div
        v-for="name in players"
        :key="name"
        class="roster-row"
        :class="{ chosen: starters.includes(name), unavailable: !data.availability[name] }"
      >
        <button
          class="roster-select"
          type="button"
          :aria-pressed="starters.includes(name)"
          :aria-label="`${starters.includes(name) ? 'Remove' : 'Select'} ${name}${starters.includes(name) ? ' from' : ' for'} starting lineup`"
          :disabled="!data.availability[name] && !starters.includes(name)"
          @click="selectPlayer(name)"
        >
          <span
            class="avatar"
            :class="{ 'avatar-on': starters.includes(name) }"
          >{{ playerInitial(name) }}</span><span class="roster-name"><b>{{ name }}</b><small>{{ !data.availability[name] ? 'Unavailable' : starters.includes(name) ? (playerPositions[name] || 'Starter') : 'Available' }}</small></span><span
            class="select-mark"
            aria-hidden="true"
          >{{ starters.includes(name) ? '✓' : '+' }}</span>
        </button>
        <span
          v-if="starters.includes(name)"
          class="position-tag"
        ><ion-select
          v-model="playerPositions[name]"
          interface="popover"
          :aria-label="`${name} position`"
        ><ion-select-option
          v-for="pos in positionsList"
          :key="pos"
          :value="pos"
        >{{ pos }}</ion-select-option></ion-select></span>
        <button
          class="availability-toggle"
          type="button"
          :aria-label="`${name} availability`"
          :aria-pressed="data.availability[name]"
          @click="toggleAvailability(name)"
        >
          {{ data.availability[name] ? '●' : '○' }}
        </button>
      </div>
    </ion-card-content>
  </ion-card>
  <div class="captain-panel">
    <div><span class="eyebrow">LEAD THE TEAM</span><strong>Match captain</strong></div><ion-select
      v-model="captain"
      interface="popover"
      placeholder="Choose captain"
      aria-label="Match captain"
      @ion-change="setCaptain($event.detail.value || '')"
    >
      <ion-select-option
        v-for="name in availablePlayers"
        :key="name"
        :value="name"
      >
        {{ name }}
      </ion-select-option>
    </ion-select>
  </div>
  <ion-button
    expand="block"
    class="primary-button"
    :disabled="starters.length !== 7"
    @click="beginMatch"
  >
    {{ starters.length === 7 ? 'Ready for kick-off' : `Choose ${7 - starters.length} more` }} <span aria-hidden="true">→</span>
  </ion-button>
</template>

<script>
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';

export default {
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonLabel,
    IonSelect,
    IonSelectOption,
  },
  ...pitchPalView(['players', 'periodCount', 'periodLabel', 'quarter', 'starters', 'formation', 'formations', 'playerPositions', 'positionsList', 'data', 'playerInitial', 'captain', 'availablePlayers'], ['changePeriod', 'selectPlayer', 'toggleAvailability', 'setCaptain', 'beginMatch', 'rememberLineup']),
};
</script>
