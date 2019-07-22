using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AirHockey.Engine.GameObjects
{
    public class Ball : GameObject<Circle, Point>
    {
        public Ball(Circle geometry, Vector velocity, MoveContext moveCtx) 
            : base(geometry, velocity, moveCtx, new[] { 0, 3 })
        {
        }

        protected override bool FallsBack(IGameObject other) => true;
    }
}
