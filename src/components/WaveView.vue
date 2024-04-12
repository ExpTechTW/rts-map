<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { TitleComponent, GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import type { LineSeriesOption } from "echarts/charts";
import type {
  TitleComponentOption,
  GridComponentOption,
} from "echarts/components";

import { ChartWaveData, PointData } from "@/types";

import VChart from "vue-echarts";

use([TitleComponent, GridComponent, LineChart, CanvasRenderer]);

type EChartsOption = ComposeOption<
  TitleComponentOption | GridComponentOption | LineSeriesOption
>;

const props = defineProps<{
  type: string;
  chartData: ChartWaveData;
}>();

const findBounds = (points: PointData[]) => {
  let max = 0;

  for (let i = 0, n = points.length; i < n; i++) {
    const val = Math.abs(points[i].value[1]);

    if (max < val) max = val;
  }

  let scale = props.type == "MS-Net" ? 5 : 2500;
  scale += scale * +(localStorage.getItem("chartYScale") ?? "25");
  max = Math.ceil(max * 100) / 100;
  max += max * 0.1;
  max = Math.max(scale, max);

  return max;
};

const series = computed(() => [
  {
    type: "line",
    showSymbol: false,
    lineStyle: { color: "#f88", width: 1.5 },
    data: props.chartData.X.flatMap((v) => v.data),
  },
  {
    type: "line",
    showSymbol: false,
    lineStyle: { color: "#8f8", width: 1.5 },
    data: props.chartData.Y.flatMap((v) => v.data),
  },
  {
    type: "line",
    showSymbol: false,
    lineStyle: { color: "#88f", width: 1.5 },
    data: props.chartData.Z.flatMap((v) => v.data),
  },
]);

const bounds = computed(() =>
  Math.max(
    findBounds(series.value[0].data),
    findBounds(series.value[1].data),
    findBounds(series.value[2].data)
  )
);

const option = computed(() => ({
  title: {
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
}));
</script>

<template>
  <VChart class="chart" :option="option" />
</template>

<style scoped></style>
