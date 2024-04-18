<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";

import { useToast } from "primevue/usetoast";
import { ref } from "vue";
import { useRouter } from "vue-router";

import type { AuthenticationDetail } from "@exptechtw/api-wrapper";
import Global from "@/global";
import AutoComplete, { AutoCompleteCompleteEvent } from "primevue/autocomplete";

const toast = useToast();
const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);

const onLogin = () => {
  loading.value = true;

  const auth = {
    email: email.value,
    password: password.value,
    name: "rts-map/rts-map/1.0.0/1.0.0",
  } as AuthenticationDetail;

  Global.api
    .getAuthToken(auth)
    .then((token) => {
      toast.add({
        summary: "登入成功",
        severity: "success",
        life: 1000,
        closable: false,
      });

      localStorage.setItem("token", token);
      router.replace("/");
    })
    .catch((e) => {
      if (e instanceof Error) {
        toast.add({
          summary: e.message,
          severity: "error",
          life: 2000,
          closable: false,
        });
      }

      loading.value = false;
    });
};

const emailSuggestions = ref([]);

const search = (event: AutoCompleteCompleteEvent) => {
  if (event.query.includes("@") && !event.query.endsWith("@")) {
    emailSuggestions.value = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ]
      .filter((v) => v.startsWith(event.query.split("@")[1]))
      .map((item) => event.query.split("@")[0] + "@" + item);
  } else {
    emailSuggestions.value = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ].map(
      (item) => event.query + (event.query.includes("@") ? "" : "@") + item
    );
  }
};
</script>

<template>
  <div class="login">
    <form action="" @submit.prevent="onLogin">
      <Card>
        <template #title>
          <div class="form-title">登入</div>
        </template>
        <template #subtitle>
          <div class="form-subtitle">登入 ExpTech 帳號來開始使用 rts-map</div>
        </template>
        <template #content>
          <div class="form-content">
            <div class="form-item">
              <label for="login-email">電子郵件地址</label>
              <AutoComplete
                v-model="email"
                type="email"
                input-id="login-email"
                :input-style="{ width: '100%' }"
                :suggestions="emailSuggestions"
                :disabled="loading"
                :delay="100"
                @complete="search"
              />
            </div>
            <div class="form-item">
              <label for="login-password">密碼</label>
              <Password
                v-model="password"
                type="password"
                input-id="login-password"
                :input-style="{ flex: 1 }"
                :feedback="false"
                :disabled="loading"
                toggleMask
              />
            </div>
          </div>
        </template>
        <template #footer>
          <div class="form-actions">
            <Button
              type="submit"
              label="登入"
              :disabled="loading || !(email.length && password.length)"
              :loading="loading"
            />
          </div>
        </template>
      </Card>
    </form>
  </div>
</template>

<style scoped>
.login {
  display: grid;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.form-title {
  text-align: center;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 8;
  justify-content: center;
}

label {
  color: var(--p-surface-500);
}
</style>
