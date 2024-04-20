<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { type Map as MaplibreMap, Marker } from "maplibre-gl";
import { RtsStation, Station } from "@exptechtw/api-wrapper";
import { scale } from "chroma-js";

const intensityColor = scale([
  "#0500A3",
  "#00ceff",
  "#33ff34",
  "#fdff32",
  "#ff8532",
  "#fc5235",
  "#c03e3c",
  "#9b4544",
  "#9a4c86",
  "#b720e9",
]).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

const props = defineProps<{
  map: MaplibreMap;
  station: Station;
  rts?: RtsStation;
}>();

const stationInfo = props.station.info[0];
const markerElement = shallowRef<HTMLDivElement>();

const getRtsColor = (rts: RtsStation): string => {
  if (rts?.i == undefined) {
    return "";
  }
  return intensityColor(rts.i).hex();
};

onMounted(() => {
  const marker = new Marker({
    element: markerElement.value,
  })
    .setLngLat([stationInfo.lon, stationInfo.lat])
    .addTo(props.map);
});
</script>

<template>
  <div class="marker" ref="markerElement">
    <div
      class="rts-marker"
      :class="{ alerted: rts?.alert ?? false }"
      :style="{
        backgroundColor: getRtsColor(rts),
        zIndex: rts == undefined ? 0 : rts.alert ? rts.I : rts.i,
      }"
    />
  </div>
</template>

<style scoped>
.rts-marker {
  width: 8px;
  height: 8px;
  border-radius: 8px;
  outline: 1px solid var(--p-surface-500);
}

.rts-marker.alerted {
  outline: 2px solid var(--p-surface-200);
}
</style>
