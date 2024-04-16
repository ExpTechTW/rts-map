<script setup lang="ts">
import "material-symbols";

defineProps<{
  name: string;
  rounded?: boolean;
}>();
</script>

<template>
  <span :class="`material-symbols${rounded ? '-rounded' : ''}`">
    {{ name }}
  </span>
</template>
