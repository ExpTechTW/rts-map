using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Wpf.Ui.Common.Interfaces;

using rts_map.Models;
using rts_map.Services;
using rts_map.Localizations;
using System.Globalization;
using rts_map.DataModels;
using System.Linq;
using System.Diagnostics;

namespace rts_map.ViewModels
{
    public partial class SettingsViewModel : ObservableObject, INavigationAware, INotifyPropertyChanged
    {
        private readonly ISettingsService _settingsService; 

        private bool _isInitialized = false;

        [ObservableProperty]
        private string _appVersion = String.Empty;

        private Wpf.Ui.Appearance.ThemeType _currentTheme = Wpf.Ui.Appearance.ThemeType.Unknown;
        public ComboboxItem CurrentTheme
        {
            get {
                switch (_currentTheme)
                {
                    case Wpf.Ui.Appearance.ThemeType.Light:
                        return Themes["light"];

                    case Wpf.Ui.Appearance.ThemeType.Dark:
                        return Themes["dark"];

                    default:
                        return Themes["system"];
                }
            }
            set
            {
                if (value.Value == CurrentTheme.Value) return;

                UserSettings userSettings = _settingsService.GetUserSettings();

                switch (value.Value)
                {
                    case "light":
                        Wpf.Ui.Appearance.Theme.Apply(Wpf.Ui.Appearance.ThemeType.Light);
                        _currentTheme = Wpf.Ui.Appearance.ThemeType.Light;
                        break;

                    case "dark":
                        Wpf.Ui.Appearance.Theme.Apply(Wpf.Ui.Appearance.ThemeType.Dark);
                        _currentTheme = Wpf.Ui.Appearance.ThemeType.Dark;
                        break;

                    default:
                        Wpf.Ui.Appearance.Theme.Apply((Wpf.Ui.Appearance.ThemeType)Wpf.Ui.Appearance.Theme.GetSystemTheme());
                        _currentTheme = Wpf.Ui.Appearance.ThemeType.Unknown;
                        break;
                }

                NotifyPropertyChanged(nameof(CurrentTheme));

                Properties.Settings.Default.AppTheme = value.Value;
                Properties.Settings.Default.Save();
            }
        }

        private string _apiKey = String.Empty;
        public string ApiKey
        {
            get
            {
                return _apiKey;
            }
            set
            {
                if (value == ApiKey) return;

                _apiKey = value;
                NotifyPropertyChanged(nameof(ApiKey));

                Properties.Settings.Default.ApiKey = value;
                Properties.Settings.Default.Save();
            }
        }

        private string _appLocale = String.Empty;
        public ComboboxItem AppLocale
        {
            get
            {
                return new ComboboxItem { Value = _appLocale };
            }
            set
            {
                if (value == AppLocale) return;

                _appLocale = value.Value;
                NotifyPropertyChanged(nameof(AppLocale));

                Debug.Print($"LocaleChanged\t{_appLocale}");

                System.Threading.Thread.CurrentThread.CurrentUICulture = CultureInfo.GetCultureInfo(value.Value);

                Debug.Print($"CurrentCulture\t{LocaleStrings.Culture}");

                Properties.Settings.Default.AppLocale = value.Value;
                Properties.Settings.Default.Save();
            }
        }

        private bool _chartsEnabled = true;
        public bool ChartsEnabled
        {
            get
            {
                return _chartsEnabled;
            }
            set
            {
                if (value == ChartsEnabled) return;

                _chartsEnabled = value;
                NotifyPropertyChanged(nameof(ChartsEnabled));

                Properties.Settings.Default.ChartsEnabled = value;
                Properties.Settings.Default.Save();
            }
        }

        public static Dictionary<string, ComboboxItem> Themes{ get; set; } = new Dictionary<string, ComboboxItem>
        {
            ["light"] = new ComboboxItem { Label = LocaleStrings.SettingsThemeModeOptionLight, Value = "light" },
            ["dark"] = new ComboboxItem { Label = LocaleStrings.SettingsThemeModeOptionDark, Value = "dark" },
            ["system"] = new ComboboxItem { Label = LocaleStrings.SettingsThemeModeOptionSystem, Value = "system" }
        };

        public IEnumerable<ComboboxItem> ThemeModeCollection { get; set; } = Themes.ToList().Select(kvp => kvp.Value);

        public static Dictionary<string, ComboboxItem> Locales { get; set; } = new Dictionary<string, ComboboxItem>
        {
            ["en"] = new ComboboxItem { Label = LocaleStrings.ResourceManager.GetString("AppLocale", CultureInfo.GetCultureInfo("en")), Value = "en" },
            ["zh-TW"] = new ComboboxItem { Label = LocaleStrings.ResourceManager.GetString("AppLocale", CultureInfo.GetCultureInfo("zh-TW")), Value = "zh-TW" }
        };

        public IEnumerable<ComboboxItem> LocaleCollection { get; set; } = Locales.ToList().Select(kvp => kvp.Value);

        public SettingsViewModel(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        public void OnNavigatedTo()
        {
            if (!_isInitialized)
                InitializeViewModel();
        }

        public void OnNavigatedFrom()
        {
        }

        private void InitializeViewModel()
        {
            CurrentTheme = Themes[Properties.Settings.Default.AppTheme];
            AppVersion = $"rts_map - {GetAssemblyVersion()}";
            ApiKey = Properties.Settings.Default.ApiKey;
            AppLocale = Locales[Properties.Settings.Default.AppLocale];

            _isInitialized = true;
        }

        private string GetAssemblyVersion()
        {
            return System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? String.Empty;
        }

        public event PropertyChangedEventHandler PropertyChanged;
        private void NotifyPropertyChanged([CallerMemberName] String propName = "")
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(propName));
            }
        }
    }
}
