<template>
  <h1>Build your<br><span>team profile.</span></h1>
  <ion-card class="surface-card">
    <ion-card-content>
      <p class="setup-card-description">Manage your squad and player names here.</p>
      <ion-label
        class="field-label"
        for="squad-name-input"
      >
        Squad name
      </ion-label><ion-input
        id="squad-name-input"
        v-model="teamName"
        placeholder="e.g. Riverside Rovers"
        class="input-control"
        aria-label="Squad name"
        autocomplete="organization"
      />
      <div class="squad-roster-heading">
        <ion-label class="field-label">Player names</ion-label>
        <span>{{ players.length }} players</span>
      </div>
      <div class="squad-player-list">
        <div
          v-for="player in players"
          :key="player"
          class="squad-player-row"
        >
          <ion-input
            :value="player"
            class="input-control squad-player-input"
            :aria-label="`Name for ${player}`"
            @ion-change="renameSquadPlayer(player, $event)"
          />
          <button
            type="button"
            class="squad-player-remove"
            :aria-label="`Remove ${player} from the squad`"
            @click="removeSquadPlayer(player)"
          >
            🗑
          </button>
        </div>
      </div>
      <div class="squad-add-row">
        <ion-input
          v-model="newPlayerName"
          class="input-control"
          aria-label="New squad player name"
          placeholder="Add a player"
          @keyup.enter="addSquadPlayer"
        />
        <ion-button
          class="soft-button squad-add-button"
          :disabled="!newPlayerName.trim()"
          aria-label="Add player to squad"
          @click="addSquadPlayer"
        >
          <span aria-hidden="true">+</span>
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script>
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonInput,
  IonLabel,
} from '@ionic/vue';
import { pitchPalView } from '../mixins/pitchPalView.js';

export default {
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonInput,
    IonLabel,
  },
  ...pitchPalView(['teamName', 'players'], ['addPlayer', 'renamePlayer', 'removePlayer'], {
    addSquadPlayer() {
      if (this.addPlayer(this.newPlayerName)) this.newPlayerName = '';
    },
    renameSquadPlayer(player, event) {
      if (!this.renamePlayer(player, event.detail.value)) event.target.value = player;
    },
    removeSquadPlayer(player) {
      this.removePlayer(player);
    },
  }),
  data() {
    return { newPlayerName: '' };
  },
};
</script>
