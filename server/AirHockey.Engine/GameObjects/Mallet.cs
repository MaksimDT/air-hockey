using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AirHockey.Engine.GameObjects
{
    public class Mallet : GameObject<Circle, Point>
    {
        public Mallet(Circle geometry, Vector velocity, MoveContext moveCtx) 
            : base(geometry, Vector.Zero, moveCtx, Enumerable.Empty<int>())
        {
        }

        public void Accelerate(Vector v)
        {
            MoveCtx.Acceleration = v;
        }

        protected override bool FallsBack(IGameObject other)
        {
            return !(other is Ball) || other.InCollision;
        }
    }
}
