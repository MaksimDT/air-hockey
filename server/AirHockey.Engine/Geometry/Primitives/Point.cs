using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Geometry
{
    public struct Point
    {
        public double X { get; }
        public double Y { get; }

        public Point(double x, double y)
        {
            X = x;
            Y = y;
        }

        public double DistanceTo(Point p)
        {
            return Math.Sqrt((X - p.X) * (X - p.X) + (Y - p.Y) * (Y - p.Y));
        }

        public Point AddVector(Vector v)
        {
            return new Point(X + v.X, Y + v.Y);
        }
    }
}
