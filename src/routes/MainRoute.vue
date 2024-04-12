<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import WaveView from "@/components/WaveView.vue";

import { useRtsStore } from "@/stores/rts_store";
import { useStationStore } from "@/stores/station_store";
import {
  ExpTechWebsocket,
  SupportedService,
  WebSocketEvent,
} from "@exptechtw/api-wrapper";
import { onBeforeUnmount } from "vue";
import { onMounted } from "vue";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import Global from "@/global";
import { ChartData, Point } from "chart.js";
import { markRaw } from "vue";

const router = useRouter();
const rtsStore = useRtsStore();
const stationStore = useStationStore();
const rtwStore = reactive<Record<number, ChartData<"line", Point[], unknown>>>(
  {}
);

const ws = new ExpTechWebsocket({
  key: localStorage.getItem("token"),
  service: [SupportedService.RealtimeStation, SupportedService.RealtimeWave],
  config: {
    [SupportedService.RealtimeWave]: [11366940],
  },
});

ws.on(WebSocketEvent.Info, (info) => {
  console.log(ws.ws.url);

  if (info.code == 401) {
    if (info.message == "Invaild key!") {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }
});

ws.on(WebSocketEvent.Rts, (rts) => {
  rtsStore.$patch(rts);
});

ws.on(WebSocketEvent.Rtw, (rtw) => {
  try {
    if (rtwStore[rtw.id] == undefined) {
      rtwStore[rtw.id] = {
        datasets: [
          { label: "X", data: [], borderColor: "rgba(255,80,80,0.2)" },
          { label: "Y", data: [], borderColor: "rgba(80,255,80,0.2)" },
          { label: "Z", data: [], borderColor: "rgb(80,80,255)" },
        ],
      } as ChartData<"line", Point[], unknown>;
    }

    const interval = 500 / rtw.X.length;

    // X
    rtwStore[rtw.id].datasets[0].data.splice(0, rtw.X.length);
    rtwStore[rtw.id].datasets[0].data.push(
      ...rtw.X.map((h, i) => ({ x: rtw.time + interval * i, y: h }))
    );

    // Y
    rtwStore[rtw.id].datasets[1].data.splice(0, rtw.Y.length);
    rtwStore[rtw.id].datasets[1].data.push(
      ...rtw.Y.map((h, i) => ({ x: rtw.time + interval * i, y: h }))
    );

    // Z
    rtwStore[rtw.id].datasets[2].data.splice(0, rtw.Z.length);
    rtwStore[rtw.id].datasets[2].data.push(
      ...rtw.Z.map((h, i) => ({ x: rtw.time + interval * i, y: h }))
    );
  } catch (error) {
    console.log(error);
  }
});

const layout = reactive(
  ws.websocketConfig.config
    ? ws.websocketConfig.config[SupportedService.RealtimeWave].map(
        (id, index) => ({
          x: 0,
          y: index,
          w: 1,
          h: 1,
          i: id,
        })
      )
    : []
);

const rowHeight = ref(
  (window.innerHeight - 32 - layout.length * 12) / layout.length
);

const resize = () => {
  rowHeight.value =
    (window.innerHeight - 32 - layout.length * 12) / layout.length;
};

onMounted(() => {
  Global.api.getStations().then((stations) => {
    stationStore.$patch(stations);
  });

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
          <WaveView :chart-data="rtwStore[item.i]" />
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
