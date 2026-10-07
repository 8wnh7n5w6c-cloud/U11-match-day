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
  <div class="section-heading compact">
    <div><span class="eyebrow">MATCH LINEUP</span><h2>On the pitch</h2></div>
    <span class="lineup-count">{{ starters.length }}/7</span>
  </div>
  <div
    v-if="starters.length"
    class="match-pitch"
    role="group"
    :aria-label="`${formation} formation on the pitch`"
  >
    <div
      class="pitch-halfway"
      aria-hidden="true"
    />
    <div
      class="pitch-centre-circle"
      aria-hidden="true"
    />
    <div
      class="pitch-box pitch-box-top"
      aria-hidden="true"
    />
    <div
      class="pitch-box pitch-box-bottom"
      aria-hidden="true"
    />
    <div
      v-for="(name, index) in starters"
      :key="name"
      class="pitch-player"
      :class="pitchPlayerState(name)"
      :style="pitchPositionStyle(name, index)"
      :aria-label="`${name}, ${playerPositions[name] || 'position not set'}, ${formatMinutes(seconds[name])} minutes${name === recommendedSubOut && bench.length && matchActive ? ', suggested to come off' : ''}`"
    >
      <span class="pitch-initials">{{ playerInitial(name) }}</span>
      <span class="pitch-position">{{ playerPositions[name] || '—' }}</span>
      <span class="pitch-name">{{ name }}</span>
      <span
        v-if="name === recommendedSubOut && bench.length && matchActive"
        class="pitch-state-label"
      >SUB OFF</span>
      <span
        v-else-if="name === dedicatedGK"
        class="pitch-state-label"
      >KEEPER</span>
    </div>
  </div>
  <div
    v-if="matchActive && !matchReady && bench.length"
    class="fair-play-legend"
    aria-label="Fair play key"
  >
    <span><i class="status-dot status-green" />Next on</span>
    <span><i class="status-dot status-red" />Suggested off</span>
  </div>
  <div class="bench-section">
    <div class="bench-heading">
      <div><span class="eyebrow">SUBSTITUTES</span><h2>Bench</h2></div><span>{{ bench.length }} available</span>
    </div>
    <div
      v-if="bench.length"
      class="bench-list"
    >
      <div
        v-for="name in bench"
        :key="name"
        class="bench-player"
        :class="matchActive && !matchReady && name === matchPriority ? 'status-green' : 'status-neutral'"
      >
        <span class="bench-initials">{{ playerInitial(name) }}</span>
        <span class="bench-player-info"><b>{{ name }}</b><small>{{ formatMinutes(seconds[name]) }} min played</small></span>
        <span
          v-if="matchActive && !matchReady && name === matchPriority"
          class="bench-state-label"
        >NEXT ON</span>
        <span
          v-else
          class="bench-state-label"
        >SUB</span>
      </div>
    </div>
    <div
      v-else
      class="bench-empty"
    >
      No available substitutes.
    </div>
  </div>
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

const matchPitchLayouts = {
  '2-3-1': { GK: [50, 88], LB: [30, 70], RB: [70, 70], LM: [19, 49], CM: [50, 49], RM: [81, 49], ST: [50, 20] },
  '3-2-1': { GK: [50, 88], LB: [23, 70], CM: [50, 70], RB: [77, 70], LM: [35, 48], RM: [65, 48], ST: [50, 20] },
  '2-2-2': { GK: [50, 88], LB: [32, 68], RB: [68, 68], LM: [32, 46], RM: [68, 46], CM: [32, 22], ST: [68, 22] },
  '3-3': { GK: [50, 88], LB: [23, 67], CM: [50, 67], RB: [77, 67], LM: [23, 27], RM: [50, 27], ST: [77, 27] },
};

const matchView = pitchPalView(
  ['opponent', 'matchActive', 'matchReady', 'currentPeriodTitle', 'tab', 'periodRunning', 'homeScore', 'awayScore', 'clockText', 'secondsLeft', 'periodCount', 'quarter', 'goalScorer', 'goalAssist', 'availablePlayers', 'matchParticipants', 'periodName', 'bench', 'starters', 'selectedOut', 'selectedIn', 'substitutionCandidates', 'seconds', 'motm', 'potm', 'matchSaved', 'resultLabel', 'events', 'formation', 'playerPositions', 'dedicatedGK', 'matchPriority'],
  ['toggleClock', 'beginMatch', 'restartMatch', 'registerGoal', 'addOpponentGoal', 'nextPeriod', 'substitute', 'saveMatch', 'formatMinutes', 'playerInitial'],
);

export default {
  ...matchView,
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonSelect,
    IonSelectOption,
  },
  computed: {
    ...matchView.computed,
    recommendedSubOut() {
      if (!this.matchActive || this.matchReady || !this.bench.length) return '';
      return [...this.substitutionCandidates]
        .sort((a, b) => (this.seconds[b] || 0) - (this.seconds[a] || 0))[0] || '';
    },
  },
  methods: {
    ...matchView.methods,
    pitchPositionStyle(name, index) {
      const layout = matchPitchLayouts[this.formation] || matchPitchLayouts['2-3-1'];
      const position = this.playerPositions[name];
      const coords = layout[position] || [15 + ((index % 3) * 35), 25 + (Math.floor(index / 3) * 25)];
      return { left: `${coords[0]}%`, top: `${coords[1]}%` };
    },
    pitchPlayerState(name) {
      if (!this.matchActive) return name === this.dedicatedGK ? 'pitch-player-keeper' : 'pitch-player-idle';
      if (name === this.recommendedSubOut && this.bench.length) return 'pitch-player-off';
      return 'pitch-player-playing';
    },
  },
};
</script>
