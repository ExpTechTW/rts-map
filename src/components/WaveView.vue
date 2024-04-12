<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  TimeSeriesScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartData,
  Point,
} from "chart.js";
import "chartjs-adapter-moment";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  TimeSeriesScale,
  LinearScale,
  LineElement,
  PointElement
);

defineProps<{
  chartData: ChartData<"line", Point[], unknown>;
}>();
</script>

<template>
  <Line
    v-if="chartData != undefined"
    :options="{
      responsive: true,
      animation: false,
      parsing: false,
      elements: {
        point: {
          radius: 0,
        },
      },
      scales: {
        xAxis: {
          type: 'timeseries',
          axis: 'x',
          display: false,
        },
        yAxis: {
          type: 'linear',
          axis: 'y',
          max: 20,
          min: -20,
        },
      },
    }"
    :data="chartData"
  />
</template>
