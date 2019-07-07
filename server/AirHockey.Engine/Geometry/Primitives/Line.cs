using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Geometry
{
    public struct Line
    {
        public Point P1 { get; }
        public Point P2 { get; }

        private double A => P1.Y - P2.Y;
        private double B => P2.X - P1.X;
        private double C => P1.X * (P2.Y - P1.Y) - P1.Y * (P2.X - P1.X);

        public Line(Point p1, Point p2)
        {
            P1 = p1;
            P2 = p2;
        }

        public Vector GetCollinearVector()
        {
            return new Vector(P2.X - P1.X, P2.Y - P1.Y);
        }

        public Line GetOrthogonalLine()
        {
            var v = GetCollinearVector();
            var w = v.GetOrthogonalVector();

            return new Line(new Point(0, 0), new Point(w.X, w.Y));
        }

        public Vector GetOrthogonalVector()
        {
            return GetCollinearVector().GetOrthogonalVector();
        }

        public double GetDistanceToPoint(Point p)
        {
            return Math.Abs(A * p.X + B * p.Y + C) / Math.Sqrt(A * A + B * B);
        }

        public Line GetParallelPassingThroughPoint(Point p)
        {
            var moveVect = Vector.FromTwoPoints(P1, p);
            return new Line(P1.AddVector(moveVect), P2.AddVector(moveVect));
        }
    }
}
