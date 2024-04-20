import { createApp, type Plugin } from 'vue';
import { createI18n } from "vue-i18n";
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from "vue-router";
import { GridItem, GridLayout } from "grid-layout-plus";
import PrimeVueStyled from 'primevue/styled';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from "primevue/toastservice";
import Ripple from 'primevue/ripple';

import App from './App.vue';
import MainRoute from "./routes/MainRoute.vue";
import ConfigRoute from "./routes/ConfigRoute.vue";
import LoginRoute from "./routes/LoginRoute.vue";

import Global from "./global";
import Localization from "./i18n";
import "./index.css";

const pinia = createPinia();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/",
      component: MainRoute,
      children: [
        {
          path: "config",
          component: ConfigRoute,
        }
      ]
    },
    {
      path: "/login", component: LoginRoute
    },
  ]
});

const i18n = createI18n({
  legacy: false,
  locale: Global.config.config["app.locale"] || navigator.language,
  fallbackLocale: "en",
  messages: Localization,
  missingWarn: false,
});

createApp(App)
  .use(pinia)
  .use(router)
  .use(i18n)
  .use(PrimeVueStyled as unknown as Plugin, { ripple: true })
  .use(ConfirmationService)
  .use(ToastService)
  .directive("ripple", Ripple)
  .component("GridLayout", GridLayout)
  .component("GridItem", GridItem)
  .mount('#app');

if (localStorage.getItem("token") == null) {
  router.replace("/login");
}