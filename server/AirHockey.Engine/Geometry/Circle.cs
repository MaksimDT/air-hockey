using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Geometry
{
    public class Circle : GeometryBase<Point>
    {
        public Point Center { get; private set; }
        public double Radius { get; }

        public Circle(Point center, double radius)
        {
            Center = center;
            Radius = radius;
        }

        protected override Point GetCurrentPosition()
        {
            return Center;
        }

        protected override void MoveInternal(Vector v)
        {
            Center = Center.AddVector(v);
        }

        protected override void RestorePrevPosition()
        {
            if (PositionsHistory.TryGetLastPosition(out var p))
            {
                Center = p;
            }
        }
    }
}
