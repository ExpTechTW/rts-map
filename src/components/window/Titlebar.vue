<script setup lang="ts">
import WindowControlButton from "./WindowControlButton.vue";
import { version } from "../../../package.json";
import { onUnmounted, ref } from "vue";

const isMaximized = ref(false);

window.ipcRenderer.onMaximize(() => {
  isMaximized.value = true;
});

window.ipcRenderer.onUnmaximize(() => {
  isMaximized.value = false;
});
</script>

<template>
  <div id="titlebar">
    <div class="titlebar-title">
      <div class="window-icon">
        <img
          class="window-icon"
          src="@/assets/images/icon.png"
          alt="app-icon"
          draggable="false"
        />
      </div>
      <div class="window-title">
        <span class="app-name">rts-map</span>
        <span class="app-version">v{{ version }}</span>
      </div>
    </div>
    <div class="titlebar-action">
      <WindowControlButton type="minimize" />
      <WindowControlButton :type="isMaximized ? 'unmaximize' : 'maximize'" />
      <WindowControlButton type="close" />
    </div>
  </div>
</template>

<style scoped>
#titlebar {
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 16px;
  width: 100svw;
  height: 32px;
  white-space: nowrap;

  -webkit-app-region: drag;
}

.titlebar-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.titlebar-action {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  height: 100%;
  -webkit-app-region: none;
}

.window-icon {
  height: 20px;
  width: 20px;
}

.window-title {
  display: flex;
  gap: 8px;
}

.app-version {
  opacity: 0.6;
  font-size: smaller;
}
</style>
