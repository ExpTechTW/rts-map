<template>
  <router-view v-slot="{ Component }">
    <transition name="fade">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<script setup>
console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>
