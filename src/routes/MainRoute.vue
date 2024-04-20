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
import { useI18n } from "vue-i18n";

import type { ChartWaveData, PointGroup } from "@/types";
import Global from "@/global";

const i18n = useI18n();
const rtsStore = useRtsStore();
const stationStore = useStationStore();
const rtwStore = reactive<Record<string, ChartWaveData>>({});
const time = ref(Date.now());
let timeOffset = 0;
let lifeCucleTimer: number;

const alertAudio = ref<HTMLAudioElement>();
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

const compare = (a: number, method: string, b: number): boolean => {
  switch (method) {
    case ">":
      return a > b;
    case "<":
      return a < b;
    case "=":
      return a == b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    default:
      return false;
  }
};

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

  if (Global.config.config["alert.enabled"]) {
    for (const c of Global.config.config["alert.list"]) {
      if (!c.name.length) continue;

      const list = Object.keys(rts.station).filter((id) => {
        return compare(
          c.condition[2] == "realtime" ? rts.station[id].i : rts.station[id].I,
          c.condition[3],
          c.condition[4]
        );
      });

      switch (c.condition[0]) {
        case "exactly": {
          if (c.condition[1] != list.length) continue;
        }

        case "least": {
          c.condition[1];
          if (c.condition[1] > list.length) continue;
        }

        case "id": {
          if (!list.includes(`${c.condition[1]}`)) continue;
        }

        default:
          break;
      }

      if (c.name == "alert") {
        alertAudio.value.play();
      } else {
        const audio = new Audio(c.name);
        audio.volume = c.volume;
        audio.play();
      }
    }
  }
});

ws.on(WebSocketEvent.Rtw, (rtw) => {
  try {
    const config = Global.config.config["wave.list"].find(
      (v) => v.id == `${rtw.id}`
    );

    if (!config) return;

    rtw.time =
      rtw.time % 1000 >= 500
        ? ~~(rtw.time / 1000) * 1000 + 500
        : ~~(rtw.time / 1000) * 1000;

    if (rtwStore[rtw.id] == undefined) {
      rtwStore[rtw.id] = {
        X: [],
        Y: [],
        Z: [],
      };
    }

    const interval = 500 / rtw.X.length;

    // X
    if (config.axis.includes("x")) {
      const data = {
        startTime: rtw.time,
        endTime: rtw.time + 500,
        isEmpty: false,
        data: rtw.X.map((h, i) => {
          const time = rtw.time + interval * i;
          return { name: `${time}`, value: [time, h * 10000] };
        }),
      } as PointGroup;

      const targetIndex = rtwStore[rtw.id].X.findIndex(
        (v) => v.isEmpty && v.startTime == rtw.time
      );

      if (targetIndex >= 0) {
        rtwStore[rtw.id].X.splice(targetIndex, 1, data);
      } else {
        rtwStore[rtw.id].X.push(data);
      }

      while (rtwStore[rtw.id].X.length > 60) {
        rtwStore[rtw.id].X.shift();
      }
    }

    // Y
    if (config.axis.includes("y")) {
      const data = {
        startTime: rtw.time,
        endTime: rtw.time + 500,
        isEmpty: false,
        data: rtw.Y.map((h, i) => {
          const time = rtw.time + interval * i;
          return { name: `${time}`, value: [time, h * 10000] };
        }),
      } as PointGroup;

      const targetIndex = rtwStore[rtw.id].Y.findIndex(
        (v) => v.isEmpty && v.startTime == rtw.time
      );

      if (targetIndex >= 0) {
        rtwStore[rtw.id].Y.splice(targetIndex, 1, data);
      } else {
        rtwStore[rtw.id].Y.push(data);
      }

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
    }

    // Z
    if (config.axis.includes("z")) {
      const data = {
        startTime: rtw.time,
        endTime: rtw.time + 500,
        isEmpty: false,
        data: rtw.Z.map((h, i) => {
          const time = rtw.time + interval * i;
          return { name: `${time}`, value: [time, h * 10000] };
        }),
      } as PointGroup;

      const targetIndex = rtwStore[rtw.id].Z.findIndex(
        (v) => v.isEmpty && v.startTime == rtw.time
      );

      if (targetIndex >= 0) {
        rtwStore[rtw.id].Z.splice(targetIndex, 1, data);
      } else {
        rtwStore[rtw.id].Z.push(data);
      }

      while (rtwStore[rtw.id].Z.length > 60) {
        rtwStore[rtw.id].Z.shift();
      }
    }
  } catch (error) {
    console.log(error);
  }
});

const layout = computed(() =>
  Global.config.config["wave.enabled"]
    ? Global.config.config["wave.list"].flatMap((w, index) =>
        w.id.length
          ? [
              {
                x: 0,
                y: index,
                w: 1,
                h: 1,
                i: `${w.id}`,
              },
            ]
          : []
      )
    : []
);

const getChartData = (id: string) => {
  if (!(id in rtwStore)) {
    rtwStore[id] = {
      X: [],
      Y: [],
      Z: [],
    };
  }

  return rtwStore[id];
};

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

Global.config.on("change", () => {
  resize();

  if (Global.config.config["app.locale"] != i18n.locale.value) {
    i18n.locale.value =
      Global.config.config["app.locale"] || navigator.language;
  }

  if (!Global.config.config["wave.enabled"]) return;

  const current = config.value.config[SupportedService.RealtimeWave];

  if (current != ws.websocketConfig?.config[SupportedService.RealtimeWave]) {
    ws.updateConfig(config.value);
  }
});

onMounted(() => {
  Global.api.getStations().then((stations) => {
    stationStore.$patch(stations);
    isStationLoaded.value = true;
  });

  lifeCucleTimer = window.setInterval(() => {
    time.value = Date.now() - timeOffset + 500;
  }, 500);

  window.addEventListener("resize", resize);
  resize();
});

onBeforeUnmount(() => {
  console.log("unmounted");
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
        <MaterialSymbols id="md-config-icon" name="settings" rounded />
      </template>
    </Button>
    <div class="map-panel">
      <MapView />
    </div>
    <div v-if="Global.config.config['wave.enabled']" class="wave-panel">
      <GridLayout
        v-model:layout="layout"
        :col-num="1"
        :max-rows="layout.length"
        :row-height="rowHeight"
        :is-resizable="false"
        is-draggable
        vertical-compact
        use-css-transforms
      >
        <template #item="{ item }">
          <WaveView
            v-if="isStationLoaded && item.i in stationStore.$state"
            :key="`wave-${item.i}`"
            :time="time"
            :id="item.i"
            :type="stationStore.$state[`${item.i}`].net"
            :chart-data="getChartData(item.i)"
          />
        </template>
      </GridLayout>
    </div>

    <div v-if="showModal" id="modal-view">
      <router-view></router-view>
    </div>

    <audio ref="alertAudio" src="/alert.wav"></audio>
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
  z-index: 1000;
  pointer-events: all;
}

#nav-config {
  position: absolute;
  bottom: 8px;
  left: 8px;
  opacity: 0.4;
  transition: opacity 0.2s ease-in-out;
  z-index: 999;
  pointer-events: all;
  -webkit-app-region: none;
}

#nav-config:hover {
  opacity: 1;
}

#nav-config #md-config-icon {
  rotate: 0;
}

#nav-config:hover #md-config-icon {
  rotate: 360deg;
  transition: rotate 0.5s ease-in-out;
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

audio {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}
</style>
