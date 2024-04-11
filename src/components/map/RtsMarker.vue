<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { Marker } from "maplibre-gl";

const props = defineProps<{
  lnglat: [number, number];
}>();

const element = shallowRef<HTMLDivElement>();

onMounted(() => {
  const marker = new Marker({
    element: element.value,
  }).setLngLat(props.lnglat);
});
</script>

<template>
  <div class="rts-marker" ref="element" />
</template>

<style>
.rts-marker {
}
</style>
