<script setup lang="ts">
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";

import TitleBar from "@/components/TitleBar.vue";
import Global from "@/global";
</script>

<template>
  <TitleBar v-if="!Global.config.config['monitor.enabled']" />
  <router-view v-slot="{ Component }">
    <transition name="fade">
      <component :is="Component" />
    </transition>
  </router-view>
  <Toast />
  <ConfirmDialog />
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
