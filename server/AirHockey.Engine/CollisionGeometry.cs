using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class CollisionGeometry
    {
        public CollisionGeometry(
            Line collisionLine, 
            (IGeometry geom, Vector fallback) first, 
            (IGeometry geom, Vector fallback) second)
        {
            CollisionLine = collisionLine;
            First = first;
            Second = second;
        }

        public Line CollisionLine { get; }
        public (IGeometry Geometry, Vector Fallback) First { get; }
        public (IGeometry Geometry, Vector Fallback) Second { get; }
    }
}
