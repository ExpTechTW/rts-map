<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import MaterialSymbols from "@/components/MaterialSymbols.vue";
import Slider from "primevue/slider";

import AlertConditionConfig from "@/components/config/alert/AlertConditionConfig.vue";
import ConfigTile from "@/components/config/ConfigTile.vue";

import { AlertConfig } from "@/class/config_manager";
import { useI18n } from "vue-i18n";
import Global from "@/global";

const i18n = useI18n();

const props = defineProps<{
  alertConfig: AlertConfig;
  index: number;
  enableStep: boolean;
}>();

const removeItem = () => {
  Global.config.config["alert.list"].splice(props.index, 1);
};
</script>

<template>
  <div class="alert-config-item">
    <div class="alert-config-item-actions">
      <Button severity="secondary" text rounded @click.prevent="removeItem">
        <template #icon>
          <MaterialSymbols name="delete" :size="20" rounded />
        </template>
      </Button>
      <span>音效設定 #{{ index + 1 }}</span>
    </div>
    <template v-for="(wc, wk) in alertConfig">
      <ConfigTile>
        <template #title>
          <span>{{ i18n.t(`config.alert.list.${wk}.$name`) }}</span>
        </template>
        <template #subtitle>
          <span> {{ i18n.t(`config.alert.list.${wk}.$description`) }}</span>
        </template>
        <template #trailing>
          <InputText
            v-if="typeof alertConfig[wk] == 'string'"
            :invalid="!alertConfig[wk].length"
            v-model="alertConfig[wk]"
            style="width: 100px; text-align: right"
          />

          <template v-if="typeof alertConfig[wk] == 'number'">
            <span style="padding-right: 8px">
              {{ ~~(alertConfig[wk] * 100) }}%
            </span>
            <Slider
              v-model="alertConfig[wk]"
              style="width: 100px; margin: 0 8px"
              :min="0"
              :max="1"
              :step="enableStep ? 0.1 : 0.01"
            />
          </template>
        </template>
      </ConfigTile>
      <AlertConditionConfig
        v-if="wk == 'condition'"
        :condition="alertConfig.condition"
      />
    </template>
  </div>
</template>

<style scoped>
.alert-config-item {
  padding: 0px;
  margin: 4px;
  background-color: color-mix(in lab, transparent, var(--p-surface-700) 40%);
  border: 1px solid var(--p-surface-700);
  border-radius: 8px;
}

.alert-config-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--p-surface-400);
}
</style>
