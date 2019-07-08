using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Geometry
{
    public class LineSegment : GeometryBase<(Point P1, Point P2)>
    {
        public Point P1 { get; private set; }
        public Point P2 { get; private set; }

        public LineSegment(Point p1, Point p2)
        {
            P1 = p1;
            P2 = p2;
        }

        public Line GetLine()
        {
            return new Line(P1, P2);
        }

        protected override (Point, Point) GetCurrentPosition()
        {
            return (P1, P2);
        }

        protected override void RestorePrevPosition()
        {
            if (PositionsHistory.TryGetLastPosition(out var pos))
            {
                P1 = pos.P1;
                P2 = pos.P2;
            }
        }

        protected override void MoveInternal(Vector v)
        {
            P1 = P1.AddVector(v);
            P2 = P2.AddVector(v);
        }

        public override CollisionGeometry GetCollisionGeometry(IGeometry other)
        {
            if (other is Circle)
            {
                var cg = other.GetCollisionGeometry(this);
                return cg?.Flip();
            }
            else if (other is LineSegment)
            {
                // TODO: implement line-line collision detection
                return null;
            }
            else
            {
                throw new NotImplementedException();
            }
        }
    }
}
