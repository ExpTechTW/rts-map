using System;
using System.Diagnostics;
using System.IO;
using Newtonsoft.Json;

using rts_map.Models;

namespace rts_map.Services
{
    public class SettingsService : ISettingsService
    {
        public event EventHandler SettingsChanged;
        private readonly string _settingsFilePath = UserSettings.AppPropertiesFileName;

        public UserSettings GetUserSettings()
        {
            // Load the user settings from the JSON file
            if (File.Exists(_settingsFilePath))
            {
                var json = File.ReadAllText(_settingsFilePath);

                Trace.WriteLine(json);

                return JsonConvert.DeserializeObject<UserSettings>(json);
            }
            else
            {
                // Return default settings if the file doesn't exist
                return new UserSettings();
            }
        }

        public void UpdateUserSettings(UserSettings userSettings)
        {
            // Serialize the user settings to JSON
            var json = JsonConvert.SerializeObject(new { AppSettings = userSettings.AppSettings }, Formatting.Indented);

            // Save the JSON to the settings file
            File.WriteAllText(_settingsFilePath, json);

            if (SettingsChanged != null)
                SettingsChanged.Invoke(this, EventArgs.Empty);
        }
    }
}
