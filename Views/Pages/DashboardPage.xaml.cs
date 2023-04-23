using Wpf.Ui.Common.Interfaces;
using Mapsui;
using Mapsui.Providers.Shapefile;
using System.Reflection;
using System.IO;
using Mapsui.Layers;
using Mapsui.Providers;
using Mapsui.Styles.Thematics;
using Mapsui.Styles;
using System;
using Mapsui.UI;
using Mapsui.Projection;
using Mapsui.Geometries;
using rts_map.WebSocket;
using rts_map.DataModels;
using System.Collections.Generic;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore;
using LiveChartsCore.Defaults;
using System.Linq;
using System.Diagnostics;
using LiveChartsCore.Drawing;

namespace rts_map.Views.Pages
{
    /// <summary>
    /// Interaction logic for DashboardPage.xaml
    /// </summary>
    public partial class DashboardPage : INavigableView<ViewModels.DashboardViewModel>
    {
        public ViewModels.DashboardViewModel ViewModel
        {
            get;
        }

        public DashboardPage(ViewModels.DashboardViewModel viewModel)
        {
            ViewModel = viewModel;

            InitializeComponent();
            
            map.Map = ViewModel.Map;
        }

    }
}