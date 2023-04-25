using System;
using System.ComponentModel;
using System.IO;

namespace rts_map.Models
{
    public class UserSettings
    {
        public static string AppPropertiesFileName { get; set; } = "appsettings.json";

        public AppSettings AppSettings { get; set; }

        public UserSettings()
        {
            AppSettings = new AppSettings();
        }
    }

    public class AppSettings : INotifyPropertyChanged
    {
        private string _appTheme;
        private string _apiKey;

        public string AppTheme
        {
            get => _appTheme;
            set
            {
                _appTheme = value;
                OnPropertyChanged(nameof(AppTheme));
            }
        }

        public string ApiKey
        {
            get => _apiKey;
            set
            {
                _apiKey = value;
                OnPropertyChanged(nameof(ApiKey));
            }
        }

        public AppSettings()
        {
            ApiKey = "";
            AppTheme = "system";
        }


        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
