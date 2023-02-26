// Copyright (c) Microsoft Corporation and Contributors.
// Licensed under the MIT License.

using Microsoft.UI.Xaml.Controls;
using Mapsui.Tiling;
using Mapsui;
using Microsoft.UI.Xaml.Navigation;
using Mapsui.Projections;
using Mapsui.Extensions;
using Mapsui.UI.WinUI;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace rts_map.Pages
{
    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MapPage : Page
    {
        private static Map _map;

        public MapPage()
        {
            this.InitializeComponent();

            if (_map == null)
            {
                _map = new Map();
                _map.Layers.Add(OpenStreetMap.CreateTileLayer());
                var tw = new MPoint(121, 23.5);
                var coord = SphericalMercator.FromLonLat(tw.X, tw.Y).ToMPoint();
                _map.Home = n => n.NavigateTo(coord, _map.Resolutions[7]);
            }

            MyMap.Map = _map;
        }
    }
}
