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
            Vector fallback1, 
            Vector fallback2)
        {
            CollisionLine = collisionLine;
            Fallback1 = fallback1;
            Fallback2 = fallback2;
        }

        public Line CollisionLine { get; }
        public Vector Fallback1 { get; }
        public Vector Fallback2 { get; }

        public CollisionGeometry Flip()
        {
            return new CollisionGeometry(CollisionLine, Fallback2, Fallback1);
        }
    }
}
