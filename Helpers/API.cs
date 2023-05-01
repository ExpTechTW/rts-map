using Newtonsoft.Json;
using rts_map.DataModels;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;

namespace rts_map.Helpers
{
    public class API
    {

        public static async Task<Dictionary<string, StationData>?> GetStationData()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    using (HttpResponseMessage res = await client.GetAsync("https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json"))
                    {
                        res.EnsureSuccessStatusCode();
                        using (HttpContent content = res.Content)
                        {
                            var data = await content.ReadAsStringAsync();

                            if (data != null)
                            {
                                return JsonConvert.DeserializeObject<Dictionary<string, StationData>>(data);
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Debug.Print($"HttpClient\t{exception}");
            }

            return null;
        }
    }
}
