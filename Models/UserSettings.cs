using System.ComponentModel;

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
        private string _appTheme = "system";
        private string _apiKey = "";
        private bool _chartsEnabled = true;

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
        

        public bool ChartsEnabled
        {
            get => _chartsEnabled;
            set
            {
                _chartsEnabled = value;
                OnPropertyChanged(nameof(ChartsEnabled));
            }
        }

        public AppSettings()
        {
            ApiKey = "";
            AppTheme = "system";
            ChartsEnabled = true;
        }


        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
