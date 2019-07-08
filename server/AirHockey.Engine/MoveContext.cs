using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class MoveContext
    {
        public double MaxVelocity { get; }

        public double MinVelocity { get; }

        public double DampingCoeff { get; }

        public Vector Acceleration { get; set; }

        public MoveContext(double maxVelocity = 10, double minVelocity = 0, double dampingCoeff = 1.2)
        {
            MaxVelocity = maxVelocity;
            MinVelocity = minVelocity;
            DampingCoeff = dampingCoeff;
        }
    }
}
