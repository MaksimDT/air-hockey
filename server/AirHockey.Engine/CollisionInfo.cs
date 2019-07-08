using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class CollisionInfo
    {
        public Vector Fallback1 { get; }
        public Vector Velocity1 { get; }
        public Vector Fallback2 { get; }
        public Vector Velocity2 { get; }

        public CollisionInfo(
            Vector fallback1, 
            Vector velocity1, 
            Vector fallback2, 
            Vector velocity2)
        {
            Fallback1 = fallback1;
            Velocity1 = velocity1;
            Fallback2 = fallback2;
            Velocity2 = velocity2;
        }

        public CollisionInfo Flip()
        {
            return new CollisionInfo(Fallback2, Velocity2, Fallback1, Velocity1);
        }
    }
}
