<script setup lang="ts">
import { onMounted } from "vue";
import { Map as MaplibreMap } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import geojson from "@/assets/tw_county.json";
import { shallowRef } from "vue";

const mapElement = shallowRef<HTMLDivElement>(document.createElement("div"));

onMounted(() => {
  console.log("map mount");

  const map = new MaplibreMap({
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
            "fill-color": "#27272a",
          },
        },
        {
          id: "tw_outline",
          source: "tw",
          type: "line",
          paint: {
            "line-color": "#52525b",
          },
        },
      ],
    } as StyleSpecification,
    bounds: [119.2, 25.33, 122.18, 21.88],
  });
});
</script>

<template>
  <div id="map" ref="mapElement" />
</template>

<style>
#map {
  height: 100%;
  width: 100%;
}
</style>
