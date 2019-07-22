using System;
using System.Collections.Generic;
using System.Text;
using AirHockey.Engine.Utils;

namespace AirHockey.Engine.Geometry
{
    public struct Vector
    {
        public double X { get; }
        public double Y { get; }

        public double Modulus => Math.Sqrt(SquaredModulus());
        public bool IsZeroVector => X.AlmostZero() && Y.AlmostZero();

        public Vector(double x, double y)
        {
            X = x;
            Y = y;
        }

        public static Vector FromTwoPoints(Point p1, Point p2)
        {
            return new Vector(p2.X - p1.X, p2.Y - p1.Y);
        }
        public static Vector Zero { get; } = new Vector(0, 0);

        public Vector ProjectOn(Vector v)
        {
            var w = this;
            var proj = v.DotProduct(w) / v.SquaredModulus();
            return new Vector(proj * v.X, proj * v.Y);
        }

        public Vector ProjectOn(Line l)
        {
            var vectOnLine = l.GetCollinearVector();
            return ProjectOn(vectOnLine);
        }

        public Vector GetOrthogonalVector()
        {
            double wx, wy;

            if (X.AlmostZero())
            {
                // to avoid division by zero

                wx = 1;
                wy = -X / Y;
            }
            else
            {
                wx = -Y / X;
                wy = 1;
            }

            return new Vector(wx, wy);
        }

        public bool LooksInSameDirection(Vector v)
        {
            return DotProduct(v) > 0;
        }

        public bool LooksInDifferentDirection(Vector v)
        {
            return !LooksInSameDirection(v);
        }

        public Vector TurnAround()
        {
            return new Vector(-X, -Y);
        }

        public Vector Add(Vector v)
        {
            return new Vector(X + v.X, Y + v.Y);
        }

        public Vector MultiplyByScalar(double a)
        {
            return new Vector(X * a, Y * a);
        }

        public Vector ScaleTo(double targetModulus)
        {
            if (IsZeroVector)
            {
                // can't scale zero vector to anything
                return new Vector(0, 0);
            }

            if (targetModulus > 0)
            {
                return MultiplyByScalar(targetModulus / Modulus);
            }
            else
            {
                return MultiplyByScalar(-targetModulus / Modulus).TurnAround();
            }
        }

        private double DotProduct(Vector v)
        {
            return X * v.X + Y * v.Y;
        }

        private double SquaredModulus()
        {
            return DotProduct(this);
        }
    }
}
