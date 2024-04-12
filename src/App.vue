<script setup lang="ts">
import TitleBar from "@/components/TitleBar.vue";
import Toast from "primevue/toast";

import { useRtsStore } from "@/stores/rts_store";

const rts = useRtsStore();
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
