using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class CollisionInfo
    {
        public CollisionInfo(IGameObject go, Vector fallback, Vector velocity)
        {
            GameObject = go;
            FallbackVector = fallback;
            Velocity = velocity;
        }

        public IGameObject GameObject { get; }

        public Vector FallbackVector { get; }

        public Vector Velocity { get; }
    }
}
