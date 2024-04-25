<script setup lang="ts">
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";

import AlertConfigItem from "@/components/config/alert/AlertConfigItem.vue";
import ConfigTile from "@/components/config/ConfigTile.vue";
import ExpansionConfigTile from "@/components/config/ExpansionConfigTile.vue";
import MaterialSymbols from "@/components/misc/MaterialSymbols.vue";
import WaveConfigItem from "@/components/config/wave/WaveConfigItem.vue";

import type { AlertConfig, WaveConfig } from "@/class/config_manager";
import Global from "@/global";

import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";

const i18n = useI18n();
const confirm = useConfirm();
const router = useRouter();
const isShifted = ref(false);

const closeConfig = () => {
  router.back();
};

const addWaveConfig = () => {
  Global.config.config["wave.list"].unshift({
    id: "",
    axis: ["z"],
  });
};

const resetWaveConfig = () => {
  Global.config.config["wave.list"].splice(
    0,
    Global.config.config["wave.list"].length,
    ...(Global.config.scheme["wave.list"].$default as WaveConfig[])
  );
};

const addAlertConfig = () => {
  Global.config.config["alert.list"].unshift({
    name: "",
    condition: ["least", 2, "intensity", ">=", 2],
    volume: 0.8,
  });
};

const resetAlertConfig = () => {
  Global.config.config["alert.list"].splice(
    0,
    Global.config.config["alert.list"].length,
    ...(Global.config.scheme["alert.list"].$default as AlertConfig[])
  );
};

const resetConfig = () => {
  confirm.require({
    message: i18n.t("dialog.reset_config.message"),
    header: i18n.t("dialog.reset_config.header"),
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: i18n.t("dialog.common.cancel"),
      severity: "secondary",
      text: true,
    },
    acceptProps: {
      label: i18n.t("dialog.common.confirm"),
      severity: "danger",
    },
    accept: () => {
      Global.config.reset();
    },
  });
};

const logout = () => {
  confirm.require({
    message: i18n.t("dialog.logout.message"),
    header: i18n.t("dialog.logout.header"),
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: i18n.t("dialog.common.cancel"),
      severity: "secondary",
      text: true,
    },
    acceptProps: {
      label: i18n.t("dialog.common.confirm"),
      severity: "danger",
    },
    accept: () => {
      localStorage.removeItem("token");
      router.replace("/login");
    },
  });
};

const toggle = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    isShifted.value = true;
  } else {
    isShifted.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", toggle);
  window.addEventListener("keyup", toggle);
});

onUnmounted(() => {
  window.removeEventListener("keydown", toggle);
  window.removeEventListener("keyup", toggle);
});
</script>

<template>
  <div id="config">
    <div class="header">
      <div class="title">{{ i18n.t("dialog.config.header") }}</div>
      <Button text rounded severity="secondary" @click.prevent="closeConfig">
        <template #icon>
          <MaterialSymbols icon="close" rounded />
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
            <MaterialSymbols :icon="Global.config.scheme[k].$icon" rounded />
          </template>
          <template #title>
            <span>{{ i18n.t(`config.${k}.$name`) }}</span>
          </template>
          <template #subtitle>
            <span>{{ i18n.t(`config.${k}.$description`) }}</span>
          </template>
          <template #trailing>
            <InputSwitch
              v-if="typeof Global.config.config[k] == 'boolean'"
              v-model="Global.config.config[k]"
            />
            <Dropdown
              v-if="k == 'app.locale'"
              v-model="Global.config.config[k]"
              :options="[
                { name: 'Use System Language', value: '' },
                ...i18n.availableLocales.map((value) => ({
                  name: `${i18n.t('$localized_name', 0, {
                    locale: value,
                  })} (${i18n.t('$name', 0, { locale: value })})`,
                  value,
                })),
              ]"
              option-label="name"
              option-value="value"
              :placeholder="
                i18n.availableLocales.includes(i18n.locale.value)
                  ? i18n.t('$localized_name')
                  : `${i18n.locale.value} (Fallback)`
              "
            />
            <InputText
              v-else-if="typeof Global.config.config[k] == 'string'"
              v-model="Global.config.config[k]"
            />
          </template>
        </ConfigTile>
        <ExpansionConfigTile
          v-else
          :disabled="
            (!Global.config.config['alert.enabled'] && k == 'alert.list') ||
            (!Global.config.config['wave.enabled'] && k == 'wave.list')
          "
        >
          <template
            #leading
            v-if="typeof Global.config.scheme[k].$icon == 'string'"
          >
            <MaterialSymbols :icon="Global.config.scheme[k].$icon" rounded />
          </template>
          <template #title>
            <span>{{ i18n.t(`config.${k}.$name`) }}</span>
          </template>
          <template #subtitle>
            <span>{{ i18n.t(`config.${k}.$description`) }}</span>
          </template>
          <template v-if="k == 'alert.list'" #content>
            <div class="alert-config-list">
              <div class="alert-config-actions">
                <Button
                  :label="i18n.t('button.add')"
                  outlined
                  @click.prevent="addAlertConfig"
                >
                  <template #icon>
                    <MaterialSymbols icon="add" style="margin-right: 8px" />
                  </template>
                </Button>
                <Button
                  :label="i18n.t('button.reset')"
                  severity="secondary"
                  outlined
                  @click.prevent="resetAlertConfig"
                >
                  <template #icon>
                    <MaterialSymbols icon="restore" style="margin-right: 8px" />
                  </template>
                </Button>
                <div class="alert-config-count">
                  ({{ Global.config.config["alert.list"].length }})
                </div>
              </div>
              <AlertConfigItem
                v-for="(w, i) in (c as AlertConfig[])"
                :alert-config="w"
                :index="i"
                :enableStep="isShifted"
                :key="`alert-config-${i}`"
              />
            </div>
          </template>
          <template v-if="k == 'wave.list'" #content>
            <div class="wave-config-list">
              <div class="wave-config-actions">
                <Button
                  :label="i18n.t('button.add')"
                  outlined
                  @click.prevent="addWaveConfig"
                >
                  <template #icon>
                    <MaterialSymbols icon="add" style="margin-right: 8px" />
                  </template>
                </Button>
                <Button
                  :label="i18n.t('button.reset')"
                  severity="secondary"
                  outlined
                  @click.prevent="resetWaveConfig"
                >
                  <template #icon>
                    <MaterialSymbols icon="restore" style="margin-right: 8px" />
                  </template>
                </Button>
                <div class="wave-config-count">
                  ({{ Global.config.config["wave.list"].length }})
                </div>
              </div>
              <WaveConfigItem
                v-for="(w, i) in (c as WaveConfig[])"
                :wave-config="w"
                :index="i"
                :key="`wave-config-${i}`"
              />
            </div>
          </template>
        </ExpansionConfigTile>
      </template>
      <div class="config-danger-zone">
        <Button
          :label="i18n.t('button.logout')"
          severity="danger"
          outlined
          @click.prevent="logout"
        />
        <Button
          :label="i18n.t('button.reset_config')"
          severity="danger"
          outlined
          @click.prevent="resetConfig"
        />
      </div>
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
  -webkit-app-region: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  padding-left: 8px;
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

.alert-config-list,
.wave-config-list {
  display: flex;
  flex-direction: column;
  padding: 4px 0px;
}

.alert-config-actions,
.wave-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding: 0 4px;
}

.config-danger-zone {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}
</style>
