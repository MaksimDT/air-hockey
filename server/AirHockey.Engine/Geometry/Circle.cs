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

        public override CollisionGeometry GetCollisionGeometry(IGeometry other)
        {
            if (other is LineSegment line)
            {
                return CalculateCollisionWithLine(line);
            }
            else if (other is Circle circle)
            {
                return CalculateCollisionWithCircle(circle);
            }
            else
            {
                throw new NotImplementedException();
            }
        }

        private CollisionGeometry CalculateCollisionWithCircle(Circle other)
        {
            var distanceBtwCenters = Center.DistanceTo(other.Center);

            if (distanceBtwCenters <= Radius + other.Radius)
            {
                var lineConnectingCenters = new Line(Center, other.Center);
                var cl = lineConnectingCenters.GetOrthogonalLine();

                var collisionDepth = Radius + other.Radius - Center.DistanceTo(other.Center);

                // HACK: adding 1 because of rounding errors
                var fallbackVector1 = Vector.FromTwoPoints(other.Center, Center).ScaleTo(collisionDepth + 1);
                var fallbackVector2 = fallbackVector1.TurnAround();

                return new CollisionGeometry(cl, fallbackVector1, fallbackVector2);
            }

            return null;
        }

        private CollisionGeometry CalculateCollisionWithLine(LineSegment line)
        {
            var A = line.P1;
            var B = line.P2;

            var AB = new Vector(B.X - A.X, B.Y - A.Y);
            var AX = new Vector(Center.X - A.X, Center.Y - A.Y);

            var proj = AX.ProjectOn(AB);

            //find the point closest to the circle's center

            Point closestPoint;
            var onLineEdge = false;

            if (proj.LooksInSameDirection(AB))
            {
                closestPoint = A;
                onLineEdge = false;
            }
            else if (proj.Modulus < AB.Modulus)
            {
                //the closest point is the end of projection of AX to AB
                closestPoint = A.AddVector(proj);
            }
            else
            {
                onLineEdge = true;
                closestPoint = B;
            }

            if (closestPoint.DistanceTo(Center) <= Radius)
            {
                // collision actually occured
                Line cl;

                if (onLineEdge)
                {
                    var l = new Line(closestPoint, Center);
                    cl = l.GetOrthogonalLine().GetParallelPassingThroughPoint(closestPoint);
                }
                else
                {
                    cl = new Line(A, B);
                }

                var collisionDepth = Radius - cl.GetDistanceToPoint(Center);
                // HACK: adding +1 because of rounding errors
                var fallbackVector1 = cl.GetOrthogonalVector().ScaleTo(collisionDepth + 1);
                var fallbackVector2 = fallbackVector1.TurnAround();

                return new CollisionGeometry(cl, fallbackVector1, fallbackVector2);
            }

            return null;
        }
    }
}
