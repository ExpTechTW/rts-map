<script setup lang="ts">
import { useSlots } from "vue";

const slots = useSlots();
</script>

<template>
  <div class="config-tile">
    <div v-if="slots.leading" class="tile-leading">
      <slot name="leading" />
    </div>
    <div class="tile-content">
      <div class="tile-title">
        <slot name="title" />
      </div>
      <div v-if="slots.subtitle" class="tile-subtitle">
        <slot name="subtitle" />
      </div>
    </div>
    <div v-if="slots.trailing" class="tile-trailing">
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped>
.config-tile {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  min-height: 56px;

  --p-c-surface-350: color-mix(
    in lab,
    var(--p-surface-300),
    var(--p-surface-400)
  );
}

.tile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tile-leading,
.tile-trailing {
  display: grid;
  align-items: center;
  justify-content: center;
  color: var(--p-c-surface-350);
}

.tile-subtitle {
  color: var(--p-c-surface-350);
}
</style>
