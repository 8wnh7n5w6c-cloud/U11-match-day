<template>
  <nav
    class="bottom-nav"
    aria-label="Main navigation"
  >
    <button
      v-for="item in items"
      :key="item.name"
      type="button"
      :class="{ active: modelValue === item.name }"
      :aria-current="modelValue === item.name ? 'page' : undefined"
      @click="$emit('update:modelValue', item.name)"
    >
      <span
        class="nav-icon"
        aria-hidden="true"
      >{{ item.icon }}</span><small>{{ item.name }}</small>
    </button>
  </nav>
</template>

<script>
export default {
  props: {
    modelValue: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      items: [
        { name: 'Setup', icon: '⌂' },
        { name: 'Squad', icon: '◉' },
        { name: 'Match', icon: '◷' },
        { name: 'Fair Play', icon: '✳' },
        { name: 'Season', icon: '▤' },
      ],
    };
  },
};
</script>
