<template>
  <div class="wave-config-item">
    <slot />
  </div>
</template>

<style scoped>
.wave-config-item {
  padding: 0px;
  margin: 4px;
  background-color: color-mix(in lab, transparent, var(--p-surface-700) 40%);
  border: 1px solid var(--p-surface-700);
  border-radius: 8px;
}
</style>
