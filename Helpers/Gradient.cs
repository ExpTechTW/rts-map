using Mapsui.Styles;
using System;
using System.Collections.Generic;

namespace rts_map.Helpers
{
    public class Gradient
    {
        private static readonly List<Color> GradientStops = new()
        {
            Color.FromString("#0500A3"), Color.FromString("#00ceff"), Color.FromString("#33ff34"),
            Color.FromString("#fdff32"), Color.FromString("#ff8532"), Color.FromString("#fc5235"),
            Color.FromString("#c03e3c"), Color.FromString("#9b4544"), Color.FromString("#9a4c86"),
            Color.FromString("#b720e9")
        };

        public static Color GetColor(double intensity)
        {
            if (intensity < 0)
            {
                return GradientStops[0];
            }
            else if (intensity > 9)
            {
                return GradientStops[9];
            }
            else
            {
                int prevIndex = (int)Math.Floor(intensity);
                int nextIndex = (int)Math.Ceiling(intensity);
                Color prev = GradientStops[prevIndex];
                Color next = GradientStops[nextIndex];
                double p = intensity / (nextIndex - prevIndex);
                return Color.FromArgb(1, (int)(prev.R * (1 - p) + next.R * p), (int)(prev.G * (1 - p) + next.G * p), (int)(prev.B * (1 - p) + next.B * p));
            }
        }
    }
}
