<script setup lang="ts">
import AutoComplete, {
  type AutoCompleteCompleteEvent,
} from "primevue/autocomplete";
import Button from "primevue/button";
import Card from "primevue/card";
import Password from "primevue/password";

import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToast } from "primevue/usetoast";

import type { AuthenticationDetail } from "@exptechtw/api-wrapper";
import Global from "@/global";

const i18n = useI18n();
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
    name: `rts-map/rts-map/${window.app.version}/${window.app.version}`,
  } as AuthenticationDetail;

  Global.api
    .getAuthToken(auth)
    .then((token) => {
      toast.add({
        summary: i18n.t("toast.login_success.message"),
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
      <Card class="login-card">
        <template #title>
          <div class="form-title">{{ i18n.t("dialog.login.header") }}</div>
        </template>
        <template #subtitle>
          <div class="form-subtitle">{{ i18n.t("dialog.login.subtitle") }}</div>
        </template>
        <template #content>
          <div class="form-content">
            <div class="form-item">
              <label for="login-email">
                {{ i18n.t("dialog.login.field.email") }}
              </label>
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
              <label for="login-password">{{
                i18n.t("dialog.login.field.password")
              }}</label>
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
              :label="i18n.t('button.login')"
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

.login-card {
  max-width: 40svw;
}

.form-title,
.form-subtitle {
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
  font-size: smaller;
}
</style>
