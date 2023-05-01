namespace rts_map.DataModels
{
    public class StationData
    {
        public string? Uuid { get; set; }
        public float Lat { get; set; }
        public float Long { get; set; }
        public int PGA { get; set; }
        public string? Loc { get; set; }
        public string? Area { get; set; }
    }
}
