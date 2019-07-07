using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Utils
{
    public static class DoubleExt
    {
        public static bool AlmostZero(this double d, double epsilon = 0.0001)
        {
            return Math.Abs(d) <= epsilon;
        }
    }
}
