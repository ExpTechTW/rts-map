<script setup lang="ts">
import TitleBar from "@/components/TitleBar.vue";
import Toast from "primevue/toast";

import Global from "@/global";

import { useRtsStore } from "@/stores/rts_store";

const rts = useRtsStore();
</script>

<template>
  <TitleBar v-if="!Global.config.config['monitor.enabled']" />
  <router-view v-slot="{ Component }">
    <transition name="fade">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  <Toast />
</template>

<style>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  width: 6px;
  border-radius: 8px;
  background-color: var(--p-surface-600);
}
</style>
