<script setup lang="ts">
import { AlertCondition } from "@/class/config_manager";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";

defineProps<{
  condition: AlertCondition;
}>();
</script>

<template>
  <div class="alert-condition-config">
    <div class="row">
      <span>當</span>
      <Dropdown
        v-model="condition[0]"
        :options="[
          { name: '恰好', value: 'exactly' },
          { name: '至少', value: 'least' },
          { name: '測站 ID', value: 'id' },
        ]"
        optionLabel="name"
        optionValue="value"
      />
      <template v-if="condition[0] == 'id'">
        <InputText v-model="condition[1]" :style="{ width: '120px' }" />
        <span>的</span>
      </template>
      <template v-else>
        <InputNumber v-model="condition[1]" :inputStyle="{ width: '50px' }" />
        <span>站測站</span>
      </template>
    </div>
    <div class="row">
      <Dropdown
        v-model="condition[2]"
        :options="[
          { name: '衰減震度', value: 'intensity' },
          { name: '即時震度', value: 'realtime' },
        ]"
        optionLabel="name"
        optionValue="value"
      />
      <Dropdown v-model="condition[3]" :options="['>', '<', '=', '>=', '<=']" />
      <Dropdown
        v-model="condition[4]"
        :options="[
          { name: '1 級', value: 1 },
          { name: '2 級', value: 2 },
          { name: '3 級', value: 3 },
          { name: '4 級', value: 4 },
          { name: '5 弱', value: 5 },
          { name: '5 強', value: 6 },
          { name: '6 弱', value: 7 },
          { name: '6 強', value: 8 },
          { name: '7 級', value: 9 },
        ]"
        optionLabel="name"
        optionValue="value"
      />
    </div>
    <div class="row">
      <span>時，播放音效。</span>
    </div>
  </div>
</template>

<style scoped>
.alert-condition-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 3px solid var(--p-surface-600);
  padding: 4px 0 4px 16px;
  margin: 4px 0 4px 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
