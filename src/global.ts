import { ExpTechApi } from "@exptechtw/api-wrapper";
import { ConfigManager } from "./class/config_manager";

const api = new ExpTechApi();
const config = new ConfigManager();

export default {
  api,
  config,
};