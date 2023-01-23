const { setTimeout, setInterval, clearTimeout, clearInterval } = require("node:timers");
const L = require("leaflet");
const chroma = require("chroma-js");
const path = require("node:path");

const grad_i
  = chroma
    .scale([ "#0500A3", "#00ceff", "#33ff34", "#fdff32", "#ff8532", "#fc5235", "#c03e3c", "#9b4544", "#9a4c86", "#b720e9" ])
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

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

const ready = async () => {
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
  // #endregion

  // #region set view

  map.setView([23.61, 120.65], 7.5);

  window.addEventListener("resize", () => {
    window.resizeTo(400, 560);
    map.setView([23.61, 120.65], 7.5);
  });

  // #endregion

  // #region websocket
  /**
   * @type {Record<string, StationRTS} 即時資料
   */
  let rts_data;

  const connect = (retryTimeout) => {
    const ws = new WebSocket("wss://exptech.com.tw/api");

    ws.addEventListener("close", () => {
      console.debug(`WebSocket closed. Reconnect after ${retryTimeout / 1000}s`);
      setTimeout(connect, retryTimeout, retryTimeout).unref();
    });

    ws.addEventListener("error", (err) => {
      console.error(err);
    });

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        uuid     : "rts-map",
        function : "subscriptionService",
        value    : ["trem-rts-v2"],
      }));
    });

    ws.addEventListener("message", (ev) => {
      const parsed = JSON.parse(ev.data);

      if (parsed.response == "Connection Succeeded")
        console.debug("WebSocket has connected");
      else if (parsed.response == "Subscription Succeeded")
        console.debug("Subscribed to trem-rts-v2");
      else if (parsed.type == "trem-rts")
        if (parsed.raw)
          rts_data = parsed.raw;
    });
  };

  connect(1000);
  // #endregion

  // #region marker
  /**
   * @type {Record<string, L.Marker>} 地圖上測站
   */
  const markers = {};

  const fetch_files = async () => {
    const res = await (await fetch("https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json")).json();
    const s = {};

    for (let i = 0, k = Object.keys(res), n = k.length; i < n; i++) {
      const id = k[i];
      s[id.split("-")[2]] = res[id];
    }

    data.stations = s;
  };

  await fetch_files();

  timer.stations = setInterval(fetch_files, 300_000);

  let max_id;

  timer.update = setInterval(() => {
    let max = { id: null, v: -5 };
    let min = { id: null, v: 9999 };
    let sum = 0;

    if (!rts_data) return;

    for (let i = 0, k = Object.keys(data.stations), n = k.length; i < n; i++) {
      const id = k[i];
      const station_data = data.stations[id];

      if (markers[id] instanceof L.Marker) {
        const el = markers[id].getElement();

        if (id in rts_data) {
          if (!el.classList.contains("has-data"))
            el.classList.add("has-data");

          el.style.backgroundColor = grad_i(rts_data[id].i);

          if (rts_data[id].v > max.v) max = { id, v: rts_data[id].v, i: rts_data[id].i };

          if (rts_data[id].v < min.v) min = { id, v: rts_data[id].v, i: rts_data[id].i };

          sum += rts_data[id].i;

          markers[id].setZIndexOffset(rts_data[id].i + 5);
        } else if (el.classList.contains("has-data")) {
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

    if (max_id != null && max.id != null) {
      if (markers[max_id].getElement().classList.contains("max"))
        markers[max_id].getElement().classList.remove("max");

      if (!markers[max.id].getElement().classList.contains("max"))
        markers[max.id].getElement().classList.add("max");
    }

    max_id = max.id;

    const avg = (sum / Object.keys(data.stations).length).toFixed(1);

    document.getElementById("max-int-marker").innerText = `max:${max.i ?? 0}`;
    document.getElementById("max-int-marker").innerText = `max:${max.i ?? 0}`;
    document.getElementById("avg-int-marker").innerText = `avg:${avg ?? 0}`;

    document.getElementById("max-int-marker").style.bottom = `${max.i < 0 ? 2 * max.i : max.i < 5 ? 37.1428571428571 * max.i : 18.5714285714286 * max.i + 92.8571428571427}px`;
    document.getElementById("min-int-marker").style.bottom = `${min.i < 0 ? 2 * min.i : min.i < 5 ? 37.1428571428571 * min.i : 18.5714285714286 * min.i + 92.8571428571427}px`;
    document.getElementById("avg-int-marker").style.bottom = `${avg < 0 ? 2 * avg : avg < 5 ? 37.1428571428571 * avg : 18.5714285714286 * avg + 92.8571428571427}px`;

    if (rts_data)
      if (rts_data.Alert) {
        if (!data.alert_loop)
          data.alert_loop = true;

        if (!document.body.classList.contains("alert"))
          document.body.classList.add("alert");

        document.getElementById("int-value").innerText = int[(~~rts_data[max.id]?.i < 0) ? 0 : ~~rts_data[max.id]?.i ?? 0].value;
        document.getElementById("int-scale").innerText = int[(~~rts_data[max.id]?.i < 0) ? 0 : ~~rts_data[max.id]?.i ?? 0].scale;
        document.getElementById("loc-county").innerText = data.stations[max.id]?.Loc?.split(" ")?.[0] ?? "";
        document.getElementById("loc-town").innerText = data.stations[max.id]?.Loc?.split(" ")?.[1] ?? "";

        if (markers.polyline)
          markers.polyline.setLatLngs([[25.38, 119.62], [data.stations[max.id].Lat, data.stations[max.id].Long]]);
        else
          markers.polyline = L.polyline([[25.38, 119.62], [25.38, 119.62]], {
            color       : "#ffffff",
            weight      : 4,
            interactive : false,
            className   : "max-line",
            renderer    : L.svg({ pane: "stations" })
          }).addTo(map);

        if (!timer.alert)
          timer.alert = setInterval(() => {
            if (data.alert_loop) {
              data.alert.play();
            } else {
              clearInterval(timer.alert);
              delete timer.alert;
            }
          }, 700);
      } else {
        if (data.alert_loop)
          data.alert_loop = false;

        if (document.body.classList.contains("alert"))
          document.body.classList.remove("alert");

        if (markers.polyline) {
          markers.polyline.remove();
          delete markers.polyline;
        }
      }

    const time = new Date(rts_data?.[max.id]?.T * 1000 || Date.now());
    document.getElementById("time").innerText = `${time.getFullYear()}/${(time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1}/${time.getDate() < 10 ? `0${time.getDate()}` : time.getDate()} ${time.getHours() < 10 ? `0${time.getHours()}` : time.getHours()}:${time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes()}:${time.getSeconds() < 10 ? `0${time.getSeconds()}` : time.getSeconds()}`;
  }, 500);

  // #endregion
};

document.addEventListener("DOMContentLoaded", ready);

// #region jsdoc typedef

/**
* @typedef {object} Station
* @property {number} Lat  緯度
* @property {number} Long 經度
* @property {number} PGA  area 框框編號
* @property {string} Loc  位置
* @property {string} area 地區
*/

/**
 * @typedef StationRTS
 * @property {number} PGA     地動加速度
 * @property {number} PGV     地動速度
 * @property {number} I       60 秒內最大震度
 * @property {number} TS      伺服器接收時間
 * @property {number} T       數據測得時間
 * @property {?boolean} alert 警報觸發
 */

// #endregion