import type { Station } from "@exptechtw/api-wrapper";
import { defineStore } from "pinia";

export const useStationStore = defineStore("station", {
  state: (): Record<string, Station> => ({})
}); 