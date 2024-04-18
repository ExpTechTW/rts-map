/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from "events";
import config from "../config.json";
import { reactive, watch } from "vue";

export type AlertCondition = [
  "intensity" | "realtimeIntensity",
  ">" | "<" | "=" | ">=" | "<=",
  number | string
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

  reset() {
    Object.assign(this.config, ConfigManager.getDefaultConfig());
    localStorage.setItem("config", JSON.stringify(this.config));
  }
}