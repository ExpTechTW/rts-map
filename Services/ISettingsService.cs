using System;

using rts_map.Models;

namespace rts_map.Services
{
    public interface ISettingsService
    {
        event EventHandler SettingsChanged;
        UserSettings GetUserSettings();
        void UpdateUserSettings(UserSettings userSettings);
    }
}
