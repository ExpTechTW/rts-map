using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.Generic;
using Wpf.Ui.Common.Interfaces;

using rts_map.Models;
using rts_map.Services;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace rts_map.ViewModels
{
    public partial class SettingsViewModel : ObservableObject, INavigationAware, INotifyPropertyChanged
    {
        private readonly ISettingsService _settingsService; 

        private bool _isInitialized = false;

        [ObservableProperty]
        private string _appVersion = String.Empty;

        private Wpf.Ui.Appearance.ThemeType _currentTheme = Wpf.Ui.Appearance.ThemeType.Unknown;
        public string CurrentTheme
        {
            get {
                switch (_currentTheme)
                {
                    case Wpf.Ui.Appearance.ThemeType.Light:
                        return "light";

                    case Wpf.Ui.Appearance.ThemeType.Dark:
                        return "dark";

                    default:
                        return "system";
                }
            }
            set
            {
                if (value == CurrentTheme) return;

                UserSettings userSettings = _settingsService.GetUserSettings();

                switch (value)
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

                userSettings.AppSettings.AppTheme = value;
                _settingsService.UpdateUserSettings(userSettings);
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

                UserSettings userSettings = _settingsService.GetUserSettings();
                userSettings.AppSettings.ApiKey = value;
                _settingsService.UpdateUserSettings(userSettings);
            }
        }

        public IEnumerable<string> ComboCollection { get; set; } = new string[] {
            "light",
            "dark",
            "system"
        };

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
            CurrentTheme = _settingsService.GetUserSettings().AppSettings.AppTheme;
            AppVersion = $"rts_map - {GetAssemblyVersion()}";
            ApiKey = _settingsService.GetUserSettings().AppSettings.ApiKey;

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
