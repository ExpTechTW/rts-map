<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";

import ConfigTile from "@/components/config/ConfigTile.vue";
import MaterialSymbols from "@/components/misc/MaterialSymbols.vue";

import { WaveConfig } from "@/class/config_manager";

import { useI18n } from "vue-i18n";
import Global from "@/global";

const i18n = useI18n();

const props = defineProps<{
  waveConfig: WaveConfig;
  index: number;
}>();

const removeItem = () => {
  Global.config.config["wave.list"].splice(props.index, 1);
};
</script>

<template>
  <div class="wave-config-item">
    <div class="wave-config-item-actions">
      <Button severity="secondary" text rounded @click.prevent="removeItem">
        <template #icon>
          <MaterialSymbols icon="delete" :size="20" rounded />
        </template>
      </Button>
      <span>{{ i18n.t("config.wave.enabled.$name") }} #{{ index + 1 }}</span>
    </div>
    <ConfigTile v-for="(wc, wk) in waveConfig">
      <template #title>
        <span>{{ i18n.t(`config.wave.list.${wk}.$name`) }}</span>
      </template>
      <template #subtitle>
        <span>{{ i18n.t(`config.wave.list.${wk}.$description`) }}</span>
      </template>
      <template #trailing>
        <InputText
          v-if="typeof waveConfig[wk] == 'string'"
          :invalid="!waveConfig[wk].length"
          v-model="waveConfig[wk]"
          style="width: 100px; text-align: right"
        />
        <SelectButton
          v-else-if="Array.isArray(wc)"
          v-model="waveConfig[wk]"
          :options="['x', 'y', 'z']"
          :invalid="!waveConfig[wk].length"
          multiple
        />
      </template>
    </ConfigTile>
  </div>
</template>

<style scoped>
.wave-config-item {
  padding: 0px;
  margin: 4px;
  background-color: color-mix(in lab, transparent, var(--p-surface-700) 40%);
  border: 1px solid var(--p-surface-700);
  border-radius: 8px;
}

.wave-config-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--p-surface-400);
}
</style>
