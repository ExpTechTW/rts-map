<script setup lang="ts">
import MaterialSymbols from "@/components/MaterialSymbols.vue";
import MapView from "@/components/MapView.vue";
import WaveView from "@/components/WaveView.vue";

import Button from "primevue/button";

import { useRtsStore } from "@/stores/rts_store";
import { useStationStore } from "@/stores/station_store";
import {
  ExpTechWebsocket,
  SupportedService,
  WebSocketConnectionConfig,
  WebSocketEvent,
} from "@exptechtw/api-wrapper";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";

import type { ChartWaveData } from "@/types";

import Global from "@/global";

const rtsStore = useRtsStore();
const stationStore = useStationStore();
const rtwStore = reactive<Record<number, ChartWaveData>>({});
const time = ref(Date.now());
let timeOffset = 0;
let lifeCucleTimer: number;

const showModal = ref(false);
const isStationLoaded = ref(false);

const route = useRoute();
const router = useRouter();

watch(
  () => route.fullPath,
  (newValue) => {
    showModal.value = newValue != "/";
  }
);

const config = computed<Omit<WebSocketConnectionConfig, "type">>(() => {
  if (!Global.config.config["wave.enabled"]) {
    return {
      key: localStorage.getItem("token"),
      service: [
        SupportedService.RealtimeStation,
        SupportedService.RealtimeWave,
      ],
    };
  }

  return {
    key: localStorage.getItem("token"),
    service: [SupportedService.RealtimeStation, SupportedService.RealtimeWave],
    config: {
      [SupportedService.RealtimeWave]: Global.config.config["wave.list"].map(
        (v) => +v.id
      ),
    },
  };
});

const ws = new ExpTechWebsocket(config.value);

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

ws.on(WebSocketEvent.Ntp, (n) => {
  timeOffset = Date.now() - n.time;
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

const layout = computed(() =>
  Global.config.config["wave.enabled"]
    ? Global.config.config["wave.list"].map((w, index) => ({
        x: 0,
        y: index,
        w: 1,
        h: 1,
        i: `${w.id}`,
      }))
    : []
);

const rowHeight = ref(
  (window.innerHeight -
    (Global.config.config["monitor.enabled"] ? 0 : 32) -
    layout.value.length * 12) /
    layout.value.length
);

const resize = () => {
  rowHeight.value =
    (window.innerHeight -
      (Global.config.config["monitor.enabled"] ? 0 : 32) -
      layout.value.length * 12) /
    layout.value.length;
};

const openConfig = () => {
  router.push("/config");
};

onMounted(() => {
  Global.api.getStations().then((stations) => {
    stationStore.$patch(stations);
    isStationLoaded.value = true;
  });

  lifeCucleTimer = window.setInterval(() => {
    time.value = Date.now() - timeOffset;
  }, 500);

  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  ws.ws.close();
  window.clearInterval(lifeCucleTimer);
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div id="main" :class="{ monitor: Global.config.config['monitor.enabled'] }">
    <Button
      id="nav-config"
      icon="pi-cog"
      severity="secondary"
      @click.prevent="openConfig"
    >
      <template #icon>
        <MaterialSymbols name="settings" rounded />
      </template>
    </Button>
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
            :time="time"
            :id="item.i"
            :type="stationStore.$state[`${item.i}`].net"
            :chart-data="rtwStore[item.i]"
          />
        </template>
      </GridLayout>
    </div>

    <div v-if="showModal" id="modal-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<style>
#main {
  flex: 1;
  display: flex;
}

#modal-view {
  display: grid;
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
  background-color: rgb(0 0 0 / 0.4);
  z-index: 9999;
  pointer-events: all;
  -webkit-app-region: none;
}

#nav-config {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 999;
  pointer-events: all;
  -webkit-app-region: none;
}

.monitor {
  -webkit-app-region: drag;
}

.map-panel {
  flex: 2;
}

.wave-panel {
  flex: 3;
}
</style>
