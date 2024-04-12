import type { Rts } from "@exptechtw/api-wrapper";
import { defineStore } from "pinia";

export const useRtsStore = defineStore("rts", {
  state: (): Rts => ({
    station: {},
    box: {},
    int: [],
    time: 0,
  })
}); 