using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AirHockey.Engine.GameObjects
{
    public class Wall : GameObject<LineSegment, (Point P1, Point P2)>
    {
        public Wall(LineSegment geometry, IEnumerable<int> collisionGroups = null) 
            : base(geometry, new Vector(0, 0), new MoveContext(), collisionGroups ?? Enumerable.Empty<int>())
        {
        }

        protected override bool FallsBack(IGameObject other) => false;
    }
}
