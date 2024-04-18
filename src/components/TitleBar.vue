<script setup lang="ts">
const minimizeWindow = () => window.ipcRenderer.minimizeWindow();
const closeWindow = () => window.ipcRenderer.closeWindow();
</script>

<template>
  <div id="app-title">
    <div class="title">
      <img
        class="app-icon"
        src="@/assets/images/icon.png"
        alt="app-icon"
        draggable="false"
      />
      <span>rts-map</span>
    </div>
    <div class="window-actions">
      <button
        type="button"
        id="minimize"
        class="window-action"
        @click="minimizeWindow"
      >
        🗕
      </button>
      <button
        type="button"
        id="close"
        class="window-action"
        @click="closeWindow"
      >
        🗙
      </button>
    </div>
  </div>
</template>

<style scoped>
#app-title {
  display: flex;
  left: 0;
  right: 0;
  min-height: 32px;
  user-select: none;
  -webkit-app-region: drag;
}

.title {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif !important;
}

.app-icon {
  height: 18px;
  width: 18px;
}

.window-actions {
  display: flex;
}

.window-action {
  all: unset;
  display: grid;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 100%;
  transition: background-color 0.1s ease-in-out;
  -webkit-app-region: none;
}

.window-action:hover {
  background-color: var(--p-surface-200);
}

.window-action:active {
  opacity: 0.8;
}

#close:hover {
  color: var(--p-red-50);
  background-color: var(--p-red-600);
}

@media (prefers-color-scheme: dark) {
  .window-action:hover {
    background-color: color-mix(in lab, transparent, var(--p-surface-700));
  }

  #close:hover {
    color: var(--p-red-950);
    background-color: var(--p-red-400);
  }
}
</style>
