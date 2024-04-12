<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import WaveView from "@/components/WaveView.vue";
import {
  ExpTechWebsocket,
  SupportedService,
  WebSocketEvent,
} from "@exptechtw/api-wrapper";
import { onBeforeUnmount } from "vue";
import { onMounted } from "vue";
import { markRaw, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const layout = reactive([
  { x: 0, y: 0, w: 1, h: 1, i: "1", component: markRaw(WaveView) },
  { x: 0, y: 3, w: 1, h: 1, i: "2", component: markRaw(WaveView) },
  { x: 0, y: 6, w: 1, h: 1, i: "3", component: markRaw(WaveView) },
  { x: 0, y: 9, w: 1, h: 1, i: "4", component: markRaw(WaveView) },
]);

const rowHeight = ref(
  (window.innerHeight - 32 - layout.length * 12) / layout.length
);

const resize = () => {
  rowHeight.value =
    (window.innerHeight - 32 - layout.length * 12) / layout.length;
};

const ws = new ExpTechWebsocket({
  key: localStorage.getItem("token"),
  service: [SupportedService.RealtimeStation],
});

ws.on(WebSocketEvent.Info, (info) => {
  if (info.code == 401) {
    if (info.message == "Invaild key!") {
      router.replace("/login");
    }
  }
  console.log(info);
});

onMounted(() => {
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  ws.ws.close();
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div id="main">
    <div class="map-panel">
      <MapView />
    </div>
    <div class="wave-panel">
      <GridLayout
        v-model:layout="layout"
        :col-num="1"
        :max-rows="layout.length"
        :row-height="rowHeight"
        is-draggable
        is-resizable
        vertical-compact
        use-css-transforms
      >
        <template #item="{ item }">
          <component :is="item.component" />
        </template>
      </GridLayout>
    </div>
  </div>
</template>

<style>
#main {
  flex: 1;
  display: flex;
}

.map-panel {
  flex: 2;
}

.wave-panel {
  flex: 3;
}
</style>
