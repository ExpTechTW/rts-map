<script setup lang="ts">
import RtsMarker from "@/components/map/RtsMarker.vue";

import { Map as MaplibreMap } from "maplibre-gl";
import { onMounted, shallowRef } from "vue";
import { useRtsStore } from "@/stores/rts_store";
import { useStationStore } from "@/stores/station_store";
import type { LngLatBoundsLike, StyleSpecification } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import geojson from "@/assets/tw_county.json";
import { markRaw } from "vue";

const stationStore = useStationStore();
const rtsStore = useRtsStore();

const mapElement = shallowRef<HTMLDivElement>(document.createElement("div"));
const TaiwanBounds = [119.2, 25.33, 122.18, 21.88] as LngLatBoundsLike;
let cameraResetTimer: number;
const map = shallowRef<MaplibreMap>();

onMounted(() => {
  console.log("map mount");

  map.value = markRaw(
    new MaplibreMap({
      container: mapElement.value,
      style: {
        version: 8,
        sources: {
          tw: {
            type: "geojson",
            data: geojson,
          },
        },
        layers: [
          {
            id: "tw_fill",
            source: "tw",
            type: "fill",
            paint: {
              "fill-color": "#71717a",
              "fill-opacity": 0.2,
            },
          },
          {
            id: "tw_outline",
            source: "tw",
            type: "line",
            paint: {
              "line-color": "#71717a",
            },
          },
        ],
      } as StyleSpecification,
      bounds: TaiwanBounds,
    })
  );

  map.value.on("dragstart", () => {
    if (cameraResetTimer != null) {
      window.clearTimeout(cameraResetTimer);
      cameraResetTimer = null;
    }
  });

  map.value.on("dragend", () => {
    if (cameraResetTimer == null) {
      cameraResetTimer = window.setTimeout(() => {
        map.value.fitBounds(TaiwanBounds);
        cameraResetTimer = null;
      }, 3_000);
    }
  });
});
</script>

<template>
  <div id="map-view">
    <div id="map" ref="mapElement" />
    <div class="map-layers">
      <div class="markers">
        <template v-for="(station, id) in stationStore.$state">
          <RtsMarker
            v-if="station.info != undefined"
            :key="id"
            :id="id"
            :map="map"
            :station="station"
            :rts="rtsStore.station[id]"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style>
#map-view,
#map {
  height: 100%;
  width: 100%;
}

.map-layers {
  position: absolute;
}
</style>
