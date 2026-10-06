<template>
  <div class="eyebrow">
    MATCH LOG
  </div><h1>Live <span>events.</span></h1>
  <ion-card class="surface-card">
    <ion-card-content>
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
        No events yet. Start a match to begin.
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script>
import { pitchPalView } from '../mixins/pitchPalView.js';

export default pitchPalView(['events'], []);
</script>
