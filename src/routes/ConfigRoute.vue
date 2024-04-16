<script setup lang="ts">
import ConfigTile from "@/components/config/ConfigTile.vue";
import MaterialSymbols from "@/components/MaterialSymbols.vue";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";

import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const configPlaySound = ref(true);

const closeConfig = () => {
  router.back();
};
</script>

<template>
  <div id="config">
    <div class="header">
      <div class="title">設定</div>
      <Button text rounded severity="secondary" @click.prevent="closeConfig">
        <template #icon>
          <MaterialSymbols name="close" rounded />
        </template>
      </Button>
    </div>
    <div class="content row">
      <div class="column">
        <ConfigTile>
          <template #leading>
            <MaterialSymbols name="music_note" rounded />
          </template>
          <template #title>
            <span>播放音效</span>
          </template>
          <template #subtitle>
            <span>在觸發門檻到達時播放警示音效</span>
          </template>
          <template #trailing>
            <InputSwitch v-model="configPlaySound" />
          </template>
        </ConfigTile>
      </div>
      <div class="column"></div>
    </div>
  </div>
</template>

<style>
#config {
  padding: 16px;
  border-radius: 16px;
  background-color: var(--p-surface-800);
  border: 1px solid var(--p-surface-700);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    line-height: 20px;
    font-size: 20px;
    font-weight: 700;
  }

  .row {
    display: flex;
    flex-direction: row;
  }

  .column {
    display: flex;
    flex-direction: column;
  }
}
</style>
