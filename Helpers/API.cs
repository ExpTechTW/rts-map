using Newtonsoft.Json;
using rts_map.DataModels;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace rts_map.Helpers
{
    public class API
    {

        public static async Task<Dictionary<string, StationData>?> GetStationData()
        {
            try
            {
                //We will now define your HttpClient with your first using statement which will use a IDisposable.
                using (HttpClient client = new HttpClient())
                {
                    //In the next using statement you will initiate the Get Request, use the await keyword so it will execute the using statement in order.
                    using (HttpResponseMessage res = await client.GetAsync("https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json"))
                    {
                        //Then get the content from the response in the next using statement, then within it you will get the data, and convert it to a c# object.
                        using (HttpContent content = res.Content)
                        {
                            //Now assign your content to your data variable, by converting into a string using the await keyword.
                            var data = await content.ReadAsStringAsync();
                            //If the data isn't null return log convert the data using newtonsoft JObject Parse class method on the data.
                            if (data != null)
                            {
                                return JsonConvert.DeserializeObject<Dictionary<string, StationData>>(data);
                                //Now log your data in the console
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Trace.WriteLine(exception);
            }

            return null;
        }
    }
}
