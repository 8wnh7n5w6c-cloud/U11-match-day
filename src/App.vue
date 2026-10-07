<template>
  <IonApp :style="teamColorStyle">
    <IonPage>
      <IonContent class="main-content">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">
              P
            </div>
            <div>
              <strong>Pitch Pal</strong>
              <small>Match day, made simple</small>
            </div>
          </div>
          <div class="top-date">
            {{ today }}
          </div>
        </header>
        <main class="page-shell">
          <component :is="activeView" />
        </main>
      </IonContent>
      <BottomNav v-model="activeTab" />
    </IonPage>
  </IonApp>
</template>

<script>
import { markRaw } from 'vue';
import { IonApp, IonContent, IonPage } from '@ionic/vue';
import BottomNav from './components/BottomNav.vue';
import EventsView from './components/EventsView.vue';
import FairPlayView from './components/FairPlayView.vue';
import MatchView from './components/MatchView.vue';
import SeasonView from './components/SeasonView.vue';
import SetupView from './components/SetupView.vue';
import SquadView from './components/SquadView.vue';
import { usePitchPal } from './composables/usePitchPal.js';

const views = {
  Setup: SetupView,
  Squad: SquadView,
  Match: MatchView,
  Events: EventsView,
  'Fair Play': FairPlayView,
  Season: SeasonView,
};

export default {
  components: {
    IonApp,
    IonContent,
    IonPage,
    BottomNav,
  },
  provide() {
    return { pitchPal: this.pitchPal };
  },
  data() {
    return {
      pitchPal: markRaw(usePitchPal()),
      today: new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    };
  },
  computed: {
    teamColorStyle() {
      const selection = this.pitchPal.teamColours.find((colour) => colour.value === this.pitchPal.teamColor.value);
      const background = selection?.background || '#bbf7d0';
      const foreground = selection?.foreground || '#052e16';
      const toRgb = (hex) => hex.match(/[\da-f]{2}/gi).map((channel) => Number.parseInt(channel, 16)).join(', ');
      return {
        '--team-player-color': background,
        '--team-player-text': foreground,
        '--team-accent': background,
        '--team-accent-contrast': foreground,
        '--ion-color-primary': background,
        '--ion-color-primary-rgb': toRgb(background),
        '--ion-color-primary-contrast': foreground,
        '--ion-color-primary-contrast-rgb': toRgb(foreground),
        '--ion-color-primary-shade': background,
        '--ion-color-primary-tint': background,
      };
    },
    activeView() {
      return views[this.pitchPal.tab.value] || SetupView;
    },
    activeTab: {
      get() {
        return this.pitchPal.tab.value;
      },
      set(value) {
        this.pitchPal.tab.value = value;
      },
    },
  },
  mounted() {
    this.pitchPal.restoreMatch();
  },
  beforeUnmount() {
    this.pitchPal.dispose();
  },
};
</script>
