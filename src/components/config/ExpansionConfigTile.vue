<script setup lang="ts">
import MaterialSymbols from "@/components/MaterialSymbols.vue";
import { ref, useSlots } from "vue";

defineProps<{
  disabled?: boolean;
}>();

const isExpanded = ref(false);

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const slots = useSlots();
</script>

<template>
  <div
    class="expansion-config-tile"
    :class="{ expanded: isExpanded && !disabled, disabled }"
    :inert="disabled"
  >
    <div class="config-tile" v-ripple @click="toggleExpanded">
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
      <div class="tile-trailing">
        <MaterialSymbols name="arrow_drop_down" rounded />
      </div>
    </div>
    <div class="content">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>
.expansion-config-tile {
  --p-c-surface-350: color-mix(
    in lab,
    var(--p-surface-300),
    var(--p-surface-400)
  );

  position: relative;
  display: grid;
  grid-template-rows: min-content 0fr;
  width: 100%;
  transition: grid-template-rows 0.4s ease-out, border-bottom 0.4s ease-out;
}

.expansion-config-tile.expanded {
  grid-template-rows: min-content 1fr;
  border-bottom: 1px solid var(--p-surface-600);
  padding-bottom: 4px;
  margin-bottom: 16px;
}

.expansion-config-tile.disabled {
  opacity: 0.4;
  pointer-events: none;
  cursor: not-allowed;
}

.config-tile {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 56px;
  overflow: hidden;
}

.tile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 375px;
  padding-left: 8px;
}

.tile-leading,
.tile-trailing {
  display: grid;
  align-items: center;
  justify-content: center;
  color: var(--p-c-surface-350);
  padding: 0 8px;
}

.tile-trailing {
  transition: rotate 0.1s ease-in-out;
}

.expansion-config-tile.expanded .tile-trailing {
  rotate: 180deg;
}

.tile-subtitle {
  color: var(--p-c-surface-350);
  font-size: 85%;
}

.content {
  pointer-events: none;
  overflow: hidden;
}

.expansion-config-tile.expanded .content {
  pointer-events: all;
}
</style>
