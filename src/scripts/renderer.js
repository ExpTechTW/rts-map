/* global DEBUG_FLAG_ALERT_BYPASS: true, DEBUG_FLAG_SILLY = false */
const ready = async () => {
  const { setTimeout, setInterval, clearInterval } = require("node:timers");
  const { Menu, MenuItem } = require("@electron/remote");
  const L = require("leaflet");
  const chroma = require("chroma-js");
  const echarts = require("echarts");
  const path = require("node:path");
  const os = require("node:os");

  const defaultchartuuids = [
    "H-335-11339620-4",
    "H-979-11336952-11",
    "H-711-11334880-12",
    "H-541-11370676-10",
    "L-269-11370996-5",
    "L-648-4832348-9",
    "L-904-11336816-15",
    "L-826-11335736-15"
  ];

  const runtimedefaultchartuuids = (() => {
    for (let i = 0; i < 8; i++)
      if (localStorage.getItem(`chart${i}`) == null)
        localStorage.setItem(`chart${i}`, defaultchartuuids[i]);

    return {
      list: [
        localStorage.getItem("chart0"),
        localStorage.getItem("chart1"),
        localStorage.getItem("chart2"),
        localStorage.getItem("chart3"),
        localStorage.getItem("chart4"),
        localStorage.getItem("chart5"),
        localStorage.getItem("chart6"),
        localStorage.getItem("chart7"),
      ],
      toIds() {
        return this.list.map(v => v.split("-")[2]);
      }
    };
  })();

  const chartuuids = [
    "H-335-11339620-4",
    "H-979-11336952-11",
    "H-711-11334880-12",
    "H-541-11370676-10",
    "L-269-11370996-5",
    "L-648-4832348-9",
    "L-904-11336816-15",
    "L-826-11335736-15"
  ];

  const grad_i
  = chroma
    .scale(["#0500A3", "#00ceff", "#33ff34", "#fdff32", "#ff8532", "#fc5235", "#c03e3c", "#9b4544", "#9a4c86", "#b720e9"])
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const wave_count = +(localStorage.getItem("displayWaveCount") ?? 6);

  const int = [
    { value: "0", scale: "級" },
    { value: "1", scale: "級" },
    { value: "2", scale: "級" },
    { value: "3", scale: "級" },
    { value: "4", scale: "級" },
    { value: "5", scale: "弱" },
    { value: "5", scale: "強" },
    { value: "6", scale: "弱" },
    { value: "6", scale: "強" },
    { value: "7", scale: "級" }
  ];

  const data = {
    map   : require(path.resolve(__dirname, "../resources/tw_county.json")),
    area  : require(path.resolve(__dirname, "../resources/area.json")),
    alert : new Audio(path.resolve(__dirname, "../resources/alert.wav")),

    /**
     * @type {Record<string, Station>} stations
     */
    stations: {}
  };
  const timer = {};

  const map = L.map("map", {
    preferCanvas       : true,
    dragging           : false,
    touchZoom          : false,
    doubleClickZoom    : false,
    scrollWheelZoom    : false,
    boxZoom            : false,
    keyboard           : false,
    tap                : false,
    zoomControl        : false,
    attributionControl : false,
    zoomSnap           : 0.01
  });

  // #region map layer

  const base = L.geoJSON(data.map, {
    style: {
      color     : "#d0bcff",
      weight    : 1,
      opacity   : 0.2,
      fillColor : "#49454f"
    }
  }).addTo(map);

  const pane = map.createPane("stations");

  const arealayer = L.geoJSON(data.area, {
    pane  : "stations",
    style : {
      stroke : false,
      fill   : false
    },
  }).addTo(map);

  // #endregion

  // #region set view

  map.setView([23.61, 120.65], 7.5);

  if (!wave_count)
    window.resizeTo(400, 560);

  window.addEventListener("resize", () => {
    window.resizeTo(wave_count ? 800 : 400, 560);
    map.setView([23.61, 120.65], 7.5);
  });

  // #endregion

  // #region websocket
  /**
   * @type {Record<string, StationRTS} 即時資料
   */

  let ws;

  const connect = (retryTimeout) => {
    ws = new WebSocket("wss://exptech.com.tw/api");

    if (DEBUG_FLAG_SILLY)
      console.debug("[WS_CREATE]", ws);

    ws.addEventListener("close", () => {
      ws = null;
      console.debug(`WebSocket closed. Reconnect after ${retryTimeout / 1000}s`);
      setTimeout(connect, retryTimeout, retryTimeout).unref();
    });

    ws.addEventListener("error", (err) => {
      console.error(err);
    });

    ws.addEventListener("open", () => {
      if (DEBUG_FLAG_SILLY)
        console.debug("[WS_OPEN]", ws);

      const message = {
        uuid     : `rts-map/0.0.2 (${os.hostname()}; platform; ${os.version()}; ${os.platform()}; ${os.arch()})`,
        function : "subscriptionService",
        value    : ["trem-rts-v2", "trem-rts-original-v1"],
        addition : {
          "trem-rts-original-v1": chartuuids
        }
      };

      if (DEBUG_FLAG_SILLY)
        console.debug("[WS_SEND]", message);

      ws.send(JSON.stringify(message));
    });

    ws.addEventListener("message", (ev) => {
      const parsed = JSON.parse(ev.data);

      if (DEBUG_FLAG_SILLY)
        console.debug("[WS_MESSAGE]", parsed);

      if (parsed.response == "Connection Succeeded") {
        console.debug("WebSocket has connected");
      } else if (parsed.response == "Subscription Succeeded") {
        console.debug("Subscribed to trem-rts-v2");
      } else if (parsed.type == "trem-rts") {
        rts(parsed.raw);
      } else if (parsed.type == "trem-rts-original") {
        const wave_raw = {};
        for (let i = 0; i < parsed.raw.length; i++)
          wave_raw[parsed.raw[i].uuid] = parsed.raw[i].raw;
        wave(wave_raw);
      }
    });
  };

  connect(1000);

  // #region for debugging: replay

  // let rts_replay_time = new Date("2023/02/17 09:22:50").getTime();

  // setInterval(async () => {
  //   try {
  //     const controller = new AbortController();
  //     setTimeout(() => {
  //       controller.abort();
  //     }, 1500);
  //     const ans = await fetch(`https://exptech.com.tw/api/v2/trem/rts?time=${rts_replay_time}`, { signal: controller.signal })
  //       .catch(() => void 0);
  //     rts_replay_time += 1000;

  //     if (controller.signal.aborted || ans == undefined) return;
  //     rts(await ans.json());
  //   } catch (err) {
  //     // ignore exceptions
  //   }
  // }, 1_000);

  // #endregion

  // #endregion

  // #region rts
  /**
   * @type {Record<string, L.Marker>} 地圖上測站
   */
  const markers = {};

  const fetch_files = async () => {
    try {
      if (DEBUG_FLAG_SILLY)
        console.debug("[FETCH] Trying to fetch https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json");

      const res = await (await fetch("https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json")).json();
      const s = {};

      if (res) {
        for (let i = 0, k = Object.keys(res), n = k.length; i < n; i++) {
          const id = k[i];

          if (res[id].Long > 118)
            s[id.split("-")[2]] = { uuid: id, ...res[id] };
        }

        data.stations = s;
      }
    } catch (error) {
      console.warn("Failed to load station data!", error);
    }
  };

  await fetch_files();

  timer.stations = setInterval(fetch_files, 300_000);

  let max_id;
  let chartAlerted = [];

  const rts = (rts_data) => {
    let max = { id: null, i: -4 };
    let min = { id: null, i: 8 };
    let sum = 0;
    let count = 0;
    const area = {};
    const alerted = [];

    for (let i = 0, k = Object.keys(data.stations), n = k.length; i < n; i++) {
      const id = k[i];
      const station_data = data.stations[id];

      if (markers[id] instanceof L.Marker) {
        const el = markers[id].getElement();

        if (id in rts_data) {
          if (!el.classList.contains("has-data"))
            el.classList.add("has-data");

          el.style.backgroundColor = grad_i(rts_data[id].i);

          if (rts_data[id].i > max.i) max = { id, i: rts_data[id].i };

          if (rts_data[id].i < min.i) min = { id, i: rts_data[id].i };

          markers[id].setZIndexOffset(rts_data[id].i + 5);

          if (rts_data.Alert && rts_data[id].alert) {
            sum += rts_data[id].i;
            count++;

            let _i = intensity_float_to_int(rts_data[id].i);

            if (_i == 0) _i = 1;

            if (_i > (area[station_data.PGA] ?? 0))
              area[station_data.PGA] = _i;
          }

          if (rts_data[id].alert)
            alerted.push(id);
        } else {
          if (el.classList.contains("has-data"))
            el.classList.remove("has-data");
          el.style.backgroundColor = "";
        }
      } else {
        markers[id] = L.marker([station_data.Lat, station_data.Long], {
          icon: L.divIcon({
            className : "station-marker",
            iconSize  : [ 8, 8 ]
          }),
          zIndexOffset : 0,
          keyboard     : false,
          pane         : "stations"
        }).addTo(map);
      }
    }

    if (wave_count) {
      if (alerted.length) {
        if (localStorage.getItem("autoSwitchWave") == "true")
          if (alerted.length >= +localStorage.getItem("minimumTriggeredStation")) {
            for (let i = 0, n = alerted.length; i < n; i++)
              if (!chartAlerted.includes(alerted[i]))
                chartAlerted.push(alerted[i]);
            setCharts(chartAlerted);

            if (timer.resetWave) timer.resetWave.refresh();
          }
      } else if (chartAlerted.length && !timer.resetWave) {
        timer.resetWave = setTimeout(() => {
          chartAlerted = [];
          setCharts(runtimedefaultchartuuids.toIds());
          delete timer.resetWave;
        }, 15_000);
      }

      for (let i = 0; i < wave_count; i++)
        if (chartuuids[i]) {
          const id = chartuuids[i].split("-")[2];

          if (id in rts_data)
            charts[i].setOption({
              backgroundColor: `${grad_i(rts_data[id].i).hex()}15`
            });
          else
            charts[i].setOption({
              backgroundColor: "transparent"
            });
        }
    }

    arealayer.setStyle(localStorage.getItem("area") == "true" ? (feature) => ({
      stroke : area[feature.id] > 0,
      color  : ["transparent", "#00ceff", "#33ff34", "#fdff32", "#ff8532", "#fc5235", "#c03e3c", "#9b4544", "#9a4c86", "#b720e9"][area[feature.id]],
      weight : 2,
      fill   : false
    }) : {
      stroke : false,
      fill   : false
    });

    if (max_id != null && max.id != null && max_id != max.id) {
      if (markers[max_id].getElement().classList.contains("max"))
        markers[max_id].getElement().classList.remove("max");

      if (!markers[max.id].getElement().classList.contains("max"))
        markers[max.id].getElement().classList.add("max");
    }

    max_id = max.id;

    const avg = (!count) ? 0 : (sum / count).toFixed(1);

    document.getElementById("max-int-marker").innerText = `max:${max.i}`;
    document.getElementById("min-int-marker").innerText = `min:${min.i}`;
    document.getElementById("avg-int-marker").innerText = `avg:${avg}`;

    document.getElementById("max-int-marker").style.bottom = `${max.i < 0 ? 2 * max.i : max.i < 5 ? 37.1428571428571 * max.i : 18.5714285714286 * max.i + 92.8571428571427}px`;
    document.getElementById("min-int-marker").style.bottom = `${min.i < 0 ? 2 * min.i : min.i < 5 ? 37.1428571428571 * min.i : 18.5714285714286 * min.i + 92.8571428571427}px`;
    document.getElementById("avg-int-marker").style.bottom = `${avg < 0 ? 2 * avg : avg < 5 ? 37.1428571428571 * avg : 18.5714285714286 * avg + 92.8571428571427}px`;

    if (rts_data || DEBUG_FLAG_ALERT_BYPASS)
      if ((rts_data.Alert && max.i >= 2) || DEBUG_FLAG_ALERT_BYPASS) {
        if (!data.alert_loop)
          data.alert_loop = true;

        if (!document.body.classList.contains("alert"))
          document.body.classList.add("alert");

        if (document.getElementById("min-int-marker").classList.contains("hide")) {
          document.getElementById("avg-int-marker").classList.remove("hide");
          document.getElementById("min-int-marker").classList.remove("hide");
        }

        document.getElementById("int-value").innerText = int[intensity_float_to_int(rts_data[max.id].i)].value;
        document.getElementById("int-scale").innerText = int[intensity_float_to_int(rts_data[max.id].i)].scale;
        document.getElementById("loc-county").innerText = data.stations[max.id]?.Loc?.split(" ")?.[0] ?? "";
        document.getElementById("loc-town").innerText = data.stations[max.id]?.Loc?.split(" ")?.[1] ?? "";

        if (markers.polyline)
          markers.polyline.setLatLngs([[25.26, 119.8], [data.stations[max.id].Lat, data.stations[max.id].Long]]);
        else
          markers.polyline = L.polyline([[25.26, 119.8], [25.26, 119.8]], {
            color       : "#ffffff",
            weight      : 4,
            interactive : false,
            className   : "max-line",
            renderer    : L.svg({ pane: "stations" })
          }).addTo(map);

        if (!timer.alert)
          timer.alert = setInterval(() => {
            if (data.alert_loop) {
              if (localStorage.getItem("muted") == "false") {
                data.alert.pause();
                data.alert.currentTime = 0;
                data.alert.play();
              }
            } else {
              clearInterval(timer.alert);
              delete timer.alert;
            }
          }, 1500);
      } else {
        if (data.alert_loop)
          data.alert_loop = false;

        if (document.body.classList.contains("alert"))
          document.body.classList.remove("alert");

        if (!document.getElementById("min-int-marker").classList.contains("hide")) {
          document.getElementById("min-int-marker").classList.add("hide");
          document.getElementById("min-int-marker").classList.add("hide");
        }

        if (markers.polyline) {
          markers.polyline.remove();
          delete markers.polyline;
        }
      }

    const time = new Date(rts_data.Time || Date.now());
    document.getElementById("time").innerText = `${time.getFullYear()}/${(time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1}/${time.getDate() < 10 ? `0${time.getDate()}` : time.getDate()} ${time.getHours() < 10 ? `0${time.getHours()}` : time.getHours()}:${time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes()}:${time.getSeconds() < 10 ? `0${time.getSeconds()}` : time.getSeconds()}`;
  };

  const intensity_float_to_int = function(float) {
    return (float < 0) ? 0
      : (float < 4.5) ? Math.round(float)
        : (float < 5) ? 5
          : (float < 5.5) ? 6
            : (float < 6) ? 7
              : (float < 6.5) ? 8 : 9;
  };

  // #endregion

  // #region wave

  const charts = [];
  const chartdata = [];

  for (let i = 0; i < wave_count; i++) {
    const dom = document.createElement("div");
    document.getElementById("wave-container").append(dom);
    charts.push(echarts.init(dom, null, { height: 560 / wave_count, width: 400 }));
    chartdata.push([]);
    dom.addEventListener("contextmenu", () => {
      const menu = new Menu();

      const stations = {};

      for (let j = 0, k = Object.keys(data.stations), n = k.length; j < n; j++) {
        const loc = data.stations[k[j]].Loc.split(" ");
        stations[loc[0]] ??= [];
        stations[loc[0]].push(data.stations[k[j]]);
      }


      for (let j = 0, k = Object.keys(stations), n = k.length; j < n; j++) {
        const group = new Menu();
        let selected;

        for (let l = 0, nl = stations[k[j]].length; l < nl; l++) {
          if (defaultchartuuids[i] == stations[k[j]][l].uuid)
            selected = true;

          group.append(new MenuItem({
            type    : "checkbox",
            checked : runtimedefaultchartuuids.list[i] == stations[k[j]][l].uuid,
            label   : `${stations[k[j]][l].Loc} ${stations[k[j]][l].uuid}`,
            click   : (item) => {
              localStorage.setItem(`chart${i}`, stations[k[j]][l].uuid);
              runtimedefaultchartuuids.list[i] = stations[k[j]][l].uuid;
              setCharts(runtimedefaultchartuuids.toIds());
            }
          }));
        }

        menu.append(new MenuItem({
          type    : "submenu",
          label   : `${k[j]} (${stations[k[j]].length})`,
          submenu : group,
          ...(selected ? {
            icon: path.resolve(__dirname, `../resources/images/${window.matchMedia("(prefers-color-scheme: dark)").matches ? "" : "dark/"}check.png`),
          } : {})
        }));
      }

      menu.popup();
    });
  }

  /**
   * @param {string[]} ids
   */
  const setCharts
  = (ids) => {
    if (DEBUG_FLAG_SILLY)
      console.debug("[CHART] Setting chart to ids...", ids);

    let ws_send = false;

    for (let i = 0; i < wave_count; i++)
      if (data.stations?.[ids[i]]?.uuid) {
        if (chartuuids[i] != data.stations[ids[i]].uuid) {
          chartuuids[i] = data.stations[ids[i]].uuid;
          chartdata[i] = [];
          ws_send = true;
        }

        charts[i].setOption({
          title: {
            text: `${data.stations[ids[i]].Loc} | ${chartuuids[i]}`,
          }
        });
      } else {
        chartuuids.splice(i, 1);
        charts[i].clear();
        charts[i].setOption({
          title: {
            textStyle: {
              fontSize   : 10,
              fontFamily : "Consolas"
            }
          },
          xAxis: {
            type      : "time",
            splitLine : {
              show: false
            },
            show: false
          },
          yAxis: {
            type      : "value",
            animation : false,
            splitLine : {
              show: false
            },
            axisLabel: {
              interval : 1,
              fontSize : 10
            }
          },
          grid: {
            top    : 16,
            right  : 0,
            bottom : 0
          },
          series: [
            {
              type       : "line",
              showSymbol : false,
              lineStyle  : { color: "#fff" },
              data       : []
            }
          ]
        });
      }

    if (ws_send) {
      const message = {
        uuid     : `rts-map/0.0.10 (${os.hostname()}; platform; ${os.version()}; ${os.platform()}; ${os.arch()})`,
        function : "subscriptionService",
        value    : ["trem-rts-v2", "trem-rts-original-v1"],
        addition : {
          "trem-rts-original-v1": chartuuids
        }
      };

      if (ws.readyState == ws.OPEN) {
        if (DEBUG_FLAG_SILLY)
          console.debug("[WS_SEND]", message);

        ws.send(JSON.stringify(message));
      } else if (DEBUG_FLAG_SILLY) {
        console.debug("[WS_SEND] Tried to send, but ws is closed.", message);
      }
    }
  };

  if (wave_count) {
    setCharts(runtimedefaultchartuuids.toIds());

    for (const chart of charts)
      chart.setOption({
        title: {
          textStyle: {
            fontSize   : 10,
            fontFamily : "Consolas"
          }
        },
        xAxis: {
          type      : "time",
          splitLine : {
            show: false
          },
          show: false
        },
        yAxis: {
          type      : "value",
          animation : false,
          splitLine : {
            show: false
          },
          axisLabel: {
            interval : 1,
            fontSize : 10
          }
        },
        grid: {
          top    : 22,
          right  : 0,
          bottom : 6
        },
        series: [
          {
            type       : "line",
            showSymbol : false,
            lineStyle  : { color: "#fff" },
            data       : []
          }
        ]
      });
  }

  const wave = (jsondata) => {
    const now = new Date(Date.now());

    for (let i = 0; i < wave_count; i++) {
      if (jsondata[chartuuids[i]]) {
        chartdata[i].push(...jsondata[chartuuids[i]].map((value, index, array) => ({
          name  : now.toString(),
          value : [
            new Date(+now + (index * (1000 / array.length))).toISOString(),
            value
          ]
        })));

        charts[i].setOption({
          title: {
            textStyle: {
              color: "#bbb"
            }
          },
        });
      } else {
        for (let j = 0; j < 18; j++)
          chartdata[i].push({
            name  : now.toString(),
            value : [
              new Date(+now + (j * (1000 / 18))).toISOString(),
              null
            ]
          });

        charts[i].setOption({
          title: {
            textStyle: {
              color: "#666"
            }
          },
        });
      }

      while (true)
        if (chartdata[i].length > 1080) {
          chartdata[i].shift();
        } else if (chartdata[i].length == 1080) {
          break;
        } else if (chartdata[i].length != 1080) {
          chartdata[i].shift();
          chartdata[i].unshift({
            name  : new Date(Date.now() - 60_000).toString(),
            value : [
              new Date(Date.now() - 60_000).toISOString(),
              null
            ]
          });
          break;
        }

      const values = chartdata[i].map(v => v.value[1]);
      const maxmin = Math.max(Math.abs(Math.max(...values)), Math.abs(Math.min(...values)));

      if (chartuuids[i])
        charts[i].setOption({
          animation : false,
          yAxis     : {
            max : maxmin < (chartuuids[i].startsWith("H") ? 1 : 25) ? (chartuuids[i].startsWith("H") ? 1 : 25) : maxmin,
            min : -(maxmin < (chartuuids[i].startsWith("H") ? 1 : 25) ? (chartuuids[i].startsWith("H") ? 1 : 25) : maxmin)
          },
          series: [
            {
              lineStyle : { color: jsondata[chartuuids[i]] == null ? "#666" : "#fff" },
              data      : chartdata[i]
            }
          ],
        });
    }
  };
  // #endregion
};

document.addEventListener("DOMContentLoaded", ready);

// #region jsdoc typedef

/**
* @typedef {object} Station
* @property {string} uuid 測站 UUID
* @property {number} Lat  緯度
* @property {number} Long 經度
* @property {number} PGA  area 框框編號
* @property {string} Loc  位置
* @property {string} area 地區
*/

/**
 * @typedef StationRTS
 * @property {number} v 加速度
 * @property {number} i 震度
 */

// #endregion