using System.Collections.Generic;

namespace rts_map.DataModels
{
    public class SocketRawData
    {
        public int state{ get; set; }
        public string response { get; set; }
        public string type { get; set; }
        public object raw { get; set; }
        public long time { get; set; }
    }
}
