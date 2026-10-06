import { isRef } from 'vue';

/** Build an Options API mixin that exposes only the Pitch Pal state/actions a view needs. */
export function pitchPalView(stateKeys, actionKeys = [], extraMethods = {}) {
  const computed = Object.fromEntries(stateKeys.map((key) => [key, {
    get() {
      const value = this.pitchPal[key];
      return isRef(value) ? value.value : value;
    },
    set(value) {
      const stateValue = this.pitchPal[key];
      if (isRef(stateValue)) stateValue.value = value;
      else this.pitchPal[key] = value;
    },
  }]));

  const methods = Object.fromEntries(actionKeys.map((key) => [key, function callPitchPalAction(...args) {
    return this.pitchPal[key](...args);
  }]));

  return {
    inject: { pitchPal: { from: 'pitchPal' } },
    computed,
    methods: { ...methods, ...extraMethods },
  };
}
