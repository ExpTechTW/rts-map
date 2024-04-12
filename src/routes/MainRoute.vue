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

import type { ChartWaveData } from "@/types";

import Global from "@/global";

const router = useRouter();
const rtsStore = useRtsStore();
const stationStore = useStationStore();
const rtwStore = reactive<Record<number, ChartWaveData>>({});

const isStationLoaded = ref(false);

const ws = new ExpTechWebsocket({
  key: localStorage.getItem("token"),
  service: [SupportedService.RealtimeStation, SupportedService.RealtimeWave],
  config: {
    [SupportedService.RealtimeWave]: [
      11366940, 6024428, 13898616, 4812424, 11339620, 6125804,
    ],
  },
});

ws.websocketConfig.config?.[SupportedService.RealtimeWave]?.forEach((id) => {
  rtwStore[id] = {
    X: [],
    Y: [],
    Z: [],
  };
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
        X: [],
        Y: [],
        Z: [],
      };
    }

    const interval = 500 / rtw.X.length;

    // X
    rtwStore[rtw.id].X.push({
      startTime: rtw.time,
      endTime: rtw.time + 500,
      isEmpty: false,
      data: rtw.X.map((h, i) => {
        const time = rtw.time + interval * i;
        return { name: `${time}`, value: [time, h * 10000] };
      }),
    });
    while (rtwStore[rtw.id].X.length > 60) {
      rtwStore[rtw.id].X.shift();
    }

    // Y
    rtwStore[rtw.id].Y.push({
      startTime: rtw.time,
      endTime: rtw.time + 500,
      isEmpty: false,
      data: rtw.Y.map((h, i) => {
        const time = rtw.time + interval * i;
        return { name: `${time}`, value: [time, h * 10000] };
      }),
    });
    while (rtwStore[rtw.id].Y.length > 60) {
      rtwStore[rtw.id].Y.shift();
    }

    // Z
    rtwStore[rtw.id].Z.push({
      startTime: rtw.time,
      endTime: rtw.time + 500,
      isEmpty: false,
      data: rtw.Z.map((h, i) => {
        const time = rtw.time + interval * i;
        return { name: `${time}`, value: [time, h * 10000] };
      }),
    });
    while (rtwStore[rtw.id].Z.length > 60) {
      rtwStore[rtw.id].Z.shift();
    }
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
    isStationLoaded.value = true;
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
          <WaveView
            v-if="isStationLoaded"
            :type="stationStore.$state[`${item.i}`].net"
            :chart-data="rtwStore[item.i]"
          />
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
