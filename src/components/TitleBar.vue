<template>
  <div id="app-title">
    <div class="title">rts-map</div>
    <div class="window-actions">
      <div id="minimize" class="action">🗕</div>
      <div id="close" class="action">🗙</div>
    </div>
  </div>
</template>

<style scoped>
#app-title {
  display: flex;
  left: 0;
  right: 0;
  height: 32px;
  -webkit-app-region: drag;
}

.title {
  flex: 1;
  padding: 8px 16px;
}

.window-actions {
  display: flex;
}
</style>
