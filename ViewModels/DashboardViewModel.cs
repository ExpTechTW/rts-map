using CommunityToolkit.Mvvm.ComponentModel;
using Wpf.Ui.Common.Interfaces;
using LiveChartsCore;
using LiveChartsCore.Defaults;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;
using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Linq;
using Mapsui;
using Mapsui.Providers.Shapefile;
using Mapsui.Layers;
using Mapsui.Styles;
using Mapsui.Geometries;
using Mapsui.Providers;
using rts_map.DataModels;
using rts_map.Helpers;
using rts_map.WebSocket;
using System.Diagnostics;

namespace rts_map.ViewModels
{
    public partial class DashboardViewModel : ObservableObject, INavigationAware
    {
        [ObservableProperty]
        private int _counter = 0;

        public void OnNavigatedTo()
        {
        }

        public void OnNavigatedFrom()
        {
        }

        public DashboardViewModel()
        {
            var countySource = new ShapeFile(new Uri("./Assets/GeoData/COUNTY_MOI_1090820.shp", UriKind.Relative).ToString(), true);

            Map.Layers.Add(new RasterizingLayer(CreateCountryLayer(countySource)));
            Map.Layers.Add(new RasterizingLayer(CreateCountryOutlineLayer(countySource)));

            var center = new Point(120.65, 23.61);
            Map.Home = n =>
            {
                n.NavigateTo(center, 0.0075f);
                // Map.PanLock = true;
                // Map.ZoomLock = true;
                Map.RotationLock = true;
            };
            Map.BackColor = Color.Transparent;

            for (int i = 0; i < 6; i++)
            {
                Datas.Add(new ObservableCollection<DateTimePoint>());

                SeriesCollections.Add(
                    new ISeries[]
                    {
                        new LineSeries<DateTimePoint>
                        {
                            Values = Datas[i],
                            Fill = null,
                            GeometrySize = 0,
                            Stroke = new SolidColorPaint(SKColors.White) { StrokeThickness = 2 }
                        }
                    }
                );

                YAxes.Add(
                    new Axis[]
                    {
                        new Axis
                        {
                            IsVisible = false,
                            MaxLimit = 5,
                            MinLimit = -5,
                        }
                    }
                );
            }

            FetchFiles();

            WebSocketClient ws = new WebSocketClient();
            ws.OnRtsData += Ws_OnRtsData;
            ws.OnWaveData += Ws_OnWaveData;
            ws.Connect();
        }

        private async void FetchFiles()
        {
            Dictionary<string, StationData> data = await API.GetStationData();

            if (data != null) {
                Dictionary<string, StationData> mappedStationData = new();
                Dictionary<string, StationData> excludedStationData = new();

                foreach (var (item, key) in data.Select(v => (v.Value, v.Key)))
                {
                    item.Uuid = key;
                    if (item.Long > 118 && item.Lat < 26.3)
                    { 
                        mappedStationData.Add(key.Split("-")[2], item);
                    }
                    else
                    {
                        excludedStationData.Add(key.Split("-")[2], item);
                    }
                }

                StationData = mappedStationData;
                ExcludedStationData = excludedStationData;
                UpdateMarkers();
            }
        }

        private static ILayer CreateCountryLayer(IProvider countrySource)
        {
            return new Layer
            {
                Name = "County",
                DataSource = countrySource,
                Style = new VectorStyle()
                {
                    Fill = new Brush(Color.FromString("#d0bcff")),
                    Outline = new Pen(Color.Transparent),
                    Opacity = 0.1f
                }
            };
        }

        private static ILayer CreateCountryOutlineLayer(IProvider countrySource)
        {
            return new Layer
            {
                Name = "County Outline",
                DataSource = countrySource,
                Style = new VectorStyle()
                {
                    Fill = new Brush(Color.Transparent),
                    Outline = new Pen(Color.FromString("#d0bcff"), 1)
                }
            };
        }

        private Dictionary<string, Feature> Markers { get; set; } = new();

        public MemoryLayer MarkerLayer { get; set; } = new MemoryLayer
        {
            Name = "markers",
            Style = null
        };

        private void UpdateMarkers()
        {
            foreach (var (item, key) in StationData.Select(v => (v.Value, v.Key)))
            {
                Feature feature = new Feature { Geometry = new Point(item.Long, item.Lat) };
                feature.Styles.Add(new SymbolStyle
                {
                    SymbolScale = .25f,
                    Fill = new Brush { Color = Color.Transparent },
                    Outline = new Pen { Color = Color.FromString("#49454F"), Width = 2 },
                });

                Markers.Add(key, feature);
            }

            MarkerLayer.DataSource = new MemoryProvider(Markers.Values);

            Map.Layers.Add(MarkerLayer);
        }

        private void Ws_OnRtsData(object? sender, Dictionary<string, dynamic> e)
        {
            // textblock.Text = e.ToString();

            // REFACTOR: needs to be refactored to not use nested ifs

            Dictionary<string, dynamic> filteredData = e.Where(kvp => !ExcludedStationData.ContainsKey(kvp.Key)).ToDictionary(x => x.Key, x => x.Value);
            
            string maxkey = filteredData.MaxBy(kvp => kvp.Key == "Time" ? -500 : (double)kvp.Value.i).Key;
            Trace.WriteLine(Markers.ContainsKey(maxkey));

            foreach (var (item, key) in StationData.Select(v => (v.Value, v.Key)))
            {
                if (Markers.ContainsKey(key) && Markers[key] != null)
                {
                    if (filteredData.ContainsKey(key) && filteredData[key] != null)
                    {
                        ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Fill.Color = Gradient.GetColor((double)filteredData[key].i);
                        if (key == maxkey)
                        {
                            ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Outline.Color = Color.White;
                            ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Outline.Width = 20;
                        }
                        else
                        {
                            ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Outline.Color = Color.FromString("#938F99");
                            ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Outline.Width = 2;
                        }
                    }
                    else
                    {
                        ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Fill.Color = Color.Transparent;
                        ((SymbolStyle)Markers[key].Styles.ElementAt(0)).Outline.Color = Color.FromString("#49454F");
                    }
                }
            }

            MarkerLayer.DataHasChanged();
        }

        private void Ws_OnWaveData(object? sender, WaveData[] e)
        {
            DateTime nowTime = DateTime.Now;

            for (int i = 0; i < 6; i++)
            {
                if (Datas[i].Count < 1000)
                {
                    int second = 0;
                    while (Datas[i].Count < 1000)
                    {
                        for (int j = 0; j < 18; j++)
                        {
                            Datas[i].Insert(
                                0,
                                new DateTimePoint(
                                    nowTime.Subtract(
                                        TimeSpan.FromMilliseconds(second * 1000 + (1000 / 18) * j)
                                    ),
                                    0
                                )
                            );
                        }
                        second++;
                    }
                }

                foreach (var (item, j) in e[i].raw.Select((value, index) => (value, index)))
                {
                    Datas[i].Add(new DateTimePoint(nowTime.AddMilliseconds((1000 / e[0].raw.Length) * j), item));
                }

                while (Datas[i].Count > 1000)
                {
                    Datas[i].RemoveAt(0);
                }

                double? max = (double)Datas[i].Max(x => Math.Abs((decimal)x.Value));

                if (max.HasValue)
                {
                    if (e[i].uuid.StartsWith("H"))
                    {
                        if (max < 5) { max = 5; }
                    }
                    else if (e[i].uuid.StartsWith("L"))
                    {
                        if (max < 4000) { max = 4000; }
                    }

                    YAxes[i][0].MaxLimit = max;
                    YAxes[i][0].MinLimit = -max;
                }
            }
        }

        public Map Map { get; set; } = new();

        public List<ObservableCollection<DateTimePoint>> Datas { get; set; } = new();

        public List<ISeries[]> SeriesCollections { get; set; } = new();

        public Axis[] XAxes { get; set; } =
            {
                new Axis
                {
                    IsVisible = false
                }
            };

        public List<Axis[]> YAxes { get; set; } = new();

        public Dictionary<string, StationData> StationData { get; set; }
        public Dictionary<string, StationData> ExcludedStationData { get; set; }
    }
}
