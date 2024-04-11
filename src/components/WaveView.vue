<script setup lang="ts">
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { ref } from "vue";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const chartData = ref({
  labels: ["January", "February", "March"],
  datasets: [{ data: [40, 20, 12] }],
});

const chartOptions = ref({
  responsive: true,
});
</script>

<template>
  <Bar :options="chartOptions" :data="chartData" />
</template>
