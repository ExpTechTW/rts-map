using Newtonsoft.Json;
using rts_map.DataModels;
using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace rts_map.WebSocket
{
    public class WebSocketClient
    {
        private readonly string _apikey;

        private WebSocketSharp.WebSocket ws;

        public event EventHandler<Dictionary<string, object>> OnRtsData;
        public event EventHandler<WaveData[]> OnWaveData;

        public WebSocketClient(string key)
        {
            _apikey = key;
        }

        public void Connect()
        {
            Debug.Print("WebSocket\tTrying to connect...");

            ws = new WebSocketSharp.WebSocket("wss://exptech.com.tw/api");

            ws.OnOpen += (sender, e) =>
            {
                Debug.Print("WebSocket\tConnection Opened");

                string message = $$"""
                    {
                        "uuid"     : "rts-map/0.0.1-csharp.beta",
                        "function" : "subscriptionService",
                        "value"    : ["trem-rts-v2", "trem-rts-original-v1"],
                        "key"      : "{{_apikey}}",
                        "addition" : {
                            "trem-rts-original-v1": [
                                "H-335-11339620-4",
                                "H-979-11336952-11",
                                "H-711-11334880-12",
                                "H-541-11370676-10",
                                "L-269-11370996-5",
                                "L-648-4832348-9"
                            ]
                        }
                    }
                    """;

                ws.Send(message);
            };

            ws.OnMessage += (sender, e) =>
            {
                try
                {
                    SocketRawData parsed = JsonConvert.DeserializeObject<SocketRawData>(e.Data);

                    if (parsed == null) return;

                    if (parsed.response != null)
                    {
                        switch (parsed.response)
                        {
                            case "Connection Succeeded":
                                Debug.Print("WebSocket\tConnection Succeeded");
                                break;

                            default:
                                Trace.WriteLine($"WebSocket\t{parsed}");
                                break;
                        }
                    }
                    else if (parsed.type != null)
                    {
                        switch (parsed.type)
                        {
                            case "trem-rts":
                                if (OnRtsData != null)
                                {
                                    string rawString = JsonConvert.SerializeObject(parsed.raw);
                                    OnRtsData(this, JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(rawString));
                                }
                                break;

                            case "trem-rts-original":
                                if (OnWaveData != null)
                                {
                                    string rawString = JsonConvert.SerializeObject(parsed.raw);
                                    OnWaveData(this, JsonConvert.DeserializeObject<WaveData[]>(rawString));
                                }
                                break;

                            default:
                                break;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Trace.WriteLine(ex);
                }
            };

            ws.Connect();
        }

        public void Disconnect()
        {
            ws.Close();
        }
    }
}