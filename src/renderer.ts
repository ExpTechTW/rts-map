import { createApp, type Plugin } from 'vue';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from "vue-router";
import { GridItem, GridLayout } from "grid-layout-plus";
import PrimeVueStyled from 'primevue/styled';
import ToastService from "primevue/toastservice";

import App from './App.vue';
import MainRoute from "./routes/MainRoute.vue";
import LoginRoute from "./routes/LoginRoute.vue";

import "./index.css";

const pinia = createPinia();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: MainRoute },
    { path: "/login", component: LoginRoute },
  ]
});

createApp(App)
  .use(pinia)
  .use(router)
  .use(PrimeVueStyled as unknown as Plugin)
  .use(ToastService)
  .component("GridLayout", GridLayout)
  .component("GridItem", GridItem)
  .mount('#app');

if (localStorage.getItem("token") == null) {
  router.replace("/login");
}