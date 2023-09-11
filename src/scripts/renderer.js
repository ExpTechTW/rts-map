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
    "H-269-4812424-5",
    "H-335-11339620-4",
    "H-541-11370676-10",
    "H-711-11334880-12",
    "H-905-6125804-15",
    "H-911-1480496-15",
    "H-974-6126556-11",
    "H-979-11336952-11"
  ];

  const gradIntensity
  = chroma
    .scale(["#0500A3", "#00ceff", "#33ff34", "#fdff32", "#ff8532", "#fc5235", "#c03e3c", "#9b4544", "#9a4c86", "#b720e9"])
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const waveCount = +(localStorage.getItem("displayWaveCount") ?? 6);

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

  map.setView([23.61, 120.65], 7.5);

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
  let ws, heartbeatTimestamp, rtsRaw = {}, waveRaw = {};

  setInterval(() => {
    if (heartbeatTimestamp && Date.now() - heartbeatTimestamp > 15_000) {
      heartbeatTimestamp = 0;
      ws.terminate();
    }
  }, 25_000);

  const connect = (retryTimeout) => {
    ws = new WebSocket("wss://exptech.com.tw/api");

    if (DEBUG_FLAG_SILLY)
      console.debug("%c[WS_CREATE]", "color: blueviolet", ws);

    ws.on("close", () => {
      heartbeatTimestamp = 0;
      console.log(`%c[WS]%c WebSocket closed. Reconnect after ${retryTimeout / 1000}s`, "color: blueviolet", "color:unset");
      ws = null;
      setTimeout(() => connect(retryTimeout), retryTimeout).unref();
    });

    ws.on("error", (err) => {
      console.error(err);
    });

    ws.on("open", () => {
      if (DEBUG_FLAG_SILLY)
        console.debug("%c[WS_OPEN]", "color: blueviolet", ws);

      while (!subscribe());
    });

    ws.on("message", (raw) => {
      const parsed = JSON.parse(raw);

      if (DEBUG_FLAG_SILLY)
        console.debug("%c[WS_MESSAGE]", "color: blueviolet", parsed);

      if (parsed.type == "ntp") {
        heartbeatTimestamp = Date.now();
      } else if (parsed.response == "Connection Succeeded") {
        console.debug("%c[WS]%c WebSocket has connected", "color: blueviolet", "color:unset");
      } else if (parsed.response == "Subscription Succeeded") {
        console.debug("%c[WS]%c Subscribed to trem-rts-v2", "color: blueviolet", "color:unset");

        if (!timer.tick)
          timer.tick = setInterval(tick, 1_000);
      } else if (parsed.type == "trem-rts") {
        if (parsed.raw != null)
          rtsRaw = parsed.raw;
      } else if (parsed.type == "trem-rts-original") {
        const newWaveRaw = {};
        for (let i = 0; i < parsed.raw.length; i++)
          newWaveRaw[parsed.raw[i].uuid] = parsed.raw[i].raw;

        if (newWaveRaw != null)
          waveRaw = newWaveRaw;
      }
    });
  };

  const subscribe = () => {
    if (!(ws instanceof WebSocket)) return false;

    if (ws.readyState !== ws.OPEN) return false;

    const message = {
      uuid     : requestUA,
      function : "subscriptionService",
      value    : ["trem-rts-v2", ...(waveCount > 0 ? ["trem-rts-original-v1"] : [])],
      key      : localStorage.getItem("key") ?? "",
      ...(waveCount > 0
        ? {
          addition: {
            "trem-rts-original-v1": chartuuids
          }
        }
        : {})
    };

    if (DEBUG_FLAG_SILLY)
      console.debug("%c[WS_SEND]", "color: blueviolet", message);

    ws.send(JSON.stringify(message));
    return true;
  };

  const tick = () => {
    rts(rtsRaw);
    wave(waveRaw);
    waveRaw = null;
  };

  connect(5000);

  // #region for debugging: replay

  // let rts_replay_time = 1686375110598;

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
  //     rts_raw = await ans.json();
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

  const fetchFiles = async () => {
    try {
      if (DEBUG_FLAG_SILLY)
        console.debug("%c[FETCH]%c Fetching https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json", "color: blueviolet", "color:unset");

      const res = await (await fetch("https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json")).json();
      const s = {};

      if (res) {
        for (let i = 0, k = Object.keys(res), n = k.length; i < n; i++) {
          const id = k[i];

          if (res[id].Long > 118 && res[id].Lat < 26.3)
            s[id.split("-")[2]] = { uuid: id, ...res[id] };
        }

        data.stations = s;
      }
    } catch (error) {
      console.warn("%c[FETCH]%c Failed to load station data!", "color: blueviolet", "color:unset", error);
    }
  };

  await fetchFiles();

  timer.stations = setInterval(fetchFiles, 300_000);

  let maxId;
  let chartAlerted = [];

  const rts = (rtsData) => {
    if (rtsData == null) return;

    const onlineList = Object.keys(rtsData);
    let max = { id: null, i: -4 };
    let min = { id: null, i: 8 };
    let sum = 0;
    let count = 0;
    const area = {};
    const alerted = [];

    for (const removedStationId of Object.keys(markers).filter(v => !data.stations[v])) {
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

          el.style.backgroundColor = gradIntensity(rtsData[id].i);

          if (rtsData[id].i > max.i) max = { id, i: rtsData[id].i };

          if (rtsData[id].i < min.i) min = { id, i: rtsData[id].i };

          markers[id].setZIndexOffset(rtsData[id].i + 5);

          if (rtsData.Alert && rtsData[id].alert) {
            sum += rtsData[id].i;
            count++;

            let _i = intensityValueToIntensity(rtsData[id].i);

            if (_i == 0) _i = 1;

            if (_i > (area[stationData.PGA] ?? 0))
              area[stationData.PGA] = _i;
          }

          if (rtsData[id].alert)
            alerted.push(id);
        } else {
          if (el.classList.contains("has-data"))
            el.classList.remove("has-data");
          el.style.backgroundColor = "";
        }
      } else {
        markers[id] = L.marker([stationData.Lat, stationData.Long], {
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

      for (let i = 0; i < waveCount; i++)
        if (chartuuids[i]) {
          const id = chartuuids[i].split("-")[2];

          if (id in rtsData)
            charts[i].setOption({
              backgroundColor: `${gradIntensity(rtsData[id].i).hex()}10`
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

        document.getElementById("int-value").innerText = int[intensityValueToIntensity(rtsData[max.id].i)].value;
        document.getElementById("int-scale").innerText = int[intensityValueToIntensity(rtsData[max.id].i)].scale;
        document.getElementById("loc-county").innerText = data.stations[max.id]?.Loc?.split(" ")?.[0] ?? "";
        document.getElementById("loc-town").innerText = data.stations[max.id]?.Loc?.split(" ")?.[1] ?? "";

        if (markers.polyline)
          markers.polyline.setLatLngs([[25.26, 119.8], [data.stations[max.id].Lat, data.stations[max.id].Long]]);
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

    const time = new Date(rtsData.Time || Date.now());
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

  const charts = [];
  const chartdata = [];

  for (let i = 0; i < waveCount; i++) {
    const dom = document.createElement("div");
    dom.className = "chart";
    document.getElementById("wave-container").append(dom);
    charts.push(echarts.init(dom, null, { height: (560 / waveCount) - (6 * (waveCount + 1) / waveCount), width: 394 }));
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
          if (runtimedefaultchartuuids.list[i] == stations[k[j]][l].uuid)
            selected = true;

          group.append(new MenuItem({
            type     : "checkbox",
            checked  : runtimedefaultchartuuids.list.includes(stations[k[j]][l].uuid),
            label    : `${stations[k[j]][l].Loc}　　　`,
            sublabel : stations[k[j]][l].uuid,
            enabled  : !(runtimedefaultchartuuids.list.includes(stations[k[j]][l].uuid) && runtimedefaultchartuuids.list[i] != stations[k[j]][l].uuid),
            click    : (item) => {
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
      console.debug("%c[CHART]%c Setting chart to ids...", "color: blueviolet", "color:unset", ids);

    let wsSend = false;

    for (let i = 0; i < waveCount; i++)
      if (data.stations?.[ids[i]]?.uuid) {
        if (chartuuids[i] != data.stations[ids[i]].uuid) {
          chartuuids[i] = data.stations[ids[i]].uuid;
          chartdata[i] = [];
          wsSend = true;
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
              lineStyle  : { color: isDark ? "#fff" : "#000" },
              data       : []
            }
          ]
        });
      }

    if (wsSend) {
      const message = {
        uuid     : requestUA,
        function : "subscriptionService",
        value    : ["trem-rts-v2", "trem-rts-original-v1"],
        key      : localStorage.getItem("key") ?? "",
        addition : {
          "trem-rts-original-v1": chartuuids
        }
      };

      if (ws.readyState == ws.OPEN) {
        if (DEBUG_FLAG_SILLY)
          console.debug("%c[WS_SEND]", "color: blueviolet", message);

        ws.send(JSON.stringify(message));
      } else if (DEBUG_FLAG_SILLY) {
        console.debug("%c[WS_SEND]%c Tried to send, but ws is closed.", "color: blueviolet", "color:unset", message);
      }
    }
  };

  if (waveCount) {
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
            lineStyle  : { color: isDark ? "#fff" : "#000" },
            data       : []
          }
        ]
      });
  }

  const wave = (jsondata) => {
    if (jsondata == null) return;

    const now = new Date(Date.now());

    for (let i = 0; i < waveCount; i++) {
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
              color: isDark ? "#bbb" : "#666"
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
              color: isDark ? "#666" : "#bbb"
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
      let maxmin = Math.ceil(Math.max(Math.abs(Math.max(...values)), Math.abs(Math.min(...values))));


      if (chartuuids[i]) {
        const HChartYScale = +localStorage.getItem("chartYScale");
        const LChartYScale = HChartYScale * 1000;

        if (maxmin < (chartuuids[i].startsWith("H") ? HChartYScale : LChartYScale))
          maxmin = (chartuuids[i].startsWith("H") ? HChartYScale : LChartYScale);

        charts[i].setOption({
          animation : false,
          yAxis     : {
            max : maxmin,
            min : -maxmin
          },
          series: [
            {
              lineStyle : { color: jsondata[chartuuids[i]] == null ? isDark ? "#666" : "#bbb" : isDark ? "#fff" : "#000" },
              data      : chartdata[i]
            }
          ],
        });
      }
    }

    for (let i = 0; i < Object.keys(waveRaw).length; i++) {
      const id = Object.keys(waveRaw)[i];
      waveRaw[id] = null;
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
    subscribe();
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