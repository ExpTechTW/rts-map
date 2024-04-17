<script setup lang="ts">
import "material-symbols";

withDefaults(
  defineProps<{
    name: string;
    rounded?: boolean;
    size?: number;
  }>(),
  {
    rounded: true,
    size: 24,
  }
);
</script>

<template>
  <div
    :class="`material-symbols${rounded ? '-rounded' : ''}`"
    :style="{ height: `${size}px`, width: `${size}px` }"
  >
    {{ name }}
  </div>
</template>
