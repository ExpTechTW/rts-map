<script setup lang="ts">
import ConfigTile from "@/components/config/ConfigTile.vue";
import MaterialSymbols from "@/components/MaterialSymbols.vue";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import ExpansionConfigTile from "@/components/config/ExpansionConfigTile.vue";
import WaveConfigItem from "@/components/config/wave/WaveConfigItem.vue";

import type { WaveConfig } from "@/class/config_manager";
import Global from "@/global";

import { useRouter } from "vue-router";

const router = useRouter();

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
    <div class="content">
      <template v-for="(c, k) in Global.config.config">
        <ConfigTile v-if="!('$value' in Global.config.scheme[k])">
          <template
            #leading
            v-if="typeof Global.config.scheme[k].$icon == 'string'"
          >
            <MaterialSymbols :name="Global.config.scheme[k].$icon" rounded />
          </template>
          <template #title>
            <span>{{ Global.config.scheme[k].$name }}</span>
          </template>
          <template #subtitle>
            <span>{{ Global.config.scheme[k].$description }}</span>
          </template>
          <template #trailing>
            <InputSwitch
              v-if="typeof Global.config.config[k] == 'boolean'"
              v-model="Global.config.config[k]"
            />
            <InputText
              v-if="typeof Global.config.config[k] == 'string'"
              v-model="Global.config.config[k]"
            />
          </template>
        </ConfigTile>
        <ExpansionConfigTile v-else>
          <template
            #leading
            v-if="typeof Global.config.scheme[k].$icon == 'string'"
          >
            <MaterialSymbols :name="Global.config.scheme[k].$icon" rounded />
          </template>
          <template #title>
            <span>{{ Global.config.scheme[k].$name }}</span>
          </template>
          <template #subtitle>
            <span>{{ Global.config.scheme[k].$description }}</span>
          </template>
          <template v-if="k == 'wave.list'" #content>
            <div class="wave-config-list">
              <WaveConfigItem v-for="w in (c as WaveConfig[])">
                <ConfigTile v-for="(wc, wk) in w">
                  <template #leading>
                    <MaterialSymbols name="" rounded />
                  </template>
                  <template #title>
                    <span>{{ Global.config.scheme[k].$value[wk].$name }} </span>
                  </template>
                  <template #subtitle>
                    <span>{{
                      Global.config.scheme[k].$value[wk].$description
                    }}</span>
                  </template>
                  <template #trailing>
                    <InputSwitch
                      v-if="typeof w[wk] == 'boolean'"
                      v-model="w[wk]"
                    />
                    <InputText
                      v-if="typeof w[wk] == 'string'"
                      v-model="w[wk]"
                      style="width: 100px; text-align: right"
                    />
                  </template>
                </ConfigTile>
              </WaveConfigItem>
            </div>
          </template>
        </ExpansionConfigTile>
      </template>
    </div>
  </div>
</template>

<style scoped>
#config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background-color: var(--p-surface-800);
  border: 1px solid var(--p-surface-700);
  max-height: 90svh;
  max-width: 90svw;
}

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

.content {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 8px;
}

.column {
  display: flex;
  flex-direction: column;
}
</style>
