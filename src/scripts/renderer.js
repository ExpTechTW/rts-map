/* global DEBUG_FLAG_ALERT_BYPASS: true, DEBUG_FLAG_SILLY: true */
const ready = async () => {
  const { setTimeout, setInterval, clearTimeout, clearInterval } = require("node:timers");
  const { app, Menu, MenuItem, nativeTheme } = require("@electron/remote");
  const { ipcRenderer } = require("electron/renderer");
  const { WebSocket } = require("ws");
  const L = require("leaflet");
  const chroma = require("chroma-js");
  const echarts = require("echarts");
  const path = require("node:path");
  const os = require("node:os");
  let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  document.title = `rts-map v${app.getVersion()}`;

  const requestUA = `rts-map/${app.getVersion()} (${os.hostname()}; platform; ${os.version()}; ${os.platform()}; ${os.arch()})`;

  const waveCount = +(localStorage.getItem("displayWaveCount") ?? 6);

  const defaultchartuuids = [
    4812424,
    11339620,
    11370676,
    11334880,
    6125804,
    1480496,
    6126556,
    11336952
  ];

  const runtimedefaultchartuuids = (() => {
    for (let i = 0; i < 8; i++)
      if (localStorage.getItem(`chart${i}`) == null)
        localStorage.setItem(`chart${i}`, defaultchartuuids[i]);

    return [
      localStorage.getItem("chart0"),
      localStorage.getItem("chart1"),
      localStorage.getItem("chart2"),
      localStorage.getItem("chart3"),
      localStorage.getItem("chart4"),
      localStorage.getItem("chart5"),
      localStorage.getItem("chart6"),
      localStorage.getItem("chart7"),
    ].slice(0, waveCount);
  })();

  const gradIntensity
  = chroma
    .scale(["#0500A3", "#00ceff", "#33ff34", "#fdff32", "#ff8532", "#fc5235", "#c03e3c", "#9b4544", "#9a4c86", "#b720e9"])
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const toHHmmssS = (timestamp) => {
    const date = new Date(timestamp);
    return [
      `${date.getHours()}`.padStart(2, "0"),
      `${date.getMinutes()}`.padStart(2, "0"),
      `${date.getSeconds()}`.padStart(2, "0"),
    ].join(":") + `.${date.getMilliseconds()}`;
  };

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
    code  : require(path.resolve(__dirname, "../resources/code.json")),
    alert : new Audio(path.resolve(__dirname, "../resources/alert.wav")),

    /**
     * @type {Record<StationId, Station>} stations
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

  const bgPath = localStorage.getItem("backgroundPath");

  if (bgPath) {
    document.body.style.backgroundImage = `url(file://${bgPath.replace("/", "\\\\")})`;
    document.body.style.backgroundSize = `${window.screen.width}px ${window.screen.height}px`;

    document.getElementById("app-container").classList.add("has-bg");

    const moveBackground = () => {
      document.body.style.backgroundPosition = `${-window.screenX}px ${-window.screenY}px`;
    };

    const move = setInterval(moveBackground);

    const blur = () => {
      document.body.classList.add("blur");
    };

    const rmblur = () => {
      document.body.classList.remove("blur");
    };

    window.addEventListener("focus", rmblur);
    window.addEventListener("blur", blur);

    window.addEventListener("beforeunload", () => {
      window.removeEventListener("focus", rmblur);
      window.removeEventListener("blur", blur);
      clearInterval(move);
    });
  }

  // #region map layer

  const base = L.geoJSON(data.map, {
    style: {
      color       : isDark ? "#d0bcff" : "#6750A4",
      weight      : 1,
      opacity     : 0.25,
      fillColor   : isDark ? "#d0bcff" : "#6750A4",
      fillOpacity : 0.1
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

  map.setView([23.61, 120.72], 7.5);

  if (!waveCount)
    window.resizeTo(400, 560);

  window.addEventListener("resize", () => {
    window.resizeTo(waveCount ? 800 : 400, 560);
    map.setView([23.61, 120.65], 7.5);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
    isDark = event.matches;
    console.debug(`%c[Theme]%c Theme changed to: ${isDark ? "DARK" : "LIGHT"}`, "color: blueviolet", "color:unset");

    base.setStyle({
      color       : isDark ? "#d0bcff" : "#6750A4",
      weight      : 1,
      opacity     : 0.25,
      fillColor   : isDark ? "#d0bcff" : "#6750A4",
      fillOpacity : 0.1
    });

    if (markers.polyline)
      markers.polyline.setStyle({
        color  : isDark ? "#fff" : "#000",
        weight : 4,
      });
  });
  // #endregion

  // #region websocket
  /**
   * @type {WebSocket}
   */
  let ws, syncOffset, rtsRaw = {}, waveRaw = {};

  /**
   * How long do wave data persists? (in seconds)
   */
  const duration = 30;

  const wsConfig = {
    type    : "start",
    key     : localStorage.getItem("key"),
    service : ["trem.rts", "trem.rtw"],
    config  : {
      "trem.rtw": runtimedefaultchartuuids.slice(0, waveCount).map(Number)
    }
  };

  setInterval(() => {
    if (syncOffset && Date.now() - syncOffset > 15_000) {
      syncOffset = 0;
      ws.terminate();
    }
  }, 25_000);

  const connect = (retryTimeout) => {
    ws = new WebSocket("wss://ws.exptech.com.tw/websocket");

    if (DEBUG_FLAG_SILLY)
      console.debug("%c[WS_CREATE]", "color: blueviolet", ws);

    ws.on("close", (code) => {
      document.getElementById("disconnected-overlay").style.display = "";

      if (code === 1006) {
        console.log(`%c[WS]%c WebSocket closed unexpectly (code ${code}). Reconnecting`, "color: blueviolet", "color:unset");
        connect(retryTimeout);
      } else {
        syncOffset = 0;
        console.log(`%c[WS]%c WebSocket closed (code ${code}). Reconnect after ${retryTimeout / 1000}s`, "color: blueviolet", "color:unset");
        ws = null;
        setTimeout(() => connect(retryTimeout), retryTimeout).unref();
      }
    });

    ws.on("error", (err) => {
      console.error(err);

      ws.close(err.code);
    });

    ws.on("open", () => {
      if (DEBUG_FLAG_SILLY)
        console.debug("%c[WS_OPEN]", "color: blueviolet", ws);

      ws.send(JSON.stringify(wsConfig));
    });

    ws.on("message", (raw) => {
      const parsed = JSON.parse(raw);

      if (DEBUG_FLAG_SILLY)
        console.debug("%c[WS_MESSAGE]", "color: blueviolet", parsed);

      switch (parsed.type) {
        case "verify":{
          ws.send(JSON.stringify(wsConfig));
          break;
        }

        case "ntp": {
          syncOffset = Date.now();
          break;
        }

        case "info": {
          switch (parsed.data.code) {
            case 200: {
              if (!parsed.data.list.length) {
                // no permission to use rts
                ws.close();

                // TODO: show no permission and lock app
                break;
              }

              document.getElementById("disconnected-overlay").style.display = "none";

              if (!timer.tick)
                timer.tick = setInterval(tick, 1_000);
              break;
            }

            case 503: {
              setTimeout(() => ws.send(JSON.stringify(wsConfig)), 3_000);
              break;
            }
          }

          break;
        }

        case "data": {
          switch (parsed.data.type) {
            case "rts": {
              rtsRaw = parsed.data.data;
              break;
            }


            case "rtw": {
              if (!chartWaveData[parsed.data.id]) break;

              const time = ~~(parsed.data.time / 1000) * 1000 + Math.round((parsed.data.time % 1000) / 1000) * 500;
              parsed.data.time = time;

              const dataToPush = {
                time  : time,
                empty : false,
                data  : calculateTimeIntervals(parsed.data)
              };

              const position = chartWaveData[parsed.data.id].findIndex(v => v.empty && v.time == time);

              if (position >= 0) {
                console.debug(position, parsed.data.id, chartWaveData[parsed.data.id], dataToPush);
                chartWaveData[parsed.data.id].splice(position, 1, dataToPush);
              } else {
                chartWaveData[parsed.data.id].push(dataToPush);
              }

              break;
            }
          }

          break;
        }

        default: break;
      }
    });
  };

  const tick = () => {
    if (ws)
      rts(rtsRaw);

    updateWaveCharts();
    setTimeout(updateWaveCharts, 500);
    waveRaw = null;
  };

  connect(5000);

  // #region for debugging: replay
  let rtsReplayTime;

  /*
  let rtsReplayTime = new Date("2023-12-31 05:57:05").getTime();

  setInterval(async () => {
    try {
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 1500);
      const ans = await fetch(`https://data.exptech.com.tw/api/v1/trem/rts?time=${rtsReplayTime}`, { signal: controller.signal })
        .catch(() => void 0);
      rtsReplayTime += 1000;

      if (controller.signal.aborted || ans == undefined) return;
      rtsRaw = await ans.json();
    } catch (err) {
      // ignore exceptions
    }
  }, 1_000); */

  // #endregion

  // #endregion

  // #region rts
  /**
   * @type {Record<string, L.Marker>} 地圖上測站
   */
  const markers = {};

  const fetchFiles = async () => {
    try {
      if (DEBUG_FLAG_SILLY)
        console.debug("%c[FETCH]%c Fetching https://data.exptech.com.tw/file/resource/station.json", "color: blueviolet", "color:unset");

      const res = await (await fetch("https://data.exptech.com.tw/file/resource/station.json")).json();


      if (res) {
        const codes = Object.keys(data.code);

        for (let i = 0, k = Object.keys(res), n = k.length; i < n; i++) {
          const id = k[i];

          if (!codes.includes(`${res[id].info[0].code}`))
            delete res[id];

        }

        data.stations = res;
      }
    } catch (error) {
      console.warn("%c[FETCH]%c Failed to load station data!", "color: blueviolet", "color:unset", error);
    }
  };

  await fetchFiles();

  timer.stations = setInterval(fetchFiles, 300_000);

  let maxId;
  let chartAlerted = [];

  const chartIds = wsConfig.config["trem.rtw"];

  const rts = (rtsData) => {
    if (rtsData == null) return;

    const stations = rtsData.station;

    if (!stations) return;

    const onlineList = Object.keys(stations);
    let max = { id: null, i: -4 };
    let min = { id: null, i: 9 };
    let sum = 0;
    let count = 0;
    const area = {};
    const alerted = [];

    for (const removedStationId of Object.keys(markers).filter(v => !data.stations[v])) {
      if (removedStationId) continue;
      markers[removedStationId].remove();
      delete markers[removedStationId];
    }

    for (let i = 0, k = Object.keys(data.stations), n = k.length; i < n; i++) {
      const id = k[i];
      const stationData = data.stations[id];

      if (markers[id] instanceof L.Marker) {
        const el = markers[id].getElement();

        if (onlineList.includes(id)) {
          if (!el.classList.contains("has-data"))
            el.classList.add("has-data");

          el.style.backgroundColor = gradIntensity(stations[id].I);

          if (stations[id].I > max.i) max = { id, i: stations[id].I };

          if (stations[id].I < min.i) min = { id, i: stations[id].I };

          markers[id].setZIndexOffset(stations[id].I + 5);

          if (rtsData.Alert && stations[id].alert) {
            sum += stations[id].I;
            count++;

            let _i = intensityValueToIntensity(stations[id].I);

            if (_i == 0) _i = 1;

            if (_i > (area[stationData.PGA] ?? 0))
              area[stationData.PGA] = _i;
          }

          if (stations[id].alert)
            alerted.push(id);
        } else {
          if (el.classList.contains("has-data"))
            el.classList.remove("has-data");
          el.style.backgroundColor = "";
        }
      } else {
        markers[id] = L.marker([stationData.info[0].lat, stationData.info[0].lon], {
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

    if (waveCount) {
      if (alerted.length) {
        if (localStorage.getItem("autoSwitchWave") == "true")
          if (alerted.length >= +localStorage.getItem("minimumTriggeredStation")) {
            for (let i = 0, n = alerted.length; i < n; i++)
              if (!chartAlerted.includes(alerted[i]))
                chartAlerted.push(alerted[i]);
            setChartsToIds(chartAlerted);

            if (timer.resetWave) timer.resetWave.refresh();
          }
      } else if (chartAlerted.length && !timer.resetWave) {
        timer.resetWave = setTimeout(() => {
          chartAlerted = [];
          setChartsToIds(runtimedefaultchartuuids);
          delete timer.resetWave;
        }, 15_000);
      }

      for (let i = 0; i < waveCount; i++)
        if (chartIds[i])
          if (chartIds[i] in stations)
            charts[i].setOption({
              backgroundColor: `${gradIntensity(stations[chartIds[i]].i).hex()}10`
            });
          else
            charts[i].setOption({
              backgroundColor: "transparent"
            });
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

    if (maxId != null && max.id != null && maxId != max.id) {
      if (markers[maxId].getElement().classList.contains("max"))
        markers[maxId].getElement().classList.remove("max");

      if (!markers[max.id].getElement().classList.contains("max"))
        markers[max.id].getElement().classList.add("max");
    }

    maxId = max.id;

    const avg = (!count) ? 0 : (sum / count).toFixed(1);

    document.getElementById("max-int-marker").innerText = `max:${max.i}`;
    document.getElementById("min-int-marker").innerText = `min:${min.i}`;
    document.getElementById("avg-int-marker").innerText = `avg:${avg}`;

    document.getElementById("max-int-marker").style.bottom = `${max.i < 0 ? 2 * max.i : max.i < 5 ? 37.1428571428571 * max.i : 18.5714285714286 * max.i + 92.8571428571427}px`;
    document.getElementById("min-int-marker").style.bottom = `${min.i < 0 ? 2 * min.i : min.i < 5 ? 37.1428571428571 * min.i : 18.5714285714286 * min.i + 92.8571428571427}px`;
    document.getElementById("avg-int-marker").style.bottom = `${avg < 0 ? 2 * avg : avg < 5 ? 37.1428571428571 * avg : 18.5714285714286 * avg + 92.8571428571427}px`;

    if (rtsData || DEBUG_FLAG_ALERT_BYPASS)
      if ((rtsData.Alert && max.i >= 2) || DEBUG_FLAG_ALERT_BYPASS) {
        if (!data.alertLoop)
          data.alertLoop = true;

        if (!document.body.classList.contains("alert"))
          document.body.classList.add("alert");

        if (document.getElementById("min-int-marker").classList.contains("hide")) {
          document.getElementById("avg-int-marker").classList.remove("hide");
          document.getElementById("min-int-marker").classList.remove("hide");
        }

        document.getElementById("int-value").innerText = int[intensityValueToIntensity(stations[max.id].i)].value;
        document.getElementById("int-scale").innerText = int[intensityValueToIntensity(stations[max.id].i)].scale;
        document.getElementById("loc-city").innerText = data.code[data.stations[max.id].info[0].code]?.city ?? "";
        document.getElementById("loc-town").innerText = data.code[data.stations[max.id].info[0].code]?.town ?? "";

        if (markers.polyline)
          markers.polyline.setLatLngs([[25.26, 119.8], [data.stations[max.id].info[0].lat, data.stations[max.id].info[0].lon]]);
        else
          markers.polyline = L.polyline([[25.26, 119.8], [25.26, 119.8]], {
            color       : isDark ? "#fff" : "#000",
            weight      : 4,
            interactive : false,
            className   : "max-line",
            renderer    : L.svg({ pane: "stations" })
          }).addTo(map);


        if (!timer.alert)
          timer.alert = setInterval(() => {
            if (data.alertLoop) {
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
        if (data.alertLoop)
          data.alertLoop = false;

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

    const time = new Date(rtsData.time || Date.now());
    document.getElementById("time").innerText = `${time.getFullYear()}/${(time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1}/${time.getDate() < 10 ? `0${time.getDate()}` : time.getDate()} ${time.getHours() < 10 ? `0${time.getHours()}` : time.getHours()}:${time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes()}:${time.getSeconds() < 10 ? `0${time.getSeconds()}` : time.getSeconds()}`;
  };

  const intensityValueToIntensity = function(float) {
    return (float < 0) ? 0
      : (float < 4.5) ? Math.round(float)
        : (float < 5) ? 5
          : (float < 5.5) ? 6
            : (float < 6) ? 7
              : (float < 6.5) ? 8 : 9;
  };

  // #endregion

  // #region wave

  /**
   * @type {echarts.ECharts[]}
   */
  const charts = [];

  /**
   * @type {Record<number, ChartWaveData[]>}
   */
  const chartWaveData = {};

  for (let i = 0; i < waveCount; i++) {
    const dom = document.createElement("div");
    dom.className = "chart";
    document.getElementById("wave-container").append(dom);
    charts.push(echarts.init(dom, null, { height: (560 / waveCount) - (6 * (waveCount + 1) / waveCount), width: 394 }));
    dom.addEventListener("contextmenu", () => {
      const stations = {};
      let current;

      for (const id in data.stations) {
        const station = data.stations[id];
        const loc = data.code[station.info[0].code];

        if (wsConfig.config["trem.rtw"][i] == id)
          current = loc;

        stations[loc.city] ??= {};
        stations[loc.city][loc.town] ??= [];

        stations[loc.city][loc.town].push(new MenuItem({
          type    : "checkbox",
          checked : runtimedefaultchartuuids.includes(id),
          label   : `${station.net} ${id}`,
          enabled : !(runtimedefaultchartuuids.includes(id) || runtimedefaultchartuuids[i] == id),
          click   : (item) => {
            localStorage.setItem(`chart${i}`, id);
            runtimedefaultchartuuids[i] = id;
            setChartsToIds(runtimedefaultchartuuids);
          }
        }));
      }

      const cityMenu = new Menu();

      for (const city in stations) {
        const totalStationCountInThisCity = Object.keys(stations[city])
          .reduce((acc, v) => (acc += stations[city][v].length, acc), 0);

        const townMenu = new Menu();

        for (const town in stations[city]) {
          const stationMenu = new Menu();
          for (const stationItem of stations[city][town])
            stationMenu.append(stationItem);

          townMenu.append(new MenuItem({
            type    : "submenu",
            label   : `${town} (${stations[city][town].length})`,
            submenu : stationMenu,
            ...(current.town == town ? {
              icon: path.resolve(__dirname, `../resources/images/${window.matchMedia("(prefers-color-scheme: dark)").matches ? "" : "dark/"}check.png`),
            } : {})
          }));
        }

        cityMenu.append(new MenuItem({
          type    : "submenu",
          label   : `${city} (${totalStationCountInThisCity})`,
          submenu : townMenu,
          ...(current.city == city ? {
            icon: path.resolve(__dirname, `../resources/images/${window.matchMedia("(prefers-color-scheme: dark)").matches ? "" : "dark/"}check.png`),
          } : {})
        }));
      }

      cityMenu.popup();
    });
  }

  /**
   * @param {string[]} ids
   */
  const setChartsToIds
  = (ids) => {
    if (DEBUG_FLAG_SILLY)
      console.debug("%c[CHART]%c Setting chart to ids...", "color: blueviolet", "color:unset", ids);

    let wsSend = false;

    for (let i = 0; i < waveCount; i++)
      if (data.stations?.[ids[i]]) {
        const stationData = data.stations?.[ids[i]];

        if (chartIds[i] != ids[i]) {
          chartIds[i] = +ids[i];
          chartWaveData[i] = [];
          wsSend = true;
        }

        charts[i].setOption({
          title: {
            text: `${data.code[stationData.info[0].code].city} ${data.code[stationData.info[0].code].town} | ${stationData.net} ${chartIds[i]}`,
          }
        });
      } else {
        chartIds.splice(i, 1);
        charts[i].clear();
        charts[i].setOption({
          title: {
            textStyle: {
              fontSize   : 10,
              fontFamily : "Consolas",
              color      : "#888"
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
            splitNumber : 3,
            axisLabel   : {
              fontSize : 10,
              inside   : true
            }
          },
          grid: {
            top    : 24,
            right  : 0,
            bottom : 8,
            left   : 0
          },
          series: [
            {
              type       : "line",
              showSymbol : false,
              lineStyle  : { color: isDark ? "#fff" : "#000", width: 1.5 },
              data       : []
            }
          ]
        });
      }

    if (wsSend)
      if (ws.readyState == ws.OPEN) {
        if (DEBUG_FLAG_SILLY)
          console.debug("%c[WS_SEND]", "color: blueviolet", wsConfig);

        ws.send(JSON.stringify(wsConfig));
      } else if (DEBUG_FLAG_SILLY) {
        console.debug("%c[WS_SEND]%c Tried to send, but ws is closed.", "color: blueviolet", "color:unset", wsConfig);
      }
  };

  if (waveCount) {
    setChartsToIds(runtimedefaultchartuuids);

    for (const chart of charts)
      chart.setOption({
        title: {
          textStyle: {
            fontSize   : 10,
            fontFamily : "Consolas",
            color      : "#888"
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
          splitNumber : 2,
          axisLabel   : {
            fontSize : 10,
            inside   : true
          }
        },
        grid: {
          top    : 24,
          right  : 0,
          bottom : 8,
          left   : 0
        },
        series: [
          {
            type       : "line",
            showSymbol : false,
            lineStyle  : { color: isDark ? "#fff" : "#000", width: 1.5 },
            data       : []
          }
        ]
      });
  }

  /**
   * Pick Z-Axis data, calculates and append time into each points
   * @param {RawWaveData} rawWaveData
   * @returns {TimedPoint[]}
   */
  const calculateTimeIntervals = (rawWaveData) => {
    const time = rawWaveData.time;
    const n = rawWaveData.Z.length;
    const timeOffset = 500 / n;

    const arr = [];

    for (let i = 0; i < n; i++) {
      const calculatedTime = time + (i * timeOffset);
      arr.push({
        name  : toHHmmssS(calculatedTime),
        value : [calculatedTime, Math.round(+rawWaveData.Z[i] * 10000)]
      });
    }

    return arr;
  };

  /**
   * Find the limit of the data and return the desired bound
   * @param {TimedPoint[]} points
   */
  const findBounds = (points, id) => {
    let max = 0;

    for (let i = 0, n = points.length; i < n; i++) {
      const val = Math.abs(points[i].value[1]);

      if (max < val)
        max = val;
    }

    let scale = (data.stations[id].net == "MS-Net") ? 50 : 20000 ;
    scale += scale * +(localStorage.getItem("chartYScale") ?? "5");
    max = Math.ceil(max * 100) / 100;
    max += max * 0.2;
    max = Math.max(scale, max);

    return {
      max : max,
      min : -max
    };
  };

  /**
   * Converts `chartWaveData` into series and update the chart
   * @returns {void}
   */
  const updateWaveCharts = () => {
    const now = Date.now();
    const half = ~~(now / 1000) * 1000 + Math.round((now % 1000) / 1000) * 500;

    for (let i = 0; i < waveCount; i++) {
      const id = chartIds[i];

      if (chartWaveData[id]) {
        if (!chartWaveData[id].find(v => v.time == half))
          chartWaveData[id].push({
            time  : half,
            empty : true,
            data  : [{
              name  : toHHmmssS(half),
              value : [half, null]
            }, {
              name  : toHHmmssS(half + 250),
              value : [half + 250, null]
            }]
          });
      } else {
        // init chartWaveData for this id
        chartWaveData[id] = [];

        for (let j = duration * 2; j > 0; j--) {
          const offset = j * 500;
          const offsetTime = half - offset;

          chartWaveData[id].push({
            time  : offsetTime,
            empty : true,
            data  : [{
              name  : toHHmmssS(offsetTime),
              value : [offsetTime, null]
            }, {
              name  : toHHmmssS(offsetTime + 250),
              value : [offsetTime + 250, null]
            }]
          });
        }
      }

      chartWaveData[id] = chartWaveData[id].sort((a, b) => a.time - b.time);

      while ((half - chartWaveData[id][0].time) > duration * 1000)
        chartWaveData[id].shift();

      const allPoints = chartWaveData[id].flatMap((v) => v.data);
      const bounds = findBounds(allPoints, id);
      charts[i].setOption({
        animation : false,
        yAxis     : bounds,
        series    : [{
          type : "line",
          data : allPoints
        }]
      });
    }
  };
  // #endregion

  // #region Shortcuts

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "o") {
      event.preventDefault();
      // Perform the action for the keyboard shortcut
      document.getElementById("settings").classList.toggle("show");
    }
  });

  (() => {
    document.addEventListener("click", (e) => {
      if (!document.getElementById("settings").contains(e.target))
        document.getElementById("settings").classList.remove("show");
    });

    document.getElementById("option__muted").checked = localStorage.getItem("muted") == "true";
    document.getElementById("option__muted").addEventListener("click", function() {
      localStorage.setItem("muted", this.checked);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById("option__area").checked = localStorage.getItem("area") == "true";
    document.getElementById("option__area").addEventListener("click", function() {
      localStorage.setItem("area", this.checked);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById("option__alwaysontop").checked = localStorage.getItem("alwaysOnTop") == "true";
    document.getElementById("option__alwaysontop").addEventListener("click", function() {
      localStorage.setItem("alwaysOnTop", this.checked);
      ipcRenderer.send("SET:aot", this.checked);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById(`option__theme__${localStorage.getItem("themeMode")}`).selected = true;
    document.getElementById("option__theme").addEventListener("change", function() {
      localStorage.setItem("themeMode", this.selectedOptions[0].value);
      nativeTheme.themeSource = this.selectedOptions[0].value;
      ipcRenderer.send("UPDATE:tray");
    });

    // wave
    document.getElementById("option__displaywavecount").value = +localStorage.getItem("displayWaveCount") ?? 6;
    document.getElementById("option__displaywavecount").addEventListener("input", function() {
      localStorage.setItem("displayWaveCount", this.value);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById(`option__chartyscale__${localStorage.getItem("chartYScale")}`).selected = true;
    document.getElementById("option__chartyscale").addEventListener("change", function() {
      localStorage.setItem("chartYScale", this.selectedOptions[0].value);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById("option__autoswitchwave").checked = localStorage.getItem("autoSwitchWave") == "true";
    document.getElementById("option__autoswitchwave").addEventListener("click", function() {
      localStorage.setItem("autoSwitchWave", this.checked);
      ipcRenderer.send("UPDATE:tray");
    });
    document.getElementById("option__minimumtriggeredstation").value = +localStorage.getItem("minimumTriggeredStation") ?? 6;
    document.getElementById("option__minimumtriggeredstation").setAttribute("max", localStorage.getItem("displayWaveCount") ?? "6");
    document.getElementById("option__minimumtriggeredstation").addEventListener("input", function() {
      localStorage.setItem("minimumTriggeredStation", this.value);
      ipcRenderer.send("UPDATE:tray");
    });
  })();

  // api
  document.getElementById("option__apikey").value = localStorage.getItem("key") ?? "";
  document.getElementById("option__apikey").addEventListener("change", function() {
    localStorage.setItem("key", this.value);
    wsConfig.key = this.value;

    if (ws instanceof WebSocket && ws.readyState == ws.OPEN)
      ws.send(JSON.stringify(wsConfig));

    ipcRenderer.send("UPDATE:tray");
  });
  document.getElementById("option__backgroundthrottling").checked = localStorage.getItem("backgroundThrottling") == "true";
  document.getElementById("option__backgroundthrottling").addEventListener("click", function() {
    localStorage.setItem("backgroundThrottling", this.checked);
    ipcRenderer.send("SET:bt", this.checked);
    ipcRenderer.send("UPDATE:tray");
  });
  document.getElementById("option__debug__alertbypass").addEventListener("click", function() {
    DEBUG_FLAG_ALERT_BYPASS = this.checked;
  });
  document.getElementById("option__debug__silly").addEventListener("click", function() {
    DEBUG_FLAG_SILLY = this.checked;
  });
  // #endregion
};


document.addEventListener("DOMContentLoaded", ready);

// #region jsdoc typedef

/**
 * @typedef {string} StationId
 */

/**
* @typedef {object} StationInfo
* @property {number} code 代號
* @property {number} lat  緯度
* @property {number} lon  經度
* @property {string} time 設立時間
*/

/**
* @typedef {object} Station
* @property {StationInfo[]} info  緯度
* @property {string} net        位置
* @property {boolean} work      運行狀態
*/

/**
 * @typedef StationRTS
 * @property {number} pga 加速度
 * @property {number} pgv 速度
 * @property {number} i 震度
 * @property {number} I 即時震度
 */

/**
 * @typedef TimedPoint
 * @property {string} name
 * @property {[number, number]} value
 */

/**
 * @typedef ChartWaveData
 * @property {number} time
 * @property {boolean} empty whether the data is null / empty
 * @property {TimedPoint[]} data
 */

/**
 * @typedef RawWaveData
 * @property {number} id
 * @property {number[]} X
 * @property {number[]} Y
 * @property {number[]} Z
 * @property {number} time
 */

// #endregion