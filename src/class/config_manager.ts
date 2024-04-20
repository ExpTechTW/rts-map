/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from "events";
import config from "../config.json";
import { reactive, watch } from "vue";

export type AlertCondition = [
  "exactly" | "least",
  number,
  "intensity" | "realtime",
  ">" | "<" | "=" | ">=" | "<=",
  number
] | [
  "id",
  string,
  "intensity" | "realtime",
  ">" | "<" | "=" | ">=" | "<=",
  number
];

export type AlertConfig = {
  name: string,
  condition: AlertCondition,
  volume: number;
};

export type WaveConfig = {
  id: string,
  axis: ("x" | "y" | "z")[];
};

export interface ConfigScheme {
  "app.locale": string;
  "alert.enabled": boolean;
  "alert.list": AlertConfig[];
  "wave.enabled": boolean;
  "wave.list": WaveConfig[];
  "monitor.enabled": boolean;
}

export class ConfigManager extends EventEmitter {
  config: ConfigScheme;
  version: number;
  scheme: Omit<typeof config, "$version">;

  constructor() {
    super();
    const raw = localStorage.getItem("config");

    if (!raw || !raw.length) {
      this.config = reactive(ConfigManager.getDefaultConfig());
      localStorage.setItem("config", JSON.stringify(this.config));
    } else {
      this.config = reactive(JSON.parse(raw));
    }

    // Ignoring this linter error since we're destructing and removing the $version field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $version: _, ...rest } = config;

    this.version = config.$version;
    this.scheme = rest;

    watch(this.config, (newValue) => {
      this.emit("change", newValue);
      localStorage.setItem("config", JSON.stringify(newValue));
    });
  }

  static getDefaultConfig(): ConfigScheme {
    const conf: Record<string, any> = {};

    const keys = Object.keys(config) as Array<keyof typeof config>;

    for (const key of keys) {
      if (key == "$version") continue;
      conf[key] = config[key].$default as never;

    }

    return conf as ConfigScheme;
  }

  static validateAlertCondition(alertCondition: Partial<AlertCondition>): alertCondition is AlertCondition {
    if (!Array.isArray(alertCondition)) return false;
    if (["exactly", "least"].includes(alertCondition[0]) && (typeof alertCondition[1] != "number" || !Number.isInteger(alertCondition[1]))) return false;
    if (alertCondition[0] == "id" && (typeof alertCondition[1] != "string" || !alertCondition[1].length)) return false;
    if (!["intensity", "realtime"].includes(alertCondition[2])) return false;
    if (![">", "<", "=", ">=", "<="].includes(alertCondition[3])) return false;
    if (alertCondition[4] < 1 || alertCondition[4] > 9) return false;

    return true;
  }

  static validateAlertConfig(alertConfig: Partial<AlertConfig>): alertConfig is AlertConfig {
    if (typeof alertConfig.name != "string" || !alertConfig.name.trim().length) return false;
    if (!Array.isArray(alertConfig.condition) || !validateAlertCondition(alertConfig.condition)) return false;
    if (typeof alertConfig.volume != "number" || alertConfig.volume < 0 || alertConfig.volume > 1) return false;

    return true;
  }

  static validateWaveConfig(waveConfig: Partial<WaveConfig>): waveConfig is WaveConfig {
    if (typeof waveConfig.id != "string" || !waveConfig.id.length) return false;
    if (!Array.isArray(waveConfig.axis) || !waveConfig.axis.filter(v => ["x", "y", "z"].includes(v)).length) return false;

    return true;
  }

  static validateConfig(config: Partial<ConfigScheme>): config is ConfigScheme {
    if (!config) return false;
    if (!(typeof config["alert.enabled"] == "boolean")) return false;
    if (!Array.isArray(["alert.list"]) || config["alert.list"].reduce((acc, v) => acc ||= !validateAlertConfig(v), false)) return false;
    if (!(typeof config["wave.enabled"] == "boolean")) return false;
    if (!Array.isArray(["wave.list"]) || config["wave.list"].reduce((acc, v) => acc ||= !validateWaveConfig(v), false)) return false;
    if (!(typeof config["monitor.enabled"] == "boolean")) return false;

    return true;
  }

  reset() {
    Object.assign(this.config, ConfigManager.getDefaultConfig());
    localStorage.setItem("config", JSON.stringify(this.config));
  }
}

export const getDefaultConfig = ConfigManager.getDefaultConfig;
export const validateAlertConfig = ConfigManager.validateAlertConfig;
export const validateAlertCondition = ConfigManager.validateAlertCondition;
export const validateWaveConfig = ConfigManager.validateWaveConfig;
export const validateConfig = ConfigManager.validateConfig;