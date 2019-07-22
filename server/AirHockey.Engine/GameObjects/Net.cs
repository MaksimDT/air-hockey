using System;
using System.Collections.Generic;
using System.Text;
using AirHockey.Engine.Geometry;

namespace AirHockey.Engine.GameObjects
{
    public class Net : Wall
    {
        private readonly Player _owner;

        public Net(LineSegment geometry, Player owner) 
            : base(geometry, new[] { 0, 3 })
        {
            _owner = owner;
        }
    }
}
