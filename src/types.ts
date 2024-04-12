export type PointData = {
  name: string;
  value: [number, number];
};

export type PointGroup = {
  startTime: number;
  endTime: number;
  isEmpty: boolean;
  data: PointData[];
};

export type ChartWaveData = {
  X: PointGroup[];
  Y: PointGroup[];
  Z: PointGroup[];
};