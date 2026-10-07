<template>
  <div class="match-topline">
    <div>
      <div class="eyebrow">
        {{ opponent || 'MATCH DAY' }}
      </div><h1>{{ matchActive ? currentPeriodTitle : 'Match centre' }}</h1>
    </div><span
      v-if="matchActive"
      class="live-pill"
      role="status"
    ><i aria-hidden="true" />{{ periodRunning ? 'LIVE' : matchReady ? 'READY' : 'PAUSED' }}</span>
  </div>
  <ion-card class="score-card">
    <ion-card-content>
      <div class="score-labels">
        <span>YOUR TEAM</span><span>{{ opponent || 'OPPONENT' }}</span>
      </div>
      <div
        class="scoreline"
        role="group"
        :aria-label="`${homeScore} goals for your team, ${awayScore} goals for ${opponent || 'the opponents'}`"
      >
        <strong>{{ homeScore }}</strong><span aria-hidden="true">:</span><strong>{{ awayScore }}</strong>
      </div>
      <div class="clock-display">
        <span class="visually-hidden">Time remaining in this period: </span>{{ clockText(secondsLeft) }}
      </div>
      <div class="period-progress">
        <span
          v-for="i in periodCount"
          :key="i"
          aria-hidden="true"
          :class="{ done: i < quarter, current: i === quarter }"
        />
      </div>
      <div class="match-actions">
        <ion-button
          class="primary-button"
          @click="matchActive ? toggleClock() : beginMatch()"
        >
          {{ !matchActive || matchReady ? '▶ Start match' : periodRunning ? 'Ⅱ Pause' : '▶ Resume' }}
        </ion-button>
        <ion-button
          v-if="matchActive || matchSaved || events.length || homeScore || awayScore"
          fill="clear"
          class="quiet-button"
          aria-label="Restart match from the beginning"
          @click="restartMatch"
        >
          ↻ Restart match
        </ion-button>
      </div>
      <div
        v-if="matchActive"
        class="goal-entry"
      >
        <ion-select
          v-model="goalScorer"
          interface="popover"
          placeholder="Goal scorer"
          aria-label="Goal scorer"
        >
          <ion-select-option value="own-goal">
            Opponent own goal
          </ion-select-option><ion-select-option
            v-for="name in availablePlayers"
            :key="name"
            :value="name"
          >
            {{ name }}
          </ion-select-option>
        </ion-select><ion-select
          v-model="goalAssist"
          interface="popover"
          placeholder="Assist (optional)"
          aria-label="Assist (optional)"
        >
          <ion-select-option value="">
            No assist
          </ion-select-option><ion-select-option
            v-for="name in availablePlayers"
            :key="name"
            :value="name"
          >
            {{ name }}
          </ion-select-option>
        </ion-select><ion-button
          class="soft-button"
          :disabled="!goalScorer"
          @click="registerGoal"
        >
          Add goal
        </ion-button><ion-button
          fill="clear"
          class="quiet-button"
          aria-label="Add an opponent goal"
          @click="addOpponentGoal"
        >
          + Opponent goal
        </ion-button>
      </div>
      <ion-button
        v-if="matchActive"
        expand="block"
        class="next-button"
        @click="nextPeriod"
      >
        {{ quarter === periodCount ? 'Finish match' : `Next ${periodName}` }} <span aria-hidden="true">→</span>
      </ion-button>
    </ion-card-content>
  </ion-card>
  <div
    v-if="matchActive && bench.length"
    class="section-heading compact"
  >
    <div><span class="eyebrow">FAIR-PLAY ROTATION</span><h2>Make a substitution</h2></div>
  </div>
  <ion-card
    v-if="matchActive && bench.length"
    class="surface-card"
  >
    <ion-card-content>
      <div class="sub-controls">
        <ion-select
          v-model="selectedOut"
          interface="popover"
          placeholder="Player off"
          aria-label="Player going off"
        >
          <ion-select-option
            v-for="name in substitutionCandidates"
            :key="name"
            :value="name"
          >
            {{ name }} · {{ formatMinutes(seconds[name]) }}m
          </ion-select-option>
        </ion-select><span aria-hidden="true">→</span><ion-select
          v-model="selectedIn"
          interface="popover"
          placeholder="Player on"
          aria-label="Player coming on"
        >
          <ion-select-option
            v-for="name in bench"
            :key="name"
            :value="name"
          >
            {{ name }} · {{ formatMinutes(seconds[name]) }}m
          </ion-select-option>
        </ion-select>
      </div><ion-button
        expand="block"
        class="soft-button"
        aria-label="Confirm player substitution"
        :disabled="!selectedOut || !selectedIn"
        @click="substitute"
      >
        Confirm substitution
      </ion-button>
    </ion-card-content>
  </ion-card>
  <div class="section-heading compact">
    <div><span class="eyebrow">ON THE PITCH</span><h2>{{ starters.length }} players</h2></div><button
      class="text-link"
      type="button"
      @click="tab = 'Events'"
    >
      Events ↗
    </button>
  </div>
  <div class="live-list">
    <div
      v-for="name in starters"
      :key="name"
      class="live-player"
    >
      <span
        class="avatar avatar-on"
        aria-hidden="true"
      >{{ playerInitial(name) }}</span><b>{{ name }}</b><span class="position-tag">{{ playerPositions[name] }}</span><strong>{{ formatMinutes(seconds[name]) }}m</strong>
    </div>
  </div>
  <div
    v-if="matchActive || (!matchSaved && (homeScore || awayScore || events.length))"
    class="award-row"
  >
    <label>Man of the match<ion-select
      v-model="motm"
      interface="popover"
      placeholder="Choose"
      aria-label="Man of the match"
    ><ion-select-option
      v-for="name in matchParticipants"
      :key="name"
      :value="name"
    >{{ name }}</ion-select-option></ion-select></label><label>Parents’ player<ion-select
      v-model="potm"
      interface="popover"
      placeholder="Choose"
      aria-label="Parents’ player of the match"
    ><ion-select-option
      v-for="name in matchParticipants"
      :key="name"
      :value="name"
    >{{ name }}</ion-select-option></ion-select></label>
  </div>
  <ion-button
    v-if="!matchActive && !matchSaved && (homeScore || awayScore || events.length)"
    expand="block"
    class="primary-button"
    @click="saveMatch"
  >
    Save match to season
  </ion-button>
  <div
    v-if="matchSaved"
    class="saved-banner"
  >
    ✓ Match saved · {{ resultLabel }}
  </div>
  <div class="section-heading compact">
    <div><span class="eyebrow">MATCH LOG</span><h2>Events</h2></div>
  </div>
  <div class="event-list">
    <div
      v-for="(event, index) in events"
      :key="`${event}-${index}`"
      class="event-row"
    >
      <span
        class="event-dot"
        aria-hidden="true"
      />{{ event }}
    </div><div
      v-if="!events.length"
      class="empty-state"
    >
      Match events will appear here.
    </div>
  </div>
</template>

<script>
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';

export default {
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonSelect,
    IonSelectOption,
  },
  ...pitchPalView(['opponent', 'matchActive', 'matchReady', 'currentPeriodTitle', 'tab', 'periodRunning', 'homeScore', 'awayScore', 'clockText', 'secondsLeft', 'periodCount', 'quarter', 'goalScorer', 'goalAssist', 'availablePlayers', 'matchParticipants', 'periodName', 'bench', 'starters', 'selectedOut', 'selectedIn', 'substitutionCandidates', 'seconds', 'motm', 'potm', 'matchSaved', 'resultLabel', 'events'], ['toggleClock', 'beginMatch', 'restartMatch', 'registerGoal', 'addOpponentGoal', 'nextPeriod', 'substitute', 'saveMatch', 'formatMinutes', 'playerInitial', 'playerPositions']),
};
</script>
