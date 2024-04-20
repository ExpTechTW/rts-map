<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { TitleComponent, GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import { ChartWaveData, PointData } from "@/types";
import Global from "@/global";
import codes from "@/assets/code.json";

import VChart from "vue-echarts";
import { useStationStore } from "@/stores/station_store";

use([TitleComponent, GridComponent, LineChart, CanvasRenderer]);

const stationStore = useStationStore();

const props = defineProps<{
  id: string;
  time: number;
  type: string;
  chartData: ChartWaveData;
}>();

const findBounds = (points: PointData[]) => {
  let max = 0;

  for (let i = 0, n = points.length; i < n; i++) {
    const val = Math.abs(points[i].value[1]);

    if (max < val) max = val;
  }

  let scale = props.type == "MS-Net" ? 5 : 3000;
  scale += scale * +(localStorage.getItem("chartYScale") ?? "25");
  max = Math.ceil(max * 100) / 100;
  max += max * 0.1;
  max = Math.max(scale, max);

  return max;
};

const series = computed(() => {
  const data = [];
  const config = Global.config.config["wave.list"].find(
    (e) => e.id == props.id
  );

  if (config.axis.includes("x")) {
    data.push({
      type: "line",
      showSymbol: false,
      lineStyle: { color: "#f88", width: 1.5 },
      data: props.chartData.X.flatMap((v) => v.data),
    });
  }

  if (config.axis.includes("y")) {
    data.push({
      type: "line",
      showSymbol: false,
      lineStyle: { color: "#8f8", width: 1.5 },
      data: props.chartData.Y.flatMap((v) => v.data),
    });
  }

  if (config.axis.includes("z")) {
    data.push({
      type: "line",
      showSymbol: false,
      lineStyle: { color: "#88f", width: 1.5 },
      data: props.chartData.Z.flatMap((v) => v.data),
    });
  }

  return data;
});

const bounds = computed(() =>
  Math.max(
    series.value.length > 0 ? findBounds(series.value[0].data) : 0,
    series.value.length > 1 ? findBounds(series.value[1].data) : 0,
    series.value.length > 2 ? findBounds(series.value[2].data) : 0
  )
);

const option = computed(() => {
  const id = `${props.id}`;
  const code = `${stationStore.$state[id].info[0].code}` as keyof typeof codes;
  const location = codes[code];

  return {
    animation: false,
    title: {
      text: `${location.city} ${location.town} | ${props.type} ${props.id}`,
      textStyle: {
        fontSize: 10,
        fontFamily: "Consolas",
        color: "#888",
      },
    },
    xAxis: {
      type: "time",
      splitLine: {
        show: false,
      },
      show: false,
      min: props.time - 30 * 1000,
      max: props.time,
    },
    yAxis: {
      type: "value",
      animation: false,
      splitLine: {
        show: false,
      },
      splitNumber: 3,
      axisLabel: {
        fontSize: 10,
        inside: true,
      },
      max: bounds.value,
      min: -bounds.value,
    },
    grid: {
      top: 24,
      right: 0,
      bottom: 8,
      left: 0,
    },
    series: series.value,
  };
});
</script>

<template>
  <VChart class="chart" autoresize :option="option" />
</template>
