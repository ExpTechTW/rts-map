<script setup lang="ts">
import TitleBar from "@/components/TitleBar.vue";
import Toast from "primevue/toast";

import { useRts } from "@/stores/rts";

const rts = useRts();

console.log(rts);
</script>

<template>
  <TitleBar />
  <router-view v-slot="{ Component }">
    <transition name="fade">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  <Toast />
</template>
